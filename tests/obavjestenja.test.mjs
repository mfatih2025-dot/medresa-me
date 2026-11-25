import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

const load = moduleLoader();
const { announcements, sortedAnnouncements } = load("src/content/obavjestenja");
const { pathFor } = load("src/i18n/routes");

test("Obavještenja: /obavjestenja, /sq/njoftime, /en/announcements", () => {
  assert.deepEqual(["bs", "sq", "en"].map((l) => pathFor("obavjestenja", l)), ["/obavjestenja", "/sq/njoftime", "/en/announcements"]);
});

test("every document is an existing original PDF of the declared size, shown on every language's page", () => {
  for (const a of announcements) {
    for (const d of a.documents) {
      const file = `public${d.file}`;
      assert.ok(existsSync(file), file);
      assert.equal(statSync(file).size, d.bytes, file);
      assert.equal(readFileSync(file).subarray(0, 5).toString(), "%PDF-", file);
      assert.ok(existsSync(`public${d.preview.src}`), d.preview.src);
      assert.match(d.downloadName, /^[A-Za-z0-9-]+\.pdf$/);
    }
    for (const l of ["bs", "sq", "en"]) {
      assert.deepEqual([...a.order[l]].sort(), a.documents.map((d) => d.id).sort(), `${a.id} ${l}`);
      assert.ok(a.title[l] && a.summary[l] && existsSync(`public${a.share[l].src}`), `${a.id} ${l}`);
    }
  }
});

test("the first announcement's originals are unchanged; its page language comes first", () => {
  const a = announcements.find((x) => x.id === "2026-11-25-prijava-maturskih-ispita");
  const sha = (id) => createHash("sha256").update(readFileSync(`public${a.documents.find((d) => d.id === id).file}`)).digest("hex");
  assert.equal(sha("mne"), "fe1e040df26bcf77e256a4fb1dc09b9e242ebccdba41c3b3bcf01e916c7676db");
  assert.equal(sha("alb"), "33df2a3d19d63ea679c4840a4559c78b9cd73f29ac0a2eba844f4d2e152aa38f");
  assert.deepEqual(a.order.bs, ["mne", "alb"]);
  assert.deepEqual(a.order.sq, ["alb", "mne"]);
  assert.equal(a.pinned, true);
  assert.equal(sortedAnnouncements()[0].id, a.id);
});
