import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

/*
 * ALUMNI QR INTEGRITY. Each generation's pano carries a printed QR code: its address can never change.
 * The table below is written out by hand, not derived from the code it checks: the addresses were
 * decoded from the printed pano (110 × 81.5 cm print file) and the old pages read on the old
 * WordPress site (title „Generacija N (Otvori pano)“ and its pano image), October 2026.
 * If a test here fails, a printed QR code or an old link no longer opens its own generation.
 */
const load = moduleLoader();
const { generations, generationPaths, generationBySlug } = load("src/content/alumni");
const { legacyRedirects, gonePaths } = load("src/seo/legacy");

// [number, Roman numeral, the generation's page on the old WordPress site]
const table = [
  [ 1, "I", "/generacija/generacija1/"],
  [ 2, "II", "/generacija/generacija2/"],
  [ 3, "III", "/generacija/generacija3/"],
  [ 4, "IV", "/generacija/generacija-iv-otvori-pano/"],
  [ 5, "V", "/generacija/generacija-v-otvori-pano/"],
  [ 6, "VI", "/generacija/generacija-vi-otvori-pano/"],
  [ 7, "VII", "/generacija/generacija-vii-otvori-pano/"],
  [ 8, "VIII", "/generacija/generacija-viii-otvori-pano/"],
  [ 9, "IX", "/generacija/generacija-ix-otvori-pano/"],
  [10, "X", "/generacija/generacija-x-otvori-pano/"],
  [11, "XI", "/generacija/generacija-xi-otvori-pano/"],
  [12, "XII", "/generacija/generacija-xii-otvori-pano/"],
  [13, "XIII", "/generacija/generacija-xiii-otvori-pano/"],
  [14, "XIV", "/generacija/generacija-xiv-otvori-pano/"],
  [15, "XV", "/generacija/generacija-xv-otvori-pano/"],
];
const SITE = "https://www.medresa.me";
const pages = (r) => ({ bs: `/alumni/generacija-${r}`, sq: `/sq/alumni/gjenerata-${r}`, en: `/en/alumni/generation-${r}` });
const prefix = { bs: "", sq: "/sq", en: "/en" };

test("15 generations, in order, each with its own permanent page in BS, SQ and EN", () => {
  assert.equal(generations.length, table.length);
  for (const [i, [n, roman]] of table.entries()) {
    const g = generations[i], r = roman.toLowerCase();
    assert.equal(g.number, n); assert.equal(g.roman, roman);
    assert.deepEqual(generationPaths(g), pages(r));
    for (const [l, p] of Object.entries(pages(r))) assert.equal(generationBySlug(p.split("/").pop(), l)?.generation.number, n);
  }
});

test("every printed QR code opens exactly its own generation's permanent page", () => {
  const m = JSON.parse(readFileSync("public/qr/alumni/manifest.json", "utf8"));
  assert.equal(m.site, SITE);
  assert.equal(m.generations.length, table.length);
  for (const [i, [n, roman]] of table.entries()) {
    const e = m.generations[i], r = roman.toLowerCase();
    assert.deepEqual([e.number, e.generation, e.url], [n, roman, `${SITE}/alumni/generacija-${r}`]);
    assert.deepEqual([e.master, e.badge], [`masters/generacija-${r}`, `badges/generacija-${r}`]);
  }
});

test("the QR code files are the printed ones, unchanged", () => {
  for (const [file, sha] of Object.entries(qrFiles))
    assert.equal(createHash("sha256").update(readFileSync(`public/qr/alumni/${file}`)).digest("hex"), sha, file);
  assert.equal(Object.keys(qrFiles).length, table.length * 4);
});

test("every old WordPress generation page (BS, SQ, EN) has exactly one 301, to the same generation", () => {
  const rules = legacyRedirects();
  for (const [n, roman, old] of table) {
    const r = roman.toLowerCase();
    for (const [l, p] of Object.entries(pages(r))) {
      const source = prefix[l] + old.replace(/\/$/, "");
      const hits = rules.filter((x) => x.source === source);
      assert.equal(hits.length, 1, `${source}: exactly one rule`);
      assert.deepEqual([hits[0].destination, hits[0].statusCode], [p, 301], `generation ${n}, ${l}`);
    }
  }
  // Nothing redirects the permanent pages themselves, and no old generation page is answered 410.
  const permanent = new Set(table.flatMap(([, roman]) => Object.values(pages(roman.toLowerCase()))));
  assert.equal(rules.filter((x) => permanent.has(x.source.replace(/\/$/, ""))).length, 0);
  assert.ok(!gonePaths.some((p) => /generacij|alumni/.test(p)));
  const generationRules = rules.filter((x) => x.source.includes("/generacija/"));
  assert.equal(generationRules.length, table.length * 3);
  assert.equal(new Set(generationRules.map((x) => x.source)).size, generationRules.length);
});

