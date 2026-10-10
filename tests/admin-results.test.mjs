import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
import {resultsDatabase,resultsRest,fixtureEnvironment,pdfFixture} from './fixtures/results.mjs';
const load=moduleLoader(),service=load('src/server/admin/results/service'),{validatePdf}=load('src/server/admin/results/pdf'),{MAX_PDF_BYTES,PDF_CHUNK_BYTES}=load('src/admin/results/model');
const env={...process.env},fetch=globalThis.fetch;
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);globalThis.fetch=fetch;});
async function upload(locale,bytes,expected,actor='fixture'){
 const session=await service.beginUpload({locale,filename:`${locale} local fixture.pdf`,bytes:bytes.length,revision:expected},actor);
 for(let i=0,offset=0;offset<bytes.length;i++,offset+=PDF_CHUNK_BYTES)await service.uploadChunk(session.id,i,bytes.subarray(offset,offset+PDF_CHUNK_BYTES),actor);
 return service.finishUpload(session.id,expected,actor);
}
test('PDF validation parses real PDF content and enforces 5 MB without filename trust',async()=>{
 const valid=await pdfFixture();assert.equal((await validatePdf(valid)).pages,1);
 const full=await pdfFixture('5 MB fixture',MAX_PDF_BYTES);assert.equal(full.length,MAX_PDF_BYTES);assert.equal((await validatePdf(full)).pages,1);
 for(const bytes of [Buffer.from('fake.pdf'),Buffer.from('%PDF-1.7\nnot a PDF\n%%EOF'),Buffer.concat([valid,Buffer.from('<script>notpdf</script>')]),Buffer.alloc(MAX_PDF_BYTES+1)])await assert.rejects(validatePdf(bytes),e=>e.status===422);
 const {PDFDocument,PDFName,PDFString}=await import('pdf-lib');const doc=await PDFDocument.create();doc.addPage();doc.catalog.set(PDFName.of('JS'),PDFString.of('alert(1)'));await assert.rejects(validatePdf(Buffer.from(await doc.save())));
});
test('one additive migration provides private storage, RLS, invoker RPCs, locale integrity and immutable history',async()=>{
 const db=await resultsDatabase();try{
  assert.equal((await db.query("select count(*)::int n from pg_class where relname in ('medresa_results_assets','medresa_results_publications','medresa_results_state','medresa_results_uploads') and relrowsecurity")).rows[0].n,4);
  const b=(await db.query("select * from storage.buckets where id='medresa-results-preview'")).rows[0];assert.equal(b.public,false);assert.equal(b.file_size_limit,MAX_PDF_BYTES);assert.deepEqual(b.allowed_mime_types,['application/pdf','application/octet-stream']);
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);for(const table of ['assets','publications','state','uploads'])await assert.rejects(db.query(`select * from medresa_results_${table}`),e=>e.code==='42501');await assert.rejects(db.query('select medresa_results_publish($1,0,$2)',[randomUUID(),'fixture']),e=>e.code==='42501');await db.exec('reset role');}
  const funcs=(await db.query("select prosecdef,proconfig from pg_proc where proname like 'medresa_results_%'")).rows;assert.ok(funcs.every(f=>!f.prosecdef&&f.proconfig[0]==='search_path=public, pg_temp'));
  assert.equal((await db.query('select count(*)::int n from medresa_results_publications')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from medresa_admin_articles')).rows[0].n,0);
 }finally{await db.close();}
});
test('BS, SQ and EN publish independently; updates, draft removals and retries preserve other heads',async()=>{
 const db=await resultsDatabase();try{
  Object.assign(process.env,fixtureEnvironment);const objects=new Map();globalThis.fetch=resultsRest(db,objects);await db.exec('set role service_role');
  let state=await service.readResults();assert.equal(state.revision,0);assert.equal(await service.publishedHref('bs'),null);
  const pdfs={},heads={};
  for(const locale of ['bs','sq','en']){
   pdfs[locale]=await pdfFixture(locale+' first');state=await upload(locale,pdfs[locale],state.revision);
   const id=randomUUID();state=await service.publishResults(state.revision,'fixture',id,locale);heads[locale]=id;assert.equal(state.published[locale].id,id);
   assert.deepEqual((await service.publicPdf(locale)).bytes,pdfs[locale]);
   for(const prior of Object.keys(heads)){assert.equal(state.published[prior].id,heads[prior]);assert.deepEqual((await service.publicPdf(prior)).bytes,pdfs[prior]);}
   if(locale==='bs'){assert.equal(await service.publishedHref('sq'),null);await assert.rejects(service.publicPdf('en'));}
  }
  assert.equal(objects.size,3);
  const replacement=await pdfFixture('SQ replacement');state=await upload('sq',replacement,state.revision);assert.deepEqual((await service.publicPdf('sq')).bytes,pdfs.sq);
  state=await service.removeDraft('en',state.revision);await assert.rejects(service.publishResults(state.revision,'fixture',randomUUID(),'en'),e=>e.status===422);
  const next=randomUUID();state=await service.publishResults(state.revision,'fixture',next,'sq');assert.deepEqual((await service.publicPdf('sq')).bytes,replacement);
  for(const locale of ['bs','en']){assert.equal(state.published[locale].id,heads[locale]);assert.deepEqual((await service.publicPdf(locale)).bytes,pdfs[locale]);}
  assert.equal((await db.query('select count(*)::int n from medresa_results_locale_publications')).rows[0].n,4);
  await assert.rejects(db.query('delete from medresa_results_locale_publications'),e=>e.code==='42501');await db.exec('reset role');await assert.rejects(db.query('update medresa_results_locale_publications set version=version+100'),e=>e.code==='55000');
  assert.equal((await service.publishResults(state.revision,'fixture',next,'sq')).revision,state.revision);
  await assert.rejects(service.publishResults(0,'fixture',randomUUID(),'bs'),e=>e.status===409);
 }finally{await db.close();}
});
test('failed/incomplete uploads, corrupted originals, stale revisions and wrong project cannot partially publish',async()=>{
 const db=await resultsDatabase();try{
  Object.assign(process.env,fixtureEnvironment);const objects=new Map();globalThis.fetch=resultsRest(db,objects);let s=await service.readResults();
  const bytes=await pdfFixture('bad upload');const u=await service.beginUpload({locale:'bs',filename:'fixture.pdf',bytes:bytes.length,revision:0},'fixture');
  await assert.rejects(service.uploadChunk(u.id,0,bytes.subarray(1),'fixture'));await assert.rejects(service.uploadChunk(u.id,0,bytes,'other-user'));
  await service.uploadChunk(u.id,0,Buffer.alloc(bytes.length),'fixture');await assert.rejects(service.finishUpload(u.id,0,'fixture'),e=>e.status===422);assert.equal((await service.readResults()).revision,0);
  for(const l of ['bs','sq','en'])s=await upload(l,await pdfFixture(l),s.revision);
  const initial=randomUUID();s=await service.publishResults(s.revision,'fixture',initial,'en');await assert.rejects(service.removeDraft('bs',0),e=>e.status===409);
  const a=s.drafts.en;objects.set('medresa-results-preview/documents/'+a.id+'.pdf',{bytes:Buffer.from('corrupt'),mime:'application/pdf'});await assert.rejects(service.publishResults(s.revision,'fixture',randomUUID(),'en'));assert.equal((await service.readResults()).published.en.id,initial);
  for(const patch of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},{MEDRESA_SUPABASE_PROJECT_REF:'wrong'},{MEDRESA_SUPABASE_WRITE_ENABLED:'false'}]){Object.assign(process.env,fixtureEnvironment,patch);await assert.rejects(service.beginUpload({locale:'bs',filename:'f.pdf',bytes:10,revision:s.revision},'fixture'));}
 }finally{await db.close();}
});
test('the locked Upis renderer is identical with data-source override and uses only relative locale downloads',()=>{
 const wrapper=({children})=>React.createElement(React.Fragment,null,children),motion={Depth:wrapper,Soft:wrapper,Stage:wrapper,Letters:({text})=>text,Line:()=>null};
 const loader=moduleLoader({'./UpisMotion':motion}),{Upis}=loader('src/components/upis/Upis'),{upisContent}=loader('src/content/upis');
 for(const locale of ['bs','sq','en']){
  const baseline=renderToStaticMarkup(React.createElement(Upis,{locale}));assert.equal(renderToStaticMarkup(React.createElement(Upis,{locale,documentHref:null})),baseline);
  const href=`/api/results/${locale}`,dynamic=renderToStaticMarkup(React.createElement(Upis,{locale,documentHref:href}));upisContent[locale].documents[0].href=href;assert.equal(dynamic,renderToStaticMarkup(React.createElement(Upis,{locale})));upisContent[locale].documents[0].href=null;
  assert.ok(dynamic.includes(`href="${href}"`));assert.ok(!dynamic.includes('vercel.app'));
 }
 for(const f of ['src/admin/results/model.ts','src/admin/results/Results.tsx','src/server/admin/results/service.ts'])assert.ok(!readFileSync(f,'utf8').includes('vercel.app'));
});
test('all new Admin Results endpoints enforce sessions and same origin before remote work',async()=>{
 Object.assign(process.env,fixtureEnvironment);const {createSession,cookieName}=load('src/server/admin/auth');process.env.MEDRESA_ADMIN_USER='fixture';process.env.MEDRESA_ADMIN_SESSION_SECRET='x'.repeat(48);process.env.MEDRESA_ADMIN_PASSWORD_HASH='scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128);process.env.MEDRESA_ADMIN_ORIGIN='http://localhost:3215';
 const token=createSession();let calls=0;const fake=new Proxy({},{get:()=>()=>{calls++;throw new Error('Forbidden remote call');}});
 for(const path of ['index','upload','chunk','finalize','assets']){const {default:handler}=moduleLoader({'@/server/admin/results/service':fake})('src/pages/api/admin/results/'+path);for(const req of [{method:'GET',cookies:{},headers:{},query:{}},{method:'POST',cookies:{[cookieName()]:token},headers:{origin:'https://evil.example'},query:{},body:{}}]){const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};await handler(req,res);assert.equal(res.code,!Object.keys(req.cookies).length?401:path==='assets'?405:403);}}
 assert.equal(calls,0);
});
