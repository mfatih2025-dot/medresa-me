import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
import {resultsDatabase,resultsRest,fixtureEnvironment} from './fixtures/results.mjs';
const load=moduleLoader(),service=load('src/server/admin/results/admissions'),{admissionText}=load('src/admin/results/admissions');
const env={...process.env},fetch=globalThis.fetch;
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);globalThis.fetch=fetch;});
const strings={open:{bs:'UPIS JE OTVOREN',sq:'REGJISTRIMI ËSHTË I HAPUR',en:'ADMISSIONS ARE OPEN'},closed:{bs:'UPIS JE ZATVOREN',sq:'REGJISTRIMI ËSHTË I MBYLLUR',en:'ADMISSIONS ARE CLOSED'}};
test('all six exact static translations reuse the original status renderer and preserve the entire PDF module',()=>{
 const wrapper=({children})=>React.createElement(React.Fragment,null,children),motion={Depth:wrapper,Soft:wrapper,Stage:wrapper,Letters:({text})=>text,Line:()=>null};
 const {Upis}=moduleLoader({'./UpisMotion':motion})('src/components/upis/Upis');
 for(const locale of ['bs','sq','en']){
  const original=renderToStaticMarkup(React.createElement(Upis,{locale}));
  for(const status of ['open','closed']){
   const text=admissionText(status,locale);assert.equal(text.before+' '+text.word+text.after,strings[status][locale]);
   const html=renderToStaticMarkup(React.createElement(Upis,{locale,admissionStatus:status}));assert.ok(html.includes(strings[status][locale]));
   const pdfStart='<section aria-label="';assert.equal(html.slice(html.lastIndexOf(pdfStart)),original.slice(original.lastIndexOf(pdfStart)),'PDF renderer byte-equivalent');
   assert.deepEqual([...html.matchAll(/class="([^"]*)"/g)].map(m=>m[1]),[...original.matchAll(/class="([^"]*)"/g)].map(m=>m[1]),'All original classes identical');
  }
  assert.equal(renderToStaticMarkup(React.createElement(Upis,{locale,admissionStatus:null})),original,'Missing status schema preserves original page');
 }
 const renderer=readFileSync('src/components/upis/Upis.tsx','utf8');assert.ok(renderer.includes('spread={0.05}'));assert.ok(renderer.includes('duration={1.15}'));assert.ok(!renderer.includes('vercel.app'));
});
test('global admissions status persists, checks concurrency and RLS, and never changes PDF drafts/heads/revisions',async()=>{
 const db=await resultsDatabase();try{
  Object.assign(process.env,fixtureEnvironment);globalThis.fetch=resultsRest(db);
  const before=(await db.query('select to_jsonb(s) row from medresa_results_state s')).rows;
  assert.equal((await service.readAdmissions()).status,'open');assert.equal((await service.admissionsControl()).writable,true);
  const tables=(await db.query("select relrowsecurity from pg_class where relname='medresa_admissions_status'")).rows;assert.equal(tables[0].relrowsecurity,true);
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(db.query('select * from medresa_admissions_status'),e=>e.code==='42501');await assert.rejects(db.query("select medresa_admissions_set_status(false,0,'fixture')"),e=>e.code==='42501');await db.exec('reset role');}
  await db.exec('set role service_role');let s=await service.setAdmissions('closed',0,'fixture');assert.deepEqual(s,{status:'closed',revision:1});assert.equal(await service.publicAdmissionStatus(),'closed');assert.deepEqual(await service.readAdmissions(),s);
  await assert.rejects(service.setAdmissions('open',0,'fixture'),e=>e.status===409);assert.deepEqual(await service.setAdmissions('closed',1,'fixture'),s,'Repeated selected value is idempotent');
  s=await service.setAdmissions('open',1,'fixture');assert.deepEqual(s,{status:'open',revision:2});assert.equal(await service.publicAdmissionStatus(),'open');
  for(const [status,expected]of [['invalid',2],['open',-1],['closed',null]])await assert.rejects(service.setAdmissions(status,expected,'fixture'),e=>e.status===422);
  await assert.rejects(db.query('delete from medresa_admissions_status'),e=>e.code==='42501');await assert.rejects(db.query('truncate medresa_admissions_status'),e=>e.code==='42501');await db.exec('reset role');
  assert.deepEqual((await db.query('select to_jsonb(s) row from medresa_results_state s')).rows,before);assert.equal((await db.query('select count(*)::int n from medresa_results_locale_publications')).rows[0].n,0);
  const f=(await db.query("select prosecdef,proconfig from pg_proc where proname='medresa_admissions_set_status'")).rows[0];assert.equal(f.prosecdef,false);assert.deepEqual(f.proconfig,['search_path=public, pg_temp']);
 }finally{await db.close();}
});
test('admissions endpoint requires Admin session and same origin; Preview guards and outages fail safely',async()=>{
 Object.assign(process.env,fixtureEnvironment);let calls=0;const fake={admissionsControl(){calls++;},setAdmissions(){calls++;}};
 const {default:handler}=moduleLoader({'@/server/admin/results/admissions':fake})('src/pages/api/admin/results/admissions');
 const {createSession,cookieName}=load('src/server/admin/auth');process.env.MEDRESA_ADMIN_USER='fixture';process.env.MEDRESA_ADMIN_SESSION_SECRET='x'.repeat(48);process.env.MEDRESA_ADMIN_PASSWORD_HASH='scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128);process.env.MEDRESA_ADMIN_ORIGIN='http://localhost:3215';const token=createSession();
 for(const req of [{method:'GET',cookies:{},headers:{}},{method:'POST',cookies:{[cookieName()]:token},headers:{origin:'https://evil.example'}}]){const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};await handler(req,res);assert.equal(res.code,req.method==='GET'?401:403);}assert.equal(calls,0);
 globalThis.fetch=()=>{calls++;throw new Error('Provider is unavailable');};assert.equal(await service.publicAdmissionStatus(),null);assert.equal((await service.admissionsControl()).writable,false);
 calls=0;for(const patch of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},{MEDRESA_SUPABASE_PROJECT_REF:'wrong'},{MEDRESA_SUPABASE_WRITE_ENABLED:'false'}]){Object.assign(process.env,fixtureEnvironment,patch);await assert.rejects(service.setAdmissions('closed',0,'fixture'));}assert.equal(calls,0);
});
