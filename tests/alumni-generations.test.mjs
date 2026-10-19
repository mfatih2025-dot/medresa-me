import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';

const load = moduleLoader();
const { generations, generationPath, generationPaths, generationBySlug } = load('src/content/alumni');
const { generationPathIn } = load('src/content/alumni-routes');
const { legacyRedirects } = load('src/seo/legacy');
const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];

test('every generation has its permanent page in BS, SQ and EN', () => {
  assert.deepEqual(generations.map((g) => g.roman), roman);
  for (const g of generations) {
    const r = g.roman.toLowerCase();
    assert.deepEqual(generationPaths(g), { bs: `/alumni/generacija-${r}`, sq: `/sq/alumni/gjenerata-${r}`, en: `/en/alumni/generation-${r}` });
    for (const l of ['bs', 'sq', 'en']) {
      const slug = generationPath(g, l).split('/').pop();
      assert.equal(generationBySlug(slug, l).generation, g);
      assert.equal(generationBySlug(slug, l).exact, true);
    }
    // Another language's slug finds the same generation (and is redirected), never a neighbour.
    assert.equal(generationBySlug(`generation-${r}`, 'bs').generation, g);
    assert.equal(generationBySlug(`generation-${r}`, 'bs').exact, false);
  }
  for (const slug of ['generacija-xvi', 'generacija-7', 'generacija-', 'generacija-iiii', 'alumni']) assert.equal(generationBySlug(slug, 'bs'), null);
});

test('the language switch keeps the generation', () => {
  for (const g of generations) for (const from of ['bs', 'sq', 'en']) for (const to of ['bs', 'sq', 'en'])
    assert.equal(generationPathIn(generationPath(g, from), to), generationPath(g, to));
  assert.equal(generationPathIn('/alumni', 'en'), null);
  assert.equal(generationPathIn('/vijesti/generacija-i', 'en'), null);
});

test('the printed QR codes encode exactly each generation\'s BS page on www.medresa.me', () => {
  const m = JSON.parse(readFileSync('public/qr/alumni/manifest.json', 'utf8'));
  assert.equal(m.site, 'https://www.medresa.me');
  assert.equal(m.errorCorrection, 'H');
  assert.deepEqual(m.generations.map((x) => x.url), generations.map((g) => `https://www.medresa.me${generationPath(g, 'bs')}`));
  for (const x of m.generations) assert.doesNotMatch(x.url, /vercel|localhost|supabase|preview/);
});

test('the old site\'s generation pages are sent to the same generation', () => {
  const r = legacyRedirects();
  for (const g of generations) {
    const old = new URL(g.source.page).pathname.replace(/\/$/, '');
    assert.equal(r.find((x) => x.source === old)?.destination, generationPath(g, 'bs'));
    assert.equal(r.find((x) => x.source === `/en${old}`)?.destination, generationPath(g, 'en'));
  }
});
