import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
const load = moduleLoader({ 'server-only': {} });
const { newDraft, revise, localeContent } = load('src/admin/model.ts');
const { canonicalJson } = load('src/admin/contracts.ts');
const { archiveAssets, createDraft, saveDraft, publishNews, getNews } = load('src/server/admin/news.ts');
const { translateNews, translateBosnianMaster, translationAvailable, translationConfigurationDiagnostic } = load('src/server/admin/translation.ts');
const { existingTranslationLocales, applyTranslationDraft } = load('src/admin/translation.ts');
const { publicationChecklist, localeStatus } = load('src/admin/publication.ts');
const names = ['VERCEL_GIT_COMMIT_SHA','OPENAI_API_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','MEDRESA_SUPABASE_PROJECT_REF','MEDRESA_SUPABASE_WRITE_ENABLED','VERCEL_ENV','VERCEL_GIT_COMMIT_REF','MEDRESA_ADMIN_USER','MEDRESA_ADMIN_PASSWORD_HASH','MEDRESA_ADMIN_SESSION_SECRET','MEDRESA_ADMIN_ORIGIN'];
async function environment(fn) {
  const old = names.map(n => process.env[n]); const fetch = globalThis.fetch;
  try {
    Object.assign(process.env, { OPENAI_API_KEY:'explicit-openai-test-fixture-no-real-key', SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co', SUPABASE_SERVICE_ROLE_KEY:'explicit-supabase-test-fixture-no-real-key', MEDRESA_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst', MEDRESA_SUPABASE_WRITE_ENABLED:'true', VERCEL_ENV:'preview', VERCEL_GIT_COMMIT_REF:'codex/admin-panel' });
    return await fn();
  } finally { names.forEach((n,i) => old[i] === undefined ? delete process.env[n] : process.env[n] = old[i]); globalThis.fetch = fetch; }
}
const pair = value => ({ sq:value ? 'Përkthim: '+value : '', en:value ? 'Translation: '+value : '' });
// Provider responses are deterministic TEST fixtures; production has no mock path.
function translated(source) {
  return { title:pair(source.title), lead:pair(source.lead), blocks:source.blocks.map(b=>({id:b.id,type:b.type,text:pair(b.text)})), images:source.images.map(i=>({id:i.id,alt:pair(i.alt)})) };
}
const envelope = output => ({ status:'completed', output:[{ type:'message', role:'assistant', content:[{type:'output_text',text:JSON.stringify(output)}] }] });
const json = (value,status=200) => new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json'}});
function master(id='translation-fixture') {
  const d=newDraft(id); d.title.bs='Posjeta Medresi Mehmed Fatih'; d.slug.bs='posjeta-medresi-mehmed-fatih'; d.lead.bs='Učenici su posjetili Medresu.'; d.date='2026-10-08';
  const asset=archiveAssets()[0];
  d.images=[{...asset,alt:{bs:'Učenici ispred Medrese',sq:'',en:''}}]; d.coverImageId=asset.id;
  d.blocks=[{id:'t-first',type:'text',text:{bs:'Datum 08.10.2026, iznos 250,00 EUR. https://medresa.me/prijava i račun ME25505000012345.',sq:'',en:''}}, {id:'i-first',type:'image',assetId:asset.id}, {id:'t-second',type:'text',text:{bs:'Ovo je drugi pasus.\nOvo je drugi red.',sq:'',en:''}}, {id:'i-second',type:'image',assetId:asset.id}, {id:'q-first',type:'quote',text:{bs:'Znanje je važno.',sq:'',en:''}}, {id:'h-first',type:'subheading',text:{bs:'Iz naše škole',sq:'',en:''}}, {id:'t-third',type:'text',text:{bs:'Zajedništvo učenika i nastavnika.',sq:'',en:''}}];
  return d;
}
test('Responses API sends only BS and glossary; validates both locales, restores factual tokens and generates localized slugs',()=>environment(async()=>{
  const d=master(); const original=canonicalJson(d); let calls=0;
  globalThis.fetch=async(url,init)=>{
    calls++; assert.equal(url,'https://api.openai.com/v1/responses'); assert.equal(init.method,'POST'); assert.equal(init.redirect,'error'); assert.ok(init.signal);
    assert.equal(init.headers.Authorization,'Bearer '+process.env.OPENAI_API_KEY);
    const request=JSON.parse(init.body); assert.equal(request.model,'gpt-4.1'); assert.equal(request.store,false); assert.equal(request.text.format.type,'json_schema'); assert.equal(request.text.format.strict,true); assert.equal(request.text.format.schema.additionalProperties,false); assert.equal(request.tools,undefined);
    assert.match(request.instructions,/Bashkësia Islame/); assert.match(request.instructions,/untrusted content/);
    const source=JSON.parse(request.input[0].content); assert.ok(!JSON.stringify(source).includes('250,00')); assert.ok(!JSON.stringify(source).includes('https://medresa.me/prijava')); assert.equal(source.date,undefined); assert.equal(source.images[0].src,undefined);
    return json(envelope(translated(source)));
  };
  const result=await translateBosnianMaster(d); assert.equal(calls,1); assert.equal(canonicalJson(d),original);
  assert.equal(result.slug.sq,'perkthim-posjeta-medresi-mehmed-fatih'); assert.equal(result.slug.en,'translation-posjeta-medresi-mehmed-fatih');
  for(const l of ['sq','en']) for(const fact of ['08.10.2026','250,00','EUR','https://medresa.me/prijava','ME25505000012345']) assert.ok(result.blocks[0].text[l].includes(fact));
  assert.deepEqual(result.blocks.map(b=>[b.id,b.type]),d.blocks.map(b=>[b.id,b.type]));
}));
test('missing key, read-only DB, invalid project, Production and other branches fail closed before provider calls',()=>environment(async()=>{
  let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('Must not contact provider');};
  for(const [name,value] of [['OPENAI_API_KEY',''],['MEDRESA_SUPABASE_WRITE_ENABLED','false'],['MEDRESA_SUPABASE_PROJECT_REF','wrongprojectref'],['VERCEL_ENV','production'],['VERCEL_ENV','development'],['VERCEL_GIT_COMMIT_REF','main']]) {
    const old=process.env[name]; process.env[name]=value; assert.equal(translationAvailable(),false); await assert.rejects(translateBosnianMaster(master()),e=>e.status===503); process.env[name]=old;
  }
  assert.equal(calls,0);
}));
test('identical regenerated translations still become unreviewed drafts while the publication remains retained',()=>{
  const { toLocalePublicArticle }=load('src/admin/publication.ts'); const d=master();
  const source={title:d.title.bs,lead:d.lead.bs,blocks:d.blocks.map(b=>({id:b.id,type:b.type,text:b.type==='image'?'':b.text.bs})),images:d.images.map(i=>({id:i.id,alt:i.alt.bs}))};
  const t={...translated(source),slug:{sq:'same-sq-slug',en:'same-en-slug'}};
  let initial=applyTranslationDraft(d,t); for(const l of ['bs','sq','en']) initial.review[l]={approved:true,reviewedRevision:initial.revision};
  const publications={sq:{snapshot:toLocalePublicArticle(initial,'sq')}};
  assert.equal(localeStatus(initial,publications,'sq'),'published');
  const result=applyTranslationDraft(initial,t); assert.equal(localeStatus(result,publications,'sq'),'draft'); assert.equal(localeContent(initial,'bs'),localeContent(result,'bs')); assert.ok(result.review.bs.approved); assert.equal(result.review.sq.approved,false);
});
test('invalid AI output, refusals, truncation, transport and provider failures reject safely and redact secrets',()=>environment(async()=>{
  const d=master(); const before=canonicalJson(d);
  const mutations=[o=>{delete o.title.en;},o=>{o.title.bs='overwrite';},o=>{o.date='2027-01-01';},o=>{o.blocks.reverse();},o=>{o.blocks[0].type='quote';},o=>{o.blocks[1].text.en='Invented image text';},o=>{o.blocks[0].id='wrong';},o=>{o.images[0].id='wrong';},o=>{o.images[0].src='/images/changed.jpg';},o=>{o.images[0].alt.en='';},o=>{o.blocks[0].text.en='Invented facts 999';},o=>{o.blocks[2].text.en+='\n![](7)';},o=>{o.blocks[0].text.sq=o.blocks[0].text.sq.replace('⟦KEEP:0⟧','');},o=>{o.blocks[0].text.sq+='⟦KEEP:999⟧';},o=>{o.blocks[2].text.en='## New subheading';},o=>{o.title.en=null;}];
  for(const mutate of mutations) {
    globalThis.fetch=async(_url,init)=>{const o=translated(JSON.parse(JSON.parse(init.body).input[0].content));mutate(o);return json(envelope(o));};
    await assert.rejects(translateBosnianMaster(d),e=>e.status===502); assert.equal(canonicalJson(d),before);
  }
  for(const body of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',role:'assistant',content:[{type:'refusal',refusal:'private details'}]}]}, {status:'completed',output:[]}]) {
    globalThis.fetch=async()=>json(body); await assert.rejects(translateBosnianMaster(d),e=>e.status===502);
  }
  for(const status of [401,403,429,500]) {
    globalThis.fetch=async()=>json({error:process.env.OPENAI_API_KEY+' private-provider-content'},status);
    await assert.rejects(translateBosnianMaster(d),e=>e.status===502 && !e.message.includes(process.env.OPENAI_API_KEY) && !e.message.includes('private-provider-content'));
  }
  globalThis.fetch=async()=>{throw new Error(process.env.OPENAI_API_KEY);}; await assert.rejects(translateBosnianMaster(d),e=>e.status===502 && !e.message.includes(process.env.OPENAI_API_KEY));
  globalThis.fetch=async()=>new Response('not-json'); await assert.rejects(translateBosnianMaster(d));
  assert.equal(canonicalJson(d),before);
}));
test('real save RPC atomically persists SQ/EN drafts; preserves BS, images/publications; manual edits, failures, races and slug conflicts remain safe',()=>environment(async()=>{
  const db=new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  for(const path of ['202610070001_admin_news.sql','202610080002_publication_integrity.sql','202610080003_locale_publication.sql']) await db.exec(readFileSync('supabase/migrations/'+path,'utf8'));
  let mode='success'; let openai=0; const writes=[]; let release; let started; let raceInput;
  globalThis.fetch=async(address,init={})=>{
    if(address==='https://api.openai.com/v1/responses') {
      openai++;
      if(mode==='failure') return json({error:'private-provider-content'},500);
      if(mode==='invalid') return json(envelope({title:{sq:'broken'}}));
      if(mode==='deferred') { started(); await new Promise(resolve=>release=resolve); }
      if(mode==='race') { await db.query('select medresa_admin_save($1,$2,$3)',[JSON.stringify(raceInput),raceInput.revision-1,'other-editor']); }
      return json(envelope(translated(JSON.parse(JSON.parse(init.body).input[0].content))));
    }
    const url=new URL(address); assert.equal(url.origin,process.env.SUPABASE_URL);
    try {
      if(url.pathname.startsWith('/rest/v1/rpc/')) {
        const name=url.pathname.split('/').pop(); const fields={medresa_admin_save:['p_document','p_expected','p_actor'],medresa_admin_publish_locales:['p_id','p_expected','p_locales','p_snapshots','p_actor']}[name]; assert.ok(fields); const body=JSON.parse(init.body); writes.push(name);
        const args=fields.map(k=>k==='p_locales'?body[k]:typeof body[k]==='object'?JSON.stringify(body[k]):body[k]);
        return json((await db.query(`select to_jsonb(${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})) as result`,args)).rows[0].result);
      }
      assert.equal(init.method??'GET','GET'); const table=url.pathname.split('/').pop(); assert.ok(['medresa_admin_articles','medresa_admin_locale_publication_state','medresa_admin_assets'].includes(table));
      const value=url.searchParams.get(table==='medresa_admin_locale_publication_state'?'article_id':'id');
      const id=value?.startsWith('eq.')?value.slice(3):null;
      return json((await db.query(`select * from ${table}${id?' where '+(table==='medresa_admin_locale_publication_state'?'article_id':'id')+'=$1':''}`,id?[id]:[])).rows);
    } catch(error) {return json({code:error.code||'fixture-error'},500);}
  };
  try {
    let article=await createDraft('test-admin'); let source=revise(article.draft,master(article.draft.id)); source.revision=1;
    source.review.bs={approved:true,reviewedRevision:1}; article=await saveDraft(source,0,'test-admin');
    article=await publishNews(article.draft.id,article.draft.revision,'test-admin',['bs']);
    const bs=localeContent(article.draft,'bs'); const frozen=structuredClone(article.publications.bs); const identity=article.draft.id; const image=structuredClone(article.draft.images[0]);
    const revisionsBefore=(await db.query('select count(*)::int n from medresa_admin_revisions where article_id=$1',[identity])).rows[0].n;
    const at=writes.length; const result=await translateNews(article.draft,article.draft.revision,[],'test-admin');
    assert.deepEqual(writes.slice(at),['medresa_admin_save']); assert.equal(localeContent(result.draft,'bs'),bs); assert.equal(result.draft.id,identity); assert.equal(result.draft.date,source.date); assert.equal(result.draft.coverImageId,source.coverImageId); assert.deepEqual(result.draft.blocks.map(b=>[b.id,b.type,b.assetId]),source.blocks.map(b=>[b.id,b.type,b.assetId]));
    assert.deepEqual(Object.fromEntries(Object.entries(result.draft.images[0]).filter(([k])=>k!=='alt')),Object.fromEntries(Object.entries(image).filter(([k])=>k!=='alt'))); assert.equal(result.draft.images[0].alt.bs,image.alt.bs);
    assert.deepEqual(result.publications,{bs:frozen}); assert.equal(result.draft.review.bs.approved,true); for(const l of ['sq','en']) { assert.equal(result.draft.review[l].approved,false); assert.equal(result.draft.review[l].reviewedRevision,null); assert.equal(localeStatus(result.draft,result.publications,l),'draft'); }
    assert.equal(canonicalJson((await getNews(identity)).draft),canonicalJson(result.draft)); assert.equal((await db.query('select count(*)::int n from medresa_admin_revisions where article_id=$1',[identity])).rows[0].n,revisionsBefore+1);
    let sq=revise(result.draft,{title:{...result.draft.title,sq:'Titull i redaktuar'}}); sq.review.sq={approved:true,reviewedRevision:sq.revision}; assert.ok(publicationChecklist(sq,'sq').every(c=>c.complete));
    let published=await saveDraft(sq,result.draft.revision,'test-admin'); published=await publishNews(identity,published.draft.revision,'test-admin',['sq']);
    assert.deepEqual(published.publications.bs,frozen); assert.ok(published.publications.sq); assert.equal(published.publications.en,undefined); assert.equal(localeStatus(published.draft,published.publications,'en'),'draft');
    const unchanged=canonicalJson(published.draft); const calls=openai; const writeCount=writes.length;
    await assert.rejects(translateNews(published.draft,published.draft.revision,[],'test-admin'),e=>e.status===409); assert.equal(openai,calls); assert.equal(writes.length,writeCount);
    await assert.rejects(translateNews({...published.draft,title:{...published.draft.title,sq:''}},published.draft.revision,['en'],'test-admin'),e=>e.status===409);
    for(const failure of ['failure','invalid']) { mode=failure; await assert.rejects(translateNews(published.draft,published.draft.revision,['sq','en'],'test-admin')); assert.equal(canonicalJson((await getNews(identity)).draft),unchanged); }
    mode='deferred'; const entered=new Promise(resolve=>started=resolve); const pending=translateNews(published.draft,published.draft.revision,['sq','en'],'test-admin'); await entered;
    await assert.rejects(translateNews(published.draft,published.draft.revision,['sq','en'],'test-admin'),e=>e.status===409); release(); const replaced=await pending;
    assert.deepEqual(replaced.publications,published.publications); assert.equal(replaced.draft.review.sq.approved,false); assert.equal(replaced.draft.review.en.approved,false);
    mode='race'; raceInput=revise(replaced.draft,{title:{...replaced.draft.title,sq:'Concurrent manual edit'}});
    await assert.rejects(translateNews(replaced.draft,replaced.draft.revision,['sq','en'],'test-admin'),e=>e.status===409); assert.equal((await getNews(identity)).draft.title.sq,'Concurrent manual edit');
    mode='success'; const second=await createDraft('test-admin'); let next=revise(second.draft,master(second.draft.id)); next.revision=1; next.slug.bs='different-bs-url'; const secondSaved=await saveDraft(next,0,'test-admin');
    const beforeConflict=canonicalJson(secondSaved.draft); await assert.rejects(translateNews(secondSaved.draft,secondSaved.draft.revision,[],'test-admin'),e=>e.status===409); assert.equal(canonicalJson((await getNews(secondSaved.draft.id)).draft),beforeConflict);
    assert.deepEqual(existingTranslationLocales(replaced.draft),['sq','en']);
  } finally { await db.close(); }
}));
test('translation API requires Admin session, same origin, POST and explicit revision/confirmation; keys are never reflected',()=>environment(async()=>{
  const auth=load('src/server/admin/auth.ts'); const handler=load('src/pages/api/admin/translation.ts').default;
  Object.assign(process.env,{MEDRESA_ADMIN_USER:'translation-test-admin',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128),MEDRESA_ADMIN_SESSION_SECRET:'explicit-translation-test-session-secret-32-characters',MEDRESA_ADMIN_ORIGIN:'https://admin.example.test'});
  const res=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
  let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('No provider calls allowed');};
  const cookies={[auth.cookieName()]:auth.createSession()};
  for(const [request,status] of [[{method:'POST',cookies:{}},401],[{method:'GET',cookies},405],[{method:'POST',cookies,headers:{origin:'https://foreign.example.test'}},403],[{method:'POST',cookies,headers:{origin:process.env.MEDRESA_ADMIN_ORIGIN},body:{draft:master(),expectedRevision:-1,confirmedLocales:[]}},422]]) {
    const response=res(); await handler({headers:{},...request},response); assert.equal(response.statusCode,status); assert.match(response.headers['Cache-Control'],/no-store/); assert.ok(!JSON.stringify(response.body).includes(process.env.OPENAI_API_KEY));
  }
  assert.equal(calls,0);
}));

