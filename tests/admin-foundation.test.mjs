import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { Script } from "node:vm";
import { scryptSync } from "node:crypto";
import ts from "typescript";

// Compile source in memory; no generated fixtures or production writes.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(path, source, overrides = {}) {
  const file = resolve(path);
  if (!source && cache.has(file)) return cache.get(file);
  const exports = {};
  const compiledModule = { exports };
  const code = ts.transpileModule(source ?? readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = spec => {
    if (spec in overrides) return overrides[spec];
    if (spec.startsWith("@/")) return load(resolve("src", spec.slice(2)) + ".ts");
    if (spec.startsWith(".")) return load(resolve(dirname(file), spec) + ".ts");
    return require(spec);
  };
  new Script(`(function(require,module,exports){${code}\n})`, { filename: file }).runInThisContext()(localRequire, compiledModule, exports);
  if (!source) cache.set(file, compiledModule.exports);
  return compiledModule.exports;
}
const model = load("src/admin/model.ts");
const publication = load("src/admin/publication.ts");
const parser = load("src/lib/newsBody.ts");
const translation = load("src/admin/translation.ts");
const auth = load("src/server/admin/auth.ts");
const localized = text => ({ bs: text, sq: text, en: text });
function completeDraft() {
  const d = model.newDraft("draft-1");
  d.title = localized("A complete title"); d.slug = localized("a-complete-title"); d.date = "2026-10-07";
  d.images = ["unused", "cover", "second", "third"].map(id => ({ id, src: `/images/${id}.jpg`, width: 1200, height: 800, alt: localized(id) }));
  d.coverImageId = "cover";
  d.blocks = [{ id: "t1", type: "text", text: localized("First paragraph") }, { id: "i1", type: "image", assetId: "third" }, { id: "h1", type: "subheading", text: localized("Subheading") }, { id: "q1", type: "quote", text: localized("Quotation") }, { id: "i2", type: "image", assetId: "second" }];
  for (const l of ["bs", "sq", "en"]) d.review[l] = { approved: true, reviewedRevision: d.revision };
  return d;
}

