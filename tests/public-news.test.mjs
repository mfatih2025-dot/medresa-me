import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
const base = moduleLoader(); const { articles } = base('src/content/vijesti'); const { getDictionary } = base('src/content');
const provider = 'https://abcdefghijklmnopqrst.supabase.co'; const secret = 'sb_secret_public_feed_fixture';
const originalEnv = ['VERCEL_ENV','VERCEL_GIT_COMMIT_REF'].map(k=>process.env[k]);
function fixture(rows, fetcher) {
  process.env.VERCEL_ENV='preview'; process.env.VERCEL_GIT_COMMIT_REF='codex/admin-panel';
  const calls=[];
  const load=moduleLoader({ 'server-only':{}, react:{cache:fn=>fn}, 'next/server':{connection:async()=>{}}, '@/server/admin/supabase':{supabaseConfiguration:()=>({url:provider,key:secret})} });
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async (url,init)=>{
    calls.push({url,init}); assert.equal(init.method,'GET'); assert.equal(init.cache,'no-store'); assert.equal(init.redirect,'error');
    assert.equal(new Headers(init.headers).get('apikey'),secret); assert.equal(new Headers(init.headers).has('Authorization'),false);
    if(fetcher) return fetcher(url,init);
    assert.match(url,/\/rest\/v1\/medresa_admin_public_locale_feed\?/);
    const u=new URL(url); const offset=Number(u.searchParams.get('offset')); const limit=Number(u.searchParams.get('limit'));
    return Response.json(rows.slice(offset,offset+limit));
  };
  return {news:load('src/server/public/news.ts'),media:load('src/app/api/news/media/[id]/route.ts'),calls,restore(){globalThis.fetch=oldFetch; ['VERCEL_ENV','VERCEL_GIT_COMMIT_REF'].forEach((k,i)=>originalEnv[i]===undefined?delete process.env[k]:process.env[k]=originalEnv[i]);}};
}
function row(id='public-bs-only', locale='bs',date='2026-10-08') {
  const snapshot={id,date,topic:'school',photos:[],bs:{title:'PRIVATE BS',slug:'private-bs',body:'PRIVATE BS BODY'},sq:{title:'PRIVATE SQ',slug:'private-sq',body:'PRIVATE SQ BODY'},en:{title:'PRIVATE EN',slug:'private-en',body:'PRIVATE EN BODY'}};
  snapshot[locale]={title:'Published '+locale,slug:id+'-'+locale,body:'Published body '+locale};
  return {article_id:id,locale,snapshot,source_order:null};
}
test('public feed combines BS with all 17 unchanged articles; other drafts and alternates are absent',async()=>{
  const f=fixture([row()]); try {
    const bs=await f.news.publicNews('bs'); assert.equal(bs.articles.length,18); assert.deepEqual(bs.articles.slice(1),articles);
    assert.equal(bs.bySlug('public-bs-only-bs').bs.title,'Published bs'); assert.equal(bs.navigation(bs.articles[0]).older.id,articles[0].id);
    assert.deepEqual(bs.paths('public-bs-only'),{bs:'/vijesti/public-bs-only-bs'});
    for(const l of ['sq','en']) { const store=await f.news.publicNews(l); assert.deepEqual(store.articles,articles); assert.equal(store.byOtherSlug('public-bs-only-bs'),undefined); }
    assert.ok(!JSON.stringify(bs).includes('PRIVATE')); assert.equal(bs.pageCount,2);
    assert.deepEqual((await f.news.publicHomeDictionary('bs')).news.items.map(x=>x.href),['/vijesti/public-bs-only-bs',...getDictionary('bs').news.items.slice(0,2).map(x=>x.href)]);
    assert.deepEqual((await f.news.publicHomeDictionary('sq')).news.items,getDictionary('sq').news.items);
    assert.ok(!JSON.stringify(bs).includes(secret));
  } finally { f.restore(); }
});
test('later SQ uses its own frozen date/photos and locale slug; imported legacy IDs cannot change original content/URLs',async()=>{
  const bs=row(); const sq=row('public-bs-only','sq','2026-12-01'); const imported=row(articles[0].id,'bs');
  const f=fixture([bs,sq,imported]); try {
    const store=await f.news.publicNews('sq'); assert.equal(store.articles[0].date,'2026-12-01'); assert.deepEqual(store.byOtherSlug(bs.snapshot.bs.slug),store.articles[0]);
    assert.deepEqual(store.paths('public-bs-only'),{bs:'/vijesti/public-bs-only-bs',sq:'/sq/lajme/public-bs-only-sq'});
    assert.deepEqual((await f.news.publicNews('bs')).articles.find(x=>x.id===articles[0].id),articles[0]);
    assert.equal((await f.news.publicNews('en')).articles.length,17);
  } finally {f.restore();}
});
test('feed paging and public pagination include every publication; original archive retains its relative order',async()=>{
  const rows=Array.from({length:205},(_,i)=>row('public-'+i,'bs','2026-10-08')); const f=fixture(rows);
  try { const store=await f.news.publicNews('bs'); assert.equal(store.articles.length,222); assert.equal(store.pageCount,19); assert.equal(store.onPage(19).length,6); assert.equal(f.calls.length,2); assert.deepEqual(store.articles.filter(a=>articles.some(old=>old.id===a.id)),articles); }
  finally {f.restore();}
});
test('transport, provider errors and malformed snapshots fall back exactly to static archive/home; Production and other branches do not contact Supabase',async()=>{
  for(const providerResponse of [()=>{throw new Error(secret);},()=>new Response(secret,{status:503}),()=>Response.json({document:'PRIVATE'}),()=>Response.json([{...row(),snapshot:{...row().snapshot,date:'2026-02-31'}}])]) {
    const f=fixture([],providerResponse); try {assert.deepEqual((await f.news.publicNews('bs')).articles,articles); assert.deepEqual((await f.news.publicHomeDictionary('bs')).news.items,getDictionary('bs').news.items);} finally{f.restore();}
  }
  const f=fixture([row()]); try {
    for(const [env,branch] of [['production','codex/admin-panel'],['preview','main'],['development','codex/admin-panel']]) {process.env.VERCEL_ENV=env;process.env.VERCEL_GIT_COMMIT_REF=branch;assert.deepEqual((await f.news.publicNews('bs')).articles,articles);}
    assert.equal(f.calls.length,0);
  } finally{f.restore();}
});
test('published images expose only approved derivative; draft/unreferenced assets, originals and Production remain inaccessible',async()=>{
  const r=row(); r.snapshot.photos=[{src:'/api/admin/media/published-photo',width:1200,height:800,alt:{bs:'Public image',sq:'PRIVATE ALT',en:'PRIVATE ALT'}}];
  const f=fixture([r],url=>{
    if(url.includes('medresa_admin_public_locale_feed'))return Response.json([r]);
    if(url.includes('medresa_admin_assets')) return Response.json([{bucket:'medresa-news-preview',object_path:'images/published-photo.webp',mime:'image/webp'}]);
    assert.equal(url,provider+'/storage/v1/object/authenticated/medresa-news-preview/images/published-photo.webp'); return new Response(new Uint8Array([82,73,70,70]));
  });try {
    const store=await f.news.publicNews('bs'); assert.equal(store.articles[0].photos[0].src,'/api/news/media/published-photo'); assert.equal(store.articles[0].photos[0].alt.sq,'');
    const get=id=>f.media.GET(new Request('https://public.example.test'),{params:Promise.resolve({id})});
    const image=await get('published-photo');assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');assert.equal(image.headers.get('cache-control'),'no-store');
    const before=f.calls.length; assert.equal((await get('private-draft')).status,404);assert.equal(f.calls.length,before+1); // feed read, no asset/storage read
    assert.equal((await get('../original')).status,404);
    process.env.VERCEL_ENV='production'; assert.equal((await get('published-photo')).status,404);
  }finally{f.restore();}
});
test('locked public typography/classes/animation attributes and renderer DOM elements remain identical',()=>{
  for(const path of ['src/components/vijesti/Archive.tsx','src/components/vijesti/Article.tsx']) {
    const baseline=JSON.parse(readFileSync('tests/fixtures/public-news-renderers.json','utf8')); const current=readFileSync(path,'utf8');
    const styling=source=>{
      const file=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const attrs=[];const elements=[];
      function walk(node){if(ts.isJsxAttribute(node)&&!['totalPages'].includes(node.name.getText(file)))attrs.push(node.getText(file));if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))elements.push(node.tagName.getText(file));ts.forEachChild(node,walk);}walk(file);return {attrs,elements};
    };
    assert.equal(createHash('sha256').update(JSON.stringify(styling(current))).digest('hex'),baseline.sha256[path]);
  }
});

 test('archive metadata links only locales with that page; article metadata lists only published translations',async()=>{
  const news=base('src/content/vijesti');const metadata=base('src/i18n/metadata.ts');
  const article=row().snapshot;
  const load=moduleLoader({ '@/server/public/news':{publicNews:async l=>({pageCount:l==='bs'?3:2,bySlug:slug=>slug===article.bs.slug?article:undefined,paths:()=>({bs:news.articlePath(article,'bs')})})}, '@/components/vijesti/Archive':{Archive:()=>null}, '@/components/vijesti/Article':{Article:()=>null}, 'next/navigation':{notFound:()=>{throw new Error('404');},permanentRedirect:()=>{throw new Error('308');}} });
  const route=load('src/app/[locale]/vijesti/[slug]/page.tsx');
  const page=await route.generateMetadata({params:Promise.resolve({locale:'bs',slug:'3'})});
  assert.deepEqual(page.alternates.languages,{bs:'/vijesti/3','x-default':'/vijesti/3'});
  const item=await route.generateMetadata({params:Promise.resolve({locale:'bs',slug:article.bs.slug})});
  assert.deepEqual(item.alternates.languages,{bs:'/vijesti/'+article.bs.slug,'x-default':'/vijesti/'+article.bs.slug});
  assert.equal(item.title.absolute,metadata.localizedMetadata({bs:'/vijesti/'+article.bs.slug},'bs',{title:article.bs.title}).title.absolute);
 });
