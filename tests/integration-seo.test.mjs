import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';

test('Claude SEO helper retains production canonical, published-only alternates and Preview noindex',()=>{
 const old=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
 try {
  const load=moduleLoader(); const {localizedMetadata}=load('src/i18n/metadata');
  const m=localizedMetadata({bs:'/vijesti/test-bs'},'bs',{title:'Published article',description:'Description'});
  assert.deepEqual(m.alternates.languages,{bs:'/vijesti/test-bs','x-default':'/vijesti/test-bs'});
  assert.equal(m.robots.index,false);assert.equal(m.twitter.card,'summary_large_image');
  assert.equal(load('src/seo/config').siteUrl,'https://www.medresa.me');
  assert.deepEqual(load('src/app/robots').default().rules,{userAgent:'*',disallow:'/'});
 }finally {if(old===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=old;}
});
test('sitemap includes real locale feed publications without drafts, private paths or Preview canonicals',async()=>{
 const base=moduleLoader();const {articles,articleAlternates}=base('src/content/vijesti');
 const published={...articles[0],id:'new-bs-only',bs:{...articles[0].bs,slug:'new-bs-only'}};
 const paths=articleAlternates;
 const load=moduleLoader({'@/server/public/news':{publicNews:async locale=>({articles:[...(locale==='bs'?[published]:[]),...articles],pageCount:2,paths:id=>id==='new-bs-only'?{bs:'/vijesti/new-bs-only'}:paths(articles.find(a=>a.id===id))})}});
 const entries=await load('src/app/sitemap').default();
 const article=entries.find(x=>x.url==='https://www.medresa.me/vijesti/new-bs-only');assert.ok(article);
 assert.deepEqual(article.alternates.languages,{bs:article.url,'x-default':article.url});
 assert.equal(entries.filter(x=>x.url.includes('new-bs-only')).length,1);
 assert.ok(entries.every(x=>!x.url.includes('vercel.app')&&!/^\/(?:admin|ulaz7)(?:\/|$)/.test(new URL(x.url).pathname)));
});
test('Admin entry is moved, credentials/security stay server-side and obsolete entry has no login redirect',()=>{
 assert.equal(existsSync('src/pages/admin'),false);assert.equal(existsSync('src/pages/ulaz7/login.tsx'),true);
 const proxy=readFileSync('src/proxy.ts','utf8');
 assert.match(proxy,/url.pathname = "\/bs\/admin"/);assert.match(proxy,/noindex, nofollow/);
 for(const file of ['src/pages/ulaz7/index.tsx','src/pages/ulaz7/[section].tsx','src/pages/ulaz7/vijesti/[id].tsx','src/pages/ulaz7/vijesti/nova.tsx'])assert.match(readFileSync(file,'utf8'),/protectPage/);
 assert.match(readFileSync('src/pages/ulaz7/login.tsx','utf8'),/name="robots" content="noindex, nofollow"/);
});