test('authenticated runtime diagnostic distinguishes missing key from Supabase/branch guards and exposes booleans only',()=>environment(async()=>{
  let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('No provider calls allowed');};
  process.env.VERCEL_GIT_COMMIT_SHA='a'.repeat(40);
  let report=translationConfigurationDiagnostic(); assert.equal(report.available,true); assert.deepEqual(report.failedChecks,[]); assert.equal(report.checks.openAiKeyPresent,true); assert.equal(report.commitSha,'a'.repeat(40));
  for(const [name,value,expected] of [['OPENAI_API_KEY','   ','openAiKeyPresent'],['MEDRESA_SUPABASE_WRITE_ENABLED','false','supabaseWritesEnabled'],['MEDRESA_SUPABASE_PROJECT_REF','wrongprojectref','supabaseConfigurationAvailable'],['VERCEL_GIT_COMMIT_REF','main','adminBranch'],['VERCEL_ENV','production','previewEnvironment']]) {
    const old=process.env[name];process.env[name]=value;report=translationConfigurationDiagnostic();assert.equal(report.available,false);assert.equal(report.checks[expected],false);assert.ok(report.failedChecks.includes(expected));assert.ok(Object.values(report.checks).every(v=>typeof v==='boolean'));process.env[name]=old;
  }
  process.env.VERCEL_GIT_COMMIT_SHA=process.env.OPENAI_API_KEY;assert.equal(translationConfigurationDiagnostic().commitSha,null);assert.equal(calls,0);
  const auth=load('src/server/admin/auth.ts');const handler=load('src/pages/api/admin/diagnostics.ts').default;
  Object.assign(process.env,{MEDRESA_ADMIN_USER:'diagnostic-test-admin',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128),MEDRESA_ADMIN_SESSION_SECRET:'explicit-diagnostic-test-session-secret-32-characters',MEDRESA_ADMIN_ORIGIN:'https://admin.example.test'});
  const res=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
  const cookies={[auth.cookieName()]:auth.createSession()};
  for(const [request,status] of [[{method:'GET',cookies:{}},401],[{method:'POST',cookies},405]]) {const response=res();await handler({query:{connectivity:'1'},headers:{},...request},response);assert.equal(response.statusCode,status);assert.equal(response.body.translation,undefined);}
  globalThis.fetch=async()=>{calls++;return json([]);};
  const check=async()=>{const response=res();await handler({method:'GET',query:{connectivity:'1'},headers:{},cookies},response);assert.equal(response.statusCode,200);assert.match(response.headers['Cache-Control'],/private.*no-store/);return response.body;};
  delete process.env.OPENAI_API_KEY;let body=await check();assert.equal(body.translation.checks.openAiKeyPresent,false);assert.equal(body.translation.available,false);assert.deepEqual(body.translation.failedChecks,['openAiKeyPresent']);
  process.env.OPENAI_API_KEY='explicit-live-presence-test-fixture-key';body=await check();assert.equal(body.translation.checks.openAiKeyPresent,true);assert.equal(body.translation.available,true);assert.deepEqual(body.translation.failedChecks,[]);assert.ok(!JSON.stringify(body).includes(process.env.OPENAI_API_KEY));
  // Protect against accidental secrets entered in a non-secret runtime field too.
  process.env.MEDRESA_SUPABASE_PROJECT_REF=process.env.OPENAI_API_KEY;body=await check();assert.equal(body.runtime.projectRef,null);assert.ok(!JSON.stringify(body).includes(process.env.OPENAI_API_KEY));
}));
