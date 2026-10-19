import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';

const load=moduleLoader();
const {legacyRedirects,gonePaths}=load('src/seo/legacy');
const {generations,generationPath}=load('src/content/alumni');
const redirects=legacyRedirects();
const to=source=>redirects.find(r=>r.source===source)?.destination;

test("every old generation page (bs/sq/en) goes to that generation's own page, never the homepage",()=>{
  assert.equal(generations.length,15);
  for(const g of generations){
    const old=new URL(g.source.page).pathname.replace(/\/$/,'');
    assert.equal(to(old),generationPath(g,'bs'));
    assert.equal(to(`/sq${old}`),generationPath(g,'sq'));
    assert.equal(to(`/en${old}`),generationPath(g,'en'));
  }
  for(const r of redirects)assert.equal(r.statusCode,301);
  assert.ok(redirects.every(r=>r.destination!=='/'||/^\/(sq\/|en\/)?home$/.test(r.source)||r.source==='/home'),'only /home goes to the homepage');
});

test('no old upload is redirected (the new site has no copy of the results document); the theme demo entries are gone (410)',()=>{
  assert.ok(redirects.every(r=>!r.source.startsWith('/wp-content/')),'no /wp-content/ redirects');
  for(const p of ['rt-program','rt-research','teams','my-account'])assert.ok(gonePaths.includes(p),p);
  const sources=redirects.map(r=>r.source);
  assert.equal(new Set(sources).size,sources.length,'no duplicate redirect sources');
});
