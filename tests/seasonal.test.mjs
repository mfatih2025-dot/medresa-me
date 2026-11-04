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
