import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

const { seasonalScript, seasonalSettings } = moduleLoader()("src/seasonal/config");

/** Runs the pre-paint script against a fake page; returns the theme it leaves on <html>. */
function run(script, { path = "/", search = "", cookie = "" } = {}) {
  const dataset = {};
  const document = { documentElement: { dataset }, cookie };
  const location = { pathname: path, search };
  Object.defineProperty(document, "cookie", {
    get: () => cookie,
    // A cookie jar: setting a name replaces its value.
    set: (v) => {
      const pair = v.split(";")[0];
      const rest = cookie.split("; ").filter((c) => c && c.split("=")[0] !== pair.split("=")[0]);
      cookie = [...rest, pair].join("; ");
    },
  });
  new Function("document", "location", "URLSearchParams", script)(document, location, URLSearchParams);
  return dataset.seasonalTheme ?? null;
}

test("seasonal editions are off by default: the site is its original self", () => {
  assert.equal(seasonalSettings.active, null);
  assert.equal(run(seasonalScript(null, false), { search: "?ramadan=1" }), null, "production ignores the preview switch");
});

test("previews: ?ramadan=1 / ?ramadan=0 switch the Ramadan edition, remembered in a cookie", () => {
  const script = seasonalScript(null, true);
  assert.equal(run(script), null);
  assert.equal(run(script, { search: "?ramadan=1" }), "ramadan");
  assert.equal(run(script, { cookie: "medresa-seasonal-preview=1" }), "ramadan");
  assert.equal(run(script, { cookie: "medresa-seasonal-preview=1", search: "?ramadan=0" }), null);
});

test("an active edition reaches every public page, never the admin areas", () => {
  const script = seasonalScript("ramadan", false);
  for (const path of ["/", "/sq/lajme", "/en/news/x", "/kucni-red"]) assert.equal(run(script, { path }), "ramadan", path);
  for (const path of ["/admin", "/admin-preview/1", "/ulaz7"]) assert.equal(run(script, { path }), null, path);
});

test("Ramadan styles are scoped: every rule is the theme's own or keeps a seasonal element hidden", () => {
  const css = readFileSync("src/seasonal/ramadan.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = css
    .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "")
    .match(/[^{}@;]+(?=\{)/g)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("(") && !/^(from|to|\d+%|media|supports)\b/.test(s));
  for (const s of selectors)
    // Either scoped to the theme, or about a seasonal element itself (all hidden by .rmd).
    assert.ok(s.includes('[data-seasonal-theme="ramadan"]') || /^\.rmd(-[a-z-]+)?([[\s,:]|$)/.test(s), s);
});

/* ---------- The thirty hadiths and the day of Ramadan ---------- */

const { hadiths, hadithReady } = moduleLoader()("src/seasonal/hadiths");

test("thirty hadiths, one per day, each complete in Bosnian, Albanian and English", () => {
  assert.deepEqual(
    hadiths.map((h) => h.day),
    Array.from({ length: 30 }, (_, i) => i + 1),
  );
  const refs = hadiths.map((h) => `${h.collection} ${h.reference}`);
  assert.equal(new Set(refs).size, 30, "no hadith twice");
  for (const h of hadiths) {
    assert.ok(["bukhari", "muslim", "tirmidhi"].includes(h.collection), h.day);
    assert.ok(h.arabic.length > 20 && /[؀-ۿ]/.test(h.arabic), `Arabic, day ${h.day}`);
    for (const l of ["bs", "sq", "en"]) {
      const t = h.text[l];
      assert.ok(t.length > 30, `${l} ${h.day}`);
      assert.doesNotMatch(t, /…|\.\.\.\s*$/, `never shortened: ${l} ${h.day}`);
      assert.ok(h.narrator[l], `narrator ${l} ${h.day}`);
    }
    // Only the English is a published translation; the others wait for review.
    assert.equal(h.translation.en.status, "published");
    assert.equal(h.translation.bs.status, "draft");
    assert.equal(h.translation.sq.status, "draft");
  }
});

test("unapproved hadiths never reach production", () => {
  for (const l of ["bs", "sq", "en"]) assert.equal(hadithReady(l), false, l);
});

/** The day the pre-paint script picks, at a given instant. */
function dayAt(iso, { calendar, preview = false, search = "", cookie = "" } = {}) {
  const dataset = {};
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [iso]));
    }
    static parse(s) {
      return RealDate.parse(s);
    }
  }
  const document = { documentElement: { dataset } };
  Object.defineProperty(document, "cookie", { get: () => cookie, set: (v) => (cookie = [cookie, v.split(";")[0]].filter(Boolean).join("; ")) });
  new Function("document", "location", "URLSearchParams", "Date", seasonalScript("ramadan", preview, calendar))(
    document,
    { pathname: "/", search },
    URLSearchParams,
    FixedDate,
  );
  return dataset.ramadanDay ?? null;
}

const thirty = { start: "2027-02-08", days: 30, timeZone: "Europe/Podgorica" };
const twentyNine = { ...thirty, days: 29 };

test("the day of Ramadan follows the local date in Podgorica, midnight to midnight", () => {
  assert.equal(dayAt("2027-02-07T22:59:00Z", { calendar: thirty }), null, "23:59 the evening before");
  assert.equal(dayAt("2027-02-07T23:00:00Z", { calendar: thirty }), "1", "00:00 on the first day");
  assert.equal(dayAt("2027-02-08T22:59:00Z", { calendar: thirty }), "1");
  assert.equal(dayAt("2027-02-08T23:00:00Z", { calendar: thirty }), "2");
  assert.equal(dayAt("2027-03-09T22:59:00Z", { calendar: thirty }), "30");
  assert.equal(dayAt("2027-03-09T23:00:00Z", { calendar: thirty }), null, "Ramadan is over");
});

test("a 29-day Ramadan ends after day 29; day 30 is kept for 30-day years", () => {
  assert.equal(dayAt("2027-03-08T12:00:00Z", { calendar: twentyNine }), "29");
  assert.equal(dayAt("2027-03-09T12:00:00Z", { calendar: twentyNine }), null);
  assert.equal(dayAt("2027-03-09T12:00:00Z", { calendar: thirty }), "30");
});

test("daylight saving: the day still turns at local midnight", () => {
  // Summer time, UTC+2: local midnight is 22:00 UTC.
  const summer = { start: "2026-03-30", days: 30, timeZone: "Europe/Podgorica" };
  assert.equal(dayAt("2026-03-30T21:59:00Z", { calendar: summer }), "1");
  assert.equal(dayAt("2026-03-30T22:00:00Z", { calendar: summer }), "2");
});

test("previews may pick a day; production ignores it", () => {
  const out = "2026-11-04T12:00:00Z";
  assert.equal(dayAt(out, { calendar: thirty }), null, "production: outside Ramadan");
  assert.equal(dayAt(out, { calendar: thirty, preview: true }), "1", "previews show day 1 outside Ramadan");
  assert.equal(dayAt(out, { calendar: thirty, preview: true, search: "?ramadan-day=17" }), "17");
  assert.equal(dayAt(out, { calendar: twentyNine, preview: true, search: "?ramadan-day=30" }), null, "no day 30 in a 29-day year");
  assert.equal(dayAt(out, { calendar: thirty, search: "?ramadan-day=17" }), null);
});
