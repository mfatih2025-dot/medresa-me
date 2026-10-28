import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

const load = moduleLoader();
const { dictionaries } = load("src/content");
const { pathFor } = load("src/i18n/routes");

test("„← Početna“ is labelled in each language and leads to that language's homepage", () => {
  assert.deepEqual(
    Object.fromEntries(["bs", "sq", "en"].map((l) => [l, dictionaries[l].ui.homeLink])),
    { bs: "Početna", sq: "Ballina", en: "Home" },
  );
  assert.deepEqual(["bs", "sq", "en"].map((l) => pathFor(null, l)), ["/", "/sq", "/en"]);
});

test("one shared control, rendered once for every page; pages with their own way back opt out", () => {
  const shell = readFileSync("src/app/_shell/Shell.tsx", "utf8");
  assert.equal(shell.match(/<HomeLink /g)?.length, 1);
  const link = readFileSync("src/components/layout/HomeLink.tsx", "utf8");
  assert.match(link, /pathFor\(null, locale\)/);
  assert.match(link, /min-h-11/, "44 px touch target");
  assert.match(readFileSync("src/app/globals.css", "utf8"), /main:has\(\[data-back-nav\]\) \.home-link \{\s*display: none;/);
  assert.match(link, /function isArticle/, "news articles keep only their own „Sve vijesti“");
  for (const f of ["src/components/alumni/GenerationPage.tsx", "src/components/i18n/NotFoundBody.tsx"])
    assert.equal(readFileSync(f, "utf8").match(/data-back-nav/g)?.length, 1, f);
});
