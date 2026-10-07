import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";
const load = moduleLoader();
const contracts = load("src/admin/contracts.ts");
const model = load("src/admin/model.ts");
const publication = load("src/admin/publication.ts");
const importer = load("src/admin/import.ts");
const { articles } = load("src/content/vijesti");
const backend = load("src/server/admin/supabase.ts");
const news = load("src/server/admin/news.ts");
const media = load("src/server/admin/media.ts");
const auth = load("src/server/admin/auth.ts");
const envNames = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MEDRESA_SUPABASE_PROJECT_REF", "MEDRESA_SUPABASE_WRITE_ENABLED", "VERCEL_ENV", "VERCEL_GIT_COMMIT_REF", "MEDRESA_ADMIN_USER", "MEDRESA_ADMIN_PASSWORD_HASH", "MEDRESA_ADMIN_SESSION_SECRET", "MEDRESA_ADMIN_ORIGIN"];
async function environment(fn) {
  const old = envNames.map(n => process.env[n]); const fetch = globalThis.fetch;
  try { for (const n of envNames) delete process.env[n]; return await fn(); }
  finally { envNames.forEach((n,i) => old[i] === undefined ? delete process.env[n] : process.env[n] = old[i]); globalThis.fetch = fetch; }
}
function configure() {
  process.env.SUPABASE_URL = "https://abcdefghijklmnopqrst.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "unit-test-fixture-no-real-provider-key";
  process.env.MEDRESA_SUPABASE_PROJECT_REF = "abcdefghijklmnopqrst";
  process.env.MEDRESA_SUPABASE_WRITE_ENABLED = "true";
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_GIT_COMMIT_REF = "codex/admin-panel";
}
function response() { return { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.statusCode=n; return this; }, json(v) { this.body=v; return this; }, end() { return this; }, send(v) { this.body=v; return this; } }; }
test("all 17 imports preserve full contract, original bodies, shared images, slugs, dates and ordering", () => {
  assert.equal(articles.length,17);
  for (const a of articles) {
    const d = importer.importArticle(a).draft;
    contracts.validateDraft(d);
    assert.deepEqual(publication.toPublicArticle(d), a);
    const changed = model.revise(d, { title: { ...d.title, bs: "Edited title" } });
    const preview = publication.toPublicArticle(changed);
    assert.equal(preview.bs.title,"Edited title"); assert.equal(preview.bs.body,a.bs.body);
    assert.deepEqual(preview.photos,a.photos); assert.deepEqual(preview.sq,a.sq); assert.deepEqual(preview.en,a.en);
  }
  const candidate = structuredClone(articles[0]); candidate.sq.body += "\n\nExtra paragraph";
  assert.throws(() => importer.importArticle(candidate),/ručno usklađivanje/);
});
test("draft validation rejects remote URLs, traversal, duplicate blocks, missing assets and query injection", () => {
  const original = importer.importArticle(articles.find(a => a.photos.length)).draft;
  for (const modify of [d => { d.images[0].src="https://evil.example/image.jpg"; }, d => { d.images[0].src="/images/../private.png"; }, d => { d.blocks.push(d.blocks[0]); }, d => { d.blocks.push({ id:"missing",type:"image",assetId:"missing" }); }, d => { d.id="x)&or=(true"; }, d => { d.review.en.approved="yes"; }]) {
    const d=structuredClone(original); modify(d); assert.throws(() => contracts.validateDraft(d));
  }
  const empty=model.newDraft("new-article"); contracts.validateDraft(empty); assert.throws(() => contracts.assertPublishable(empty));
});
test("missing credentials, mismatched project, Production and missing write opt-in prevent provider requests", async () => environment(async () => {
  let requested=false; globalThis.fetch=async () => { requested=true; throw new Error("Must not connect"); };
  assert.equal(backend.supabaseConfiguration(),null);
  await assert.rejects(backend.supabaseRequest("/rest/v1/anything"));
  configure(); process.env.VERCEL_ENV="production";
  await assert.rejects(backend.supabaseRequest("/rest/v1/anything",{},true));
  process.env.VERCEL_ENV="preview"; process.env.MEDRESA_SUPABASE_PROJECT_REF="differentprojectref";
  await assert.rejects(backend.supabaseRequest("/rest/v1/anything",{},true));
  configure(); process.env.VERCEL_GIT_COMMIT_REF="main";
  await assert.rejects(backend.supabaseRequest("/rest/v1/anything",{},true));
  configure(); process.env.MEDRESA_SUPABASE_WRITE_ENABLED="false";
  await assert.rejects(backend.supabaseRequest("/rest/v1/anything",{},true));
  assert.equal(requested,false);
}));
test("server canonicalizes image metadata and removes forged legacy provenance; static writes remain blocked", async () => environment(async () => {
  const a=articles.find(a => a.photos.length); const d=importer.importArticle(a).draft;
  const candidate=structuredClone(d); candidate.images[0].width=1; candidate.images[0].src="/images/forged.jpg"; candidate.legacy.original.bs.body="forged";
  const result=await news.canonicalDraft(candidate,d);
  assert.equal(result.images[0].width,d.images[0].width); assert.equal(result.images[0].src,d.images[0].src); assert.deepEqual(result.legacy,d.legacy);
  assert.equal((await news.canonicalDraft(candidate)).legacy,undefined);
  const list=await news.listNews(); assert.equal(list.rows.length,17); assert.equal(list.backend.writable,false);
  await assert.rejects(news.saveDraft(d,d.revision,"test-fixture"),/provjereni import/);
}));
test("image decoder checks actual type, limits bytes and strips metadata with lossless pixel preservation", async () => {
  const original=await sharp({create:{width:64,height:48,channels:3,background:{r:21,g:70,b:45}}}).png().withMetadata({orientation:6}).toBuffer();
  const optimized=await media.optimizeImage(original,"image/png");
  assert.equal(optimized.width,48); assert.equal(optimized.height,64);
  const metadata=await sharp(optimized.bytes).metadata(); assert.equal(metadata.format,"webp"); assert.equal(metadata.exif,undefined);
  assert.deepEqual(await sharp(original).rotate().removeAlpha().raw().toBuffer(),await sharp(optimized.bytes).removeAlpha().raw().toBuffer());
  await assert.rejects(media.optimizeImage(original,"image/jpeg"));
  await assert.rejects(media.optimizeImage(Buffer.from("<svg></svg>"),"image/png"));
  await assert.rejects(media.optimizeImage(Buffer.alloc(media.MAX_IMAGE_BYTES+1),"image/png"));
});
test("upload stores one shared derivative and original privately, without overwrites or automatic deletions", async () => environment(async () => {
  configure(); const requests=[];
  globalThis.fetch=async (url,init) => { requests.push({url,init}); return new Response("{}",{status:200,headers:{"Content-Type":"application/json"}}); };
  const image=await sharp({create:{width:48,height:32,channels:3,background:"green"}}).jpeg().toBuffer();
  const asset=await media.uploadImage(image,"image/jpeg","test-fixture");
  assert.match(asset.src,/^\/api\/admin\/media\//); assert.equal(requests.length,3);
  assert.ok(requests[0].url.includes("/medresa-news-preview/originals/")); assert.ok(requests[1].url.includes("/medresa-news-preview/images/"));
  assert.equal(requests[0].init.headers.get("x-upsert"),"false"); assert.equal(requests[1].init.headers.get("x-upsert"),"false");
  assert.ok(requests.every(r => r.init.method==="POST"));
}));
test("provider failure messages redact provider response content and keys", async () => environment(async () => {
  configure(); globalThis.fetch=async () => new Response(JSON.stringify({code:"unknown",message:"private-provider-content"}),{status:500});
  await assert.rejects(backend.supabaseRequest("/rest/v1/test"),e => !e.message.includes("private-provider-content") && !e.message.includes(process.env.SUPABASE_SERVICE_ROLE_KEY));
}));
test("opaque Supabase secret keys use apikey; legacy JWT keys use the authorization header", async () => environment(async () => {
  configure(); const headers=[];
  globalThis.fetch=async (_url,init) => { headers.push(init.headers); return new Response("[]",{status:200}); };
  await backend.supabaseRequest("/rest/v1/test");
  assert.equal(headers[0].get("Authorization"),`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  process.env.SUPABASE_SERVICE_ROLE_KEY="sb_secret_explicit-test-fixture-no-real-key";
  await backend.supabaseRequest("/rest/v1/test");
  assert.equal(headers[1].get("Authorization"),null); assert.equal(headers[1].get("apikey"),process.env.SUPABASE_SERVICE_ROLE_KEY);
}));
test("all private APIs reject unauthenticated requests; mutations reject foreign origins and deletion needs explicit confirmation", async () => environment(async () => {
  const handlers=["news/index","news/[id]","media/index","media/[id]","preview","translation"].map(p => load(`src/pages/api/admin/${p}.ts`).default);
  for (const handler of handlers) { const res=response(); await handler({method:"POST",headers:{},cookies:{},query:{id:"article"},body:{}},res); assert.equal(res.statusCode,401); assert.match(res.headers["Cache-Control"],/no-store/); }
  process.env.MEDRESA_ADMIN_USER="test-fixture"; process.env.MEDRESA_ADMIN_PASSWORD_HASH=`scrypt$${"a".repeat(32)}$${"b".repeat(128)}`; process.env.MEDRESA_ADMIN_SESSION_SECRET=randomBytes(48).toString("base64url"); process.env.MEDRESA_ADMIN_ORIGIN="https://admin.example.test";
  const cookies={ [auth.cookieName()]:auth.createSession() };
  for (const [index,handler] of handlers.entries()) { const res=response(); await handler({method:"POST",headers:{origin:"https://foreign.example.test"},cookies,query:{id:"article"},body:{}},res); assert.equal(res.statusCode,index===3 ? 405 : 403); }
  const res=response(); await handlers[1]({method:"POST",headers:{origin:"https://admin.example.test"},cookies,query:{id:"article"},body:{action:"trash",expectedRevision:0}},res); assert.equal(res.statusCode,422); assert.match(res.body.error,/potvrda/);
  const disconnected=response(); await handlers[0]({method:"POST",headers:{origin:"https://admin.example.test"},cookies,query:{},body:{}},disconnected); assert.equal(disconnected.statusCode,503);
}));
