import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Život u Medresi: Albanian and English keep the Bosnian card's lines; Bosnian has nothing to fit", () => {
  const page = readFileSync("src/app/[locale]/page.tsx", "utf8");
  assert.match(page, /reference=\{locale === "bs" \? undefined : \{ heading: getDictionary\("bs"\)\.life\.stack\.heading, text: getDictionary\("bs"\)\.life\.stack\.text \}\}/);
  const stack = readFileSync("src/components/sections/LifeStack.tsx", "utf8");
  // The measure is never seen nor read aloud, and fitting only ever scales type down, never cuts it.
  assert.match(stack, /<div aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0">/);
  assert.match(stack, /const FIT_MIN = 0\.75;/);
  assert.doesNotMatch(stack, /line-clamp|text-ellipsis|truncate/);
  // Heading and text share one set of classes with their measure.
  assert.equal(stack.match(/className=\{HEADING\}|\$\{HEADING\}/g).length, 2);
  assert.equal(stack.match(/className=\{TEXT\}|\$\{TEXT\}/g).length, 2);
});