test("publication requires all languages, real date, cover, valid slugs and current human reviews", () => {
  const d = completeDraft(); assert.ok(publication.publicationChecklist(d).every(c => c.complete));
  for (const mutate of [x => { x.title.sq = " "; }, x => { x.date = "2026-02-31"; }, x => { x.coverImageId = null; }, x => { x.slug.en = "2"; }, x => { x.review.en.reviewedRevision = -1; }, x => { x.blocks[1].assetId = "missing"; }, x => { x.images[1].alt.bs = ""; }]) {
    const candidate = structuredClone(d); mutate(candidate); assert.ok(publication.publicationChecklist(candidate).some(c => !c.complete));
  }
});
test("adapter preserves typed block order for every locale, shares images and omits unused assets", () => {
  const d = completeDraft(); const a = publication.toPublicArticle(d);
  assert.deepEqual(a.photos.map(p => p.src), ["/images/cover.jpg", "/images/third.jpg", "/images/second.jpg"]);
  for (const l of ["bs", "sq", "en"]) {
    const blocks = parser.parseBody(a[l].body);
    assert.deepEqual(blocks.map(b => b.type), ["p", "photo", "h", "quote", "photo"]);
    assert.equal(blocks[1].n, 2); assert.equal(blocks[4].n, 3);
  }
  const moved = model.revise(d, { blocks: model.moveBlock(d.blocks, 4, 1) });
  assert.deepEqual(moved.blocks.map(b => b.id), ["t1", "i2", "i1", "h1", "q1"]);
  assert.ok(Object.values(moved.review).every(r => !r.approved)); assert.equal(moved.status, "draft");
  assert.deepEqual(publication.toPublicArticle(moved).photos.map(p => p.src), ["/images/cover.jpg", "/images/second.jpg", "/images/third.jpg"]);
});
test("translation drafts cannot overwrite BS, reorder blocks, change assets or retain approval", () => {
  const d = completeDraft(); const draft = { title: { ...localized("Translated"), bs: "malicious overwrite" }, slug: localized("translated"), lead: localized("Lead"), blocks: d.blocks.filter(b => b.type !== "image").map(b => ({ id: b.id, text: localized("Translation") })) };
  const result = translation.applyTranslationDraft(d, draft);
  assert.equal(result.title.bs, d.title.bs); assert.equal(result.blocks[0].text.bs, d.blocks[0].text.bs);
  assert.deepEqual(result.blocks.map(b => b.id), d.blocks.map(b => b.id)); assert.deepEqual(result.images, d.images);
  assert.ok(Object.values(result.review).every(r => !r.approved)); assert.equal(result.status, "draft");
  assert.throws(() => translation.applyTranslationDraft(d, { ...draft, blocks: [...draft.blocks].reverse() }));
});
test("authentication fails closed, checks credentials, expires sessions, rejects tampering and foreign origins", async () => {
  const names = ["MEDRESA_ADMIN_USER", "MEDRESA_ADMIN_PASSWORD_HASH", "MEDRESA_ADMIN_SESSION_SECRET", "MEDRESA_ADMIN_ORIGIN"];
  const original = names.map(n => process.env[n]);
  try {
    for (const n of names) delete process.env[n];
    assert.equal(auth.authConfigured(), false); assert.equal(auth.verifySession("anything"), null);
    // Explicit test fixtures, not user credentials or external configuration.
    const salt = "a".repeat(32); const password = "unit-test-fixture-only";
    process.env.MEDRESA_ADMIN_USER = "test-fixture";
    process.env.MEDRESA_ADMIN_PASSWORD_HASH = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
    process.env.MEDRESA_ADMIN_SESSION_SECRET = "unit-test-fixture-secret-only-32-characters";
    process.env.MEDRESA_ADMIN_ORIGIN = "https://admin.example.test";
    assert.equal(await auth.verifyCredentials("test-fixture", password), true);
    assert.equal(await auth.verifyCredentials("other", password), false);
    assert.equal(await auth.verifyCredentials("test-fixture", "wrong"), false);
    const token = auth.createSession(1000);
    assert.equal(auth.verifySession(token, 2000).user, "test-fixture");
    assert.equal(auth.verifySession(token, 1000 + 8 * 3600 * 1000), null);
    assert.equal(auth.verifySession(token + "x", 2000), null);
    assert.equal(auth.verifySession(token + ".extra", 2000), null);
    assert.equal(auth.allowedOrigin("https://evil.example.test"), false);
    assert.equal(auth.allowedOrigin("https://admin.example.test"), true);
    assert.match(auth.sessionCookie(token), /HttpOnly; SameSite=Strict/); assert.match(auth.sessionCookie(token), /; Secure/);
    for (let i = 0; i < 10; i++) assert.equal(auth.allowLoginAttempt("test-address", 1000), true);
    assert.equal(auth.allowLoginAttempt("test-address", 1000), false);
  } finally { names.forEach((n, i) => { if (original[i] === undefined) delete process.env[n]; else process.env[n] = original[i]; }); }
});
test("every sampled public proxy outcome exactly matches the audited baseline", () => {
  const NextResponse = {
    next: () => ({ action: "next", headers: new Map() }),
    redirect: (url, status) => ({ action: "redirect", url: url.href, status }),
    rewrite: url => ({ action: "rewrite", url: url.href }),
  };
  const source = readFileSync("tests/fixtures/public-proxy.baseline.txt", "utf8");
  const baseline = load("src/proxy.ts", source, { "next/server": { NextResponse } });
  const current = load("src/proxy.ts", readFileSync("src/proxy.ts", "utf8"), { "next/server": { NextResponse } });
  const paths = ["/", "/bs", "/bs/upis", "/vijesti", "/vijesti/2", "/vijesti/kurban", "/upis", "/historijat", "/sq", "/en", "/sq/lajme/2", "/en/news/kurban", "/en/admissions", "/sq/regjistrimi", "/en/upis", "/en/regjistrimi", "/nepoznato", "/administracija", "/admin-preview-other"];
  for (const path of paths) for (const cookie of [undefined, "bs", "sq", "en"]) {
    const request = { nextUrl: { pathname: path, search: "?x=1", clone: () => new URL(`https://www.medresa.me${path}?x=1`) }, cookies: { get: () => cookie ? { value: cookie } : undefined } };
    assert.deepEqual(current.proxy(request), baseline.proxy(request), `${path} / ${cookie}`);
  }
  for (const path of ["/admin", "/admin/login", "/admin/vijesti/nova", "/admin-preview/article"]) {
    const request = { nextUrl: { pathname: path }, cookies: { get: () => ({ value: "sq" }) } };
    const result = current.proxy(request); assert.equal(result.action, "next"); assert.equal(result.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
});
test("exam adapter retains localized admissions destination and refuses draft PDFs", () => {
  const { examPublicData } = load("src/admin/exam.ts");
  const exam = { status: "draft", publishedAt: null, document: { url: "https://storage.example.test/results.pdf", mime: "application/pdf" }, title: localized("Results"), action: localized("Download"), hero: { kicker: localized("Exam"), label: localized("Results") } };
  assert.throws(() => examPublicData(exam, "en"));
  exam.status = "published"; exam.publishedAt = "2026-10-07T10:00:00Z";
  assert.equal(examPublicData(exam, "en").hero.href, "/en/admissions"); assert.equal(examPublicData(exam, "bs").document.href, exam.document.url);
});
