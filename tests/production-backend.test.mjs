import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
const configuration={VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'main',SUPABASE_URL:'https://safsijrhxbefgcahvsvm.supabase.co',MEDRESA_SUPABASE_PROJECT_REF:'safsijrhxbefgcahvsvm',SUPABASE_SERVICE_ROLE_KEY:'explicit-production-test-fixture-not-real',MEDRESA_SUPABASE_WRITE_ENABLED:'true',OPENAI_API_KEY:'explicit-production-openai-fixture-not-real',MEDRESA_ADMIN_ORIGIN:'https://www.medresa.me',MEDRESA_ADMIN_USER:'fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128),MEDRESA_ADMIN_SESSION_SECRET:'explicit-production-session-test-fixture-32-characters'};
async function environment(fn){const before=Object.fromEntries(Object.keys(configuration).map(k=>[k,process.env[k]])),fetch=globalThis.fetch;Object.assign(process.env,configuration);try{await fn();}finally{for(const[k,v]of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}globalThis.fetch=fetch;}}
function loader(){return moduleLoader({'server-only':{},react:{cache:fn=>fn},'next/server':{connection:async()=>{}}});}
test('Production/main uses only approved existing project; News, campaigns, Results, Analytics and AI guards open without contacting providers',()=>environment(async()=>{
 const load=loader(),supabase=load('src/server/admin/supabase');let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No provider calls in configuration test');};
 assert.equal(supabase.supabaseConfiguration().ref,configuration.MEDRESA_SUPABASE_PROJECT_REF);
 assert.equal(supabase.supabaseConfiguration().bucket,'medresa-news-preview');
 for(const[file,fn]of [['src/server/admin/campaigns/service','campaignConfiguration'],['src/server/admin/results/service','resultsConfiguration'],['src/server/admin/analytics/common','previewConfiguration']])assert.equal(load(file)[fn](true).writable,true);
 assert.equal(load('src/server/admin/translation').translationAvailable(),true);
 const auth=load('src/server/admin/auth');assert.equal(auth.allowedOrigin('https://www.medresa.me'),true);assert.equal(auth.allowedOrigin('https://other.example'),false);assert.ok(auth.verifySession(auth.createSession()));assert.match(auth.sessionCookie('fixture'),/HttpOnly; SameSite=Strict.*Secure/);
 assert.equal(calls,0);
 for(const patch of [{VERCEL_GIT_COMMIT_REF:'other'},{SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',MEDRESA_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst'}]){Object.assign(process.env,configuration,patch);assert.equal(supabase.supabaseConfiguration(),null);assert.equal(load('src/server/admin/translation').translationAvailable(),false);}
 Object.assign(process.env,configuration,{MEDRESA_SUPABASE_WRITE_ENABLED:'false'});assert.equal(supabase.supabaseConfiguration().writable,false);assert.equal(load('src/server/admin/translation').translationAvailable(),false);assert.throws(()=>load('src/server/admin/results/service').resultsConfiguration(true));assert.equal(calls,0);
}));
test('Production public News loads only published locale snapshots dynamically, never exposes other drafts or credentials',()=>environment(async()=>{
 const load=loader(),{articles}=load('src/content/vijesti');const snapshot=JSON.parse(JSON.stringify(articles[0]));snapshot.id='production-bs-only';snapshot.bs.slug='production-bs-only';snapshot.sq.title='PRIVATE SQ DRAFT';snapshot.en.title='PRIVATE EN DRAFT';
 const requests=[];globalThis.fetch=async(input,init)=>{const url=new URL(input);requests.push(url);assert.equal(url.origin,configuration.SUPABASE_URL);assert.equal(init.cache,'no-store');assert.equal(new Headers(init.headers).get('apikey'),configuration.SUPABASE_SERVICE_ROLE_KEY);assert.equal(init.method,'GET');return Response.json([{article_id:snapshot.id,locale:'bs',snapshot,source_order:null}]);};
 const news=load('src/server/public/news');const bs=await news.publicNews('bs');assert.ok(bs.bySlug('production-bs-only'));assert.equal(bs.articles.length,18);assert.equal((await news.publicNews('sq')).articles.length,17);assert.equal((await news.publicNews('en')).articles.length,17);
 assert.ok(!JSON.stringify(bs).includes('PRIVATE'));assert.ok(!JSON.stringify(bs).includes(configuration.SUPABASE_SERVICE_ROLE_KEY));assert.ok(requests.length>0);
}));
test('Preview diagnostics remain unavailable in Production; no schema/bucket/provider implementation is replaced',()=>environment(async()=>{
 const load=loader();let calls=0;globalThis.fetch=async()=>{calls++;throw Error('No provider calls allowed');};await assert.rejects(load('src/server/admin/campaigns/service').diagnoseCampaign('fixture'));
 const handler=load('src/pages/api/admin/diagnostics').default;const auth=load('src/server/admin/auth');const response={setHeader(){},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};await handler({method:'GET',headers:{},cookies:{[auth.cookieName()]:auth.createSession()},query:{}},response);assert.equal(response.statusCode,404);assert.equal(calls,0);
 assert.match(readFileSync('src/app/_shell/Shell.tsx','utf8'),/backendDeploymentSupported\(\) && <CampaignPopup/);assert.match(readFileSync('src/app/[locale]/upis/page.tsx','utf8'),/backendDeploymentSupported\(\)\) await connection\(\)/);
}));
