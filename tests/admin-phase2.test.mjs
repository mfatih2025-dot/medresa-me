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
const diagnostic = load("src/server/admin/diagnostics.ts");
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
test("configuration diagnostic identifies failed guards and whitelists hostname/ref without making provider requests", async () => environment(async () => {
  let requests=0; globalThis.fetch=async () => { requests++; throw new Error("Diagnostics must not contact a provider"); };
  configure(); process.env.MEDRESA_SUPABASE_WRITE_ENABLED="false";
  const healthy=diagnostic.adminConfigurationDiagnostic();
  assert.equal(healthy.configurationAccepted,true); assert.deepEqual(healthy.failedChecks,[]);
  assert.ok(Object.values(healthy.checks).every(v => v === true));
  assert.deepEqual(healthy.runtime,{supabaseHostname:"abcdefghijklmnopqrst.supabase.co",projectRef:"abcdefghijklmnopqrst"});
  const cases=[
    ["VERCEL_GIT_COMMIT_REF",undefined,"adminBranch",false],
    ["VERCEL_GIT_COMMIT_REF","main","adminBranch",false],
    ["VERCEL_ENV","production","previewEnvironment",false],
    ["SUPABASE_URL",undefined,"supabaseUrlPresent",false],
    ["SUPABASE_SERVICE_ROLE_KEY",undefined,"serviceRoleKeyPresent",false],
    ["MEDRESA_SUPABASE_PROJECT_REF",undefined,"projectRefPresent",false],
    ["SUPABASE_URL","invalid-private-input","supabaseUrlParseable",false],
    ["SUPABASE_URL","https://abcdefghijklmnopqrst.supabase.co/","supabaseUrlExactOrigin",false],
    ["SUPABASE_URL","https://abcdefghijklmnopqrst.supabase.co\n","supabaseUrlExactOrigin",false],
    ["SUPABASE_URL","http://abcdefghijklmnopqrst.supabase.co","supabaseUrlHttps",false],
    ["MEDRESA_SUPABASE_PROJECT_REF","differentprojectref","supabaseHostnameMatchesProjectRef",false],
    ["MEDRESA_SUPABASE_PROJECT_REF","INVALID REF","projectRefFormatValid",false],
    ["MEDRESA_SUPABASE_WRITE_ENABLED","true","writeFlagIsFalse",true],
    ["MEDRESA_SUPABASE_WRITE_ENABLED",undefined,"writeFlagIsFalse",true],
  ];
  for (const [variable,value,failed,accepted] of cases) {
    configure(); process.env.MEDRESA_SUPABASE_WRITE_ENABLED="false";
    if (value === undefined) delete process.env[variable]; else process.env[variable]=value;
    const report=diagnostic.adminConfigurationDiagnostic();
    assert.equal(report.checks[failed],false); assert.ok(report.failedChecks.includes(failed));
    assert.equal(report.configurationAccepted,accepted);
    assert.deepEqual(Object.keys(report),["configurationAccepted","checks","failedChecks","runtime"]);
    assert.deepEqual(Object.keys(report.runtime),["supabaseHostname","projectRef"]);
    assert.equal(report.runtime.projectRef,process.env.MEDRESA_SUPABASE_PROJECT_REF ?? null);
    assert.ok(Object.values(report.checks).every(v => typeof v === "boolean"));
    const serialized=JSON.stringify(report);
    for (const name of ["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]) if (process.env[name]) assert.ok(!serialized.includes(process.env[name]));
  }
  assert.equal(requests,0);
}));
test("diagnostic never reflects URL credentials or known secrets accidentally placed in runtime fields", async () => environment(async () => {
  configure(); process.env.MEDRESA_SUPABASE_WRITE_ENABLED="false";
  process.env.SUPABASE_SERVICE_ROLE_KEY="sb_secret_explicit_runtime_redaction_fixture";
  process.env.MEDRESA_ADMIN_PASSWORD_HASH=`scrypt$${"a".repeat(32)}$${"b".repeat(128)}`;
  process.env.MEDRESA_ADMIN_SESSION_SECRET="explicit-local-session-fixture-32-characters";
  globalThis.fetch=async () => { throw new Error("Diagnostics must not contact a provider"); };
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL=`https://${key}:private-url-fixture@abcdefghijklmnopqrst.supabase.co/private?token=${key}`;
  process.env.MEDRESA_SUPABASE_PROJECT_REF="differentprojectref";
  const mismatch=diagnostic.adminConfigurationDiagnostic();
  assert.deepEqual(mismatch.runtime,{supabaseHostname:"abcdefghijklmnopqrst.supabase.co",projectRef:"differentprojectref"});
  assert.ok(!JSON.stringify(mismatch).includes(key)); assert.ok(!JSON.stringify(mismatch).includes("private-url-fixture"));
  for (const name of ["SUPABASE_SERVICE_ROLE_KEY","MEDRESA_ADMIN_PASSWORD_HASH","MEDRESA_ADMIN_SESSION_SECRET"]) {
    process.env.MEDRESA_SUPABASE_PROJECT_REF=process.env[name];
    const redacted=diagnostic.adminConfigurationDiagnostic();
    assert.equal(redacted.runtime.projectRef,null); assert.ok(!JSON.stringify(redacted).includes(process.env[name]));
  }
  process.env.SUPABASE_URL=`https://${key.toUpperCase()}.supabase.co`;
  const hostname=diagnostic.adminConfigurationDiagnostic(); assert.equal(hostname.runtime.supabaseHostname,null);
  assert.ok(!JSON.stringify(hostname).toLowerCase().includes(key.toLowerCase()));
}));
test("diagnostic API is authenticated, GET-only, Preview-only and never exposes secrets or contacts Supabase", async () => environment(async () => {
  const handler=load("src/pages/api/admin/diagnostics.ts").default;
  let requests=0; globalThis.fetch=async () => { requests++; throw new Error("Diagnostics must not contact a provider"); };
  configure(); process.env.MEDRESA_SUPABASE_WRITE_ENABLED="false";
  process.env.MEDRESA_ADMIN_USER="diagnostic-auth-fixture"; process.env.MEDRESA_ADMIN_PASSWORD_HASH=`scrypt$${"a".repeat(32)}$${"b".repeat(128)}`; process.env.MEDRESA_ADMIN_SESSION_SECRET=randomBytes(48).toString("base64url"); process.env.MEDRESA_ADMIN_ORIGIN="https://admin.example.test";
  const cookies={ [auth.cookieName()]:auth.createSession() };
  for (const candidate of [{},{[auth.cookieName()]:"tampered-session"}]) {
    const res=response(); await handler({method:"GET",headers:{},cookies:candidate},res);
    assert.equal(res.statusCode,401); assert.equal(res.body.checks,undefined); assert.equal(res.body.runtime,undefined);
    assert.match(res.headers["Cache-Control"],/private.*no-store/); assert.match(res.headers["X-Robots-Tag"],/noindex/);
  }
  for (const method of ["POST","PUT","PATCH","DELETE","HEAD","OPTIONS"]) {
    const res=response(); await handler({method,headers:{},cookies},res);
    assert.equal(res.statusCode,405); assert.equal(res.headers.Allow,"GET"); assert.equal(res.body.checks,undefined); assert.equal(res.body.runtime,undefined);
  }
  const valid=response(); await handler({method:"GET",headers:{},cookies},valid);
  assert.equal(valid.statusCode,200); assert.equal(valid.body.configurationAccepted,true); assert.deepEqual(valid.body.failedChecks,[]);
  assert.equal(valid.body.checks.writeFlagIsFalse,true); assert.equal(valid.headers["X-Content-Type-Options"],"nosniff");
  assert.deepEqual(valid.body.runtime,{supabaseHostname:"abcdefghijklmnopqrst.supabase.co",projectRef:"abcdefghijklmnopqrst"});
  for (const name of envNames.filter(n => n !== "MEDRESA_SUPABASE_PROJECT_REF")) if (process.env[name] && process.env[name].length > 10) assert.ok(!JSON.stringify(valid.body).includes(process.env[name]));
  delete process.env.VERCEL_GIT_COMMIT_REF;
  const missingBranch=response(); await handler({method:"GET",headers:{},cookies},missingBranch);
  assert.equal(missingBranch.statusCode,200); assert.equal(missingBranch.body.configurationAccepted,false); assert.deepEqual(missingBranch.body.failedChecks,["adminBranch"]);
  for (const value of ["production","development",undefined]) {
    if (value === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV=value;
    for (const candidate of [cookies,{}]) {
      const res=response(); await handler({method:"GET",headers:{},cookies:candidate},res);
      assert.equal(res.statusCode,404); assert.equal(res.body.checks,undefined); assert.equal(res.body.runtime,undefined); assert.match(res.headers["Cache-Control"],/no-store/);
    }
  }
  assert.equal(requests,0);
}));
test("rejected news GET diagnostics are server-only, Preview-branch-only, value-free and never bypass authentication", async () => environment(async () => {
  const handler = load("src/pages/api/admin/news/index.ts").default;
  const info = console.info; const logs = []; let requests = 0;
  console.info = value => logs.push(JSON.parse(value));
  try {
    configure();
    process.env.MEDRESA_ADMIN_USER = "private-user-fixture";
    process.env.MEDRESA_ADMIN_PASSWORD_HASH = `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`;
    process.env.MEDRESA_ADMIN_SESSION_SECRET = randomBytes(48).toString("base64url");
    process.env.MEDRESA_ADMIN_ORIGIN = "https://admin.example.test";
    globalThis.fetch = async (url, init = {}) => {
      requests++; assert.equal(init.method ?? "GET", "GET"); assert.match(url, /\/rest\/v1\/medresa_admin_articles\?/);
      return new Response("[]", { headers: { "Content-Type": "application/json" } });
    };
    const token = auth.createSession(); const name = auth.cookieName();
    const req = { method: "GET", url: "/api/admin/news", headers: { host: "admin.example.test", cookie: `${name}=${token}` }, cookies: {} };
    const missing = response(); await handler(req, missing);
    assert.equal(missing.statusCode, 401); assert.deepEqual(missing.body, { error: "Prijavite se za nastavak." });
    assert.deepEqual(logs[0], { event: "medresa.admin.auth_rejected", reason: "cookie-missing", authConfigured: true, expectsSecureCookie: true, parsedCookiePresent: false, headerContainsExpectedCookie: true, originMatchesRequestHost: true });
    const invalid = response(); await handler({ ...req, cookies: { [name]: token + "x" } }, invalid);
    assert.equal(invalid.statusCode, 401); assert.equal(logs[1].reason, "signature-mismatch"); assert.equal(logs[1].parsedCookiePresent, true);
    const mismatch = response(); await handler({ ...req, headers: { host: process.env.MEDRESA_ADMIN_SESSION_SECRET }, cookies: { [name]: token + "x" } }, mismatch);
    assert.equal(mismatch.statusCode, 401); assert.equal(logs[2].originMatchesRequestHost, false);
    const serialized = JSON.stringify(logs);
    for (const secret of [token, ...envNames.map(n => process.env[n]).filter(v => v && v.length > 10)]) assert.ok(!serialized.includes(secret));
    assert.equal(requests, 0);
    const before = logs.length;
    const valid = response(); await handler({ ...req, cookies: { [name]: token } }, valid);
    assert.equal(valid.statusCode, 200); assert.equal(valid.body.backend.state, "connected"); assert.equal(valid.body.backend.writable, true);
    assert.equal(requests, 1); assert.equal(logs.length, before);
    for (const change of [() => { process.env.VERCEL_ENV = "production"; }, () => { process.env.VERCEL_ENV = "development"; }, () => { delete process.env.VERCEL_ENV; }, () => { process.env.VERCEL_GIT_COMMIT_REF = "main"; }, r => { r.url = "/api/admin/diagnostics"; }, r => { r.method = "POST"; }]) {
      configure(); const candidate = { ...req }; change(candidate);
      const result = response(); await handler(candidate, result);
      assert.equal(result.statusCode, 401); assert.equal(logs.length, before); assert.equal(requests, 1);
    }
  } finally { console.info = info; }
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