/** SHA-256 of every QR master and print badge, as printed (October 2026). */
const qrFiles = {
  "masters/generacija-i.svg": "1c49b854d974dc3690f24b5408e602e3d04b59899fdcb00c5879728c58b7f599",
  "masters/generacija-i.png": "1d3006f7e20da0d0f563821171619806f9edee40faccf0d3554aa59b7a0e0918",
  "badges/generacija-i.svg": "171dcc0de1c7efbc92d8aaedaaadd611d7e19c6c394a55f4a7e0cee56669757f",
  "badges/generacija-i.png": "0bc195fd5721b4c70b8f6932553ca26d5a4b33d8df1a94cfc0ef5c382af87e19",
  "masters/generacija-ii.svg": "b8393a868bed604c2cf81fcfad9265163749a378a86fe355bd9b9bcad74bfeb5",
  "masters/generacija-ii.png": "537ccc2cb25e91f639d03db5557179d2a91ed4890fd8ba38e2b7cee780a44f09",
  "badges/generacija-ii.svg": "9bce809673c822044ea0549e91402ab13684007e3d4c8b1c565575a017f3fca9",
  "badges/generacija-ii.png": "f472d07fce8803498b3b92310b622a0cd2843bebe63ae9f41effa776fb6c0938",
  "masters/generacija-iii.svg": "5902cbd902b9c52d586a473b12af156c4c273eb8c0605732ae91da4b3c9cc96c",
  "masters/generacija-iii.png": "b98ea23a325454a1ddd86a2ebbb5131a1f94bf5a6f2ccab59b3b108ec4915901",
  "badges/generacija-iii.svg": "524a09b844008eae8614cdb3035a28d3ae0f812c9d269cc6d700725156844a44",
  "badges/generacija-iii.png": "f1a6ef8b1021c4c4b3b1237d504519c42cbf41ed80c3148ccdc90a28d88849eb",
  "masters/generacija-iv.svg": "06be931694cf425386e298497e9231bdc4e35b281e215836103ba5b2d503107c",
  "masters/generacija-iv.png": "a50b023268efa8c4861a080d5ab0625d75149d07877d060123718abcf415a04d",
  "badges/generacija-iv.svg": "c33b1e0b5d8d1df7a077e46cd9609d65d9102cecd3d8f4a4ce727e4f764696fc",
  "badges/generacija-iv.png": "19c51ce44d3a9b74c19c42628b47d25d5fccb086aae1543cf3604c58d258576f",
  "masters/generacija-v.svg": "0f3e513e1aef5c867e661b6ec74e77640362284be5c27dc532202b049256be3c",
  "masters/generacija-v.png": "ebc7013d20c80b2a889f15e47d74ffb4a90dff8b6eb3b46c1bfe335fa1877581",
  "badges/generacija-v.svg": "629c7384b0255d416ae8c8fd8fa74a09bc08debd7663921bea8af1ef562bf156",
  "badges/generacija-v.png": "4dcb82c0faf3f4445c6b21151fc5e138dbe7ae8b44b9225cc1c16f45100b6355",
  "masters/generacija-vi.svg": "38e14d8dbe909c6dbf774a4e807e08036e589dcdeb5fd7a6fb382522636d6dc0",
  "masters/generacija-vi.png": "328e4c6c75cff9e2c97c747946638233c550dedccf16974f1bd91cf4a71bc696",
  "badges/generacija-vi.svg": "e06de96c9885d613221edab09d3974b620d6c1c35f6edae79faea9fe698a0e82",
  "badges/generacija-vi.png": "7627b4c1b962f816fc54022e4119db347d3a3a30cc683148c60fd136455781ac",
  "masters/generacija-vii.svg": "0ef83b78ded1ffd0b290291cb3bdcf02dfb3b2c2e81e83b17b3633db9d9d3f97",
  "masters/generacija-vii.png": "68bf443e91a98a5bc8ddcf38fa572b4493cc81c8c1528736ff52be654996b827",
  "badges/generacija-vii.svg": "44463dab82aaae460f9c3ae65fa924d00a1d6621a6ed925746f6cf7d96c02b33",
  "badges/generacija-vii.png": "30ad8e25eee137fc5cd2cd8f1fbc24c71a38c834a91b20ea5b13a835a8c155bb",
  "masters/generacija-viii.svg": "7e9fbca06c03d1bc0635796749478afd88e74a930d691a4339aa9e76eaf9a0f6",
  "masters/generacija-viii.png": "c7a926180b629d2744951afcf60112ad41079133da2557a0914cb1d7b10e694e",
  "badges/generacija-viii.svg": "05d9466a65569a2f377f3ee49ff2253f4314fb4b90913ab23d4433790d7248c4",
  "badges/generacija-viii.png": "5e36ecaf75b53696a61b6589503b57a7af311f4a14c7bf0c75684f122558aa44",
  "masters/generacija-ix.svg": "05977416858e7453d0bfecf0047b8983669458e98dc95da8e163c80d6fbc75b2",
  "masters/generacija-ix.png": "df9534dd599b5bcef74baa4355c2ab8f1d93a6c38ed265b6b2e38da52a15e2fe",
  "badges/generacija-ix.svg": "d956d092a748f0ea4ca0c42a77762eec6117aa621ef27aa4aec2707357d8b638",
  "badges/generacija-ix.png": "02081da805d66702c5af461d827e16be3d0d03c4e528ac3cc4152c961109d952",
  "masters/generacija-x.svg": "e3a98d5e806a59c29acc9f8cb1b70672dc9248f2b567a9fcc888983d8ee2c267",
  "masters/generacija-x.png": "85ddccb9b0f83e08735c097f7f1fafb06c6ba6ef012402b2e4896cf1ae273e60",
  "badges/generacija-x.svg": "1de4f6e8db4ff767a7283cb6e650996803c81a5c72ffaf6f7964aaab7cb91ca7",
  "badges/generacija-x.png": "a732f5a78758dd1e3c74d12b59bdb81e38d799faafe1fd94735563d527727a8e",
  "masters/generacija-xi.svg": "64447a17906c267a0cb4c866cb7523400daaaa524ccec3f1455754b765f5bb8b",
  "masters/generacija-xi.png": "af13643652d4c34e30b8eec64ebb897229487e29a6f7961f45006a2e821b11f5",
  "badges/generacija-xi.svg": "72c9b98179cf0cd7c1b7fb8adaa4a21314c3bac51a9ce3bc19a003245979ab3d",
  "badges/generacija-xi.png": "5860f2adcb1c0ec4f181555e964492f2c91c80eae9d7029aae55a631722859ee",
  "masters/generacija-xii.svg": "d5cd1014e95d0de4ac80a539a2b10d2da3775583a2667eb5ebb411e59a91531f",
  "masters/generacija-xii.png": "6ce1733a959e81c4fc38024facac01298c1ae1cd2302db475c11eece238dbeb4",
  "badges/generacija-xii.svg": "144c4122109d4d605bef6634f947d6678e7f70492d9f6ecd295aa89f6c30caa4",
  "badges/generacija-xii.png": "49439e7b5cee7e7d5253c9213c77b311ba4c6619d02ae3ded19dfb04d20b7681",
  "masters/generacija-xiii.svg": "1f25284678a5044f9c386cf99e6b831300b33e7ea7bf3a0d22d8b71845c2992e",
  "masters/generacija-xiii.png": "770463411de8071e76ccbfcc7b0e35cb13233f6bb20b943f45d6dbec95a2f249",
  "badges/generacija-xiii.svg": "4949174ab8eedd5b7a8b356861ff7d5e3e4fc552e72c901ce48bfc3db3088799",
  "badges/generacija-xiii.png": "4b8edb29719e066583781d1ea7dfaf84b5b758c881bee590d9e940c5ac31631d",
  "masters/generacija-xiv.svg": "13f562fc99c6bf5f3aca433f9bdd78164edf1a64df65bc3660ee5de8b32a9e99",
  "masters/generacija-xiv.png": "40a54fc38ba729fe978b26cdb48c63b5675f74aed899a7a334c807150329f91d",
  "badges/generacija-xiv.svg": "577ab7e634a82c66fd3fa46f6d60851079823a157fd282c9d8c001c07d5aeb6e",
  "badges/generacija-xiv.png": "d2b9dc3ae7105b06b01fb2d50471862b8373f59cee705a47cea0c885faa41cb4",
  "masters/generacija-xv.svg": "71bbe1503061d63c0ab4c28a1839c28c43a6166bbed754f26bc24a311de3fbba",
  "masters/generacija-xv.png": "5524fae91fdcf16095a81f24e5a0f0637c2fb65cb438f5c0fbed587f8e52f5b8",
  "badges/generacija-xv.svg": "2ebf4584aaca1629ac517c0796be22ddd5ed5b2773c915847b5a8fb70b25b88d",
  "badges/generacija-xv.png": "c3e5af1fe975c72b7bc38dcf76db36004a76fb6aa168e441ba99b27aaa25b33d",
};
