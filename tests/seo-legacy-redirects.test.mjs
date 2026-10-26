import {test} from 'node:test';
import assert from 'node:assert/strict';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';

const load=moduleLoader();
const {legacyRedirects,gonePaths}=load('src/seo/legacy');
const {generations}=load('src/content/alumni');
const redirects=legacyRedirects();
const to=source=>redirects.find(r=>r.source===source)?.destination;

test('every old generation page (bs/sq/en) goes to its own generation on the Alumni page, never the homepage',()=>{
  assert.equal(generations.length,15);
  for(const g of generations){
    const old=new URL(g.source.page).pathname.replace(/\/$/,'');
    assert.equal(to(old),`/alumni#generacija-${g.number}`);
    assert.equal(to(`/sq${old}`),`/sq/alumni#generacija-${g.number}`);
    assert.equal(to(`/en${old}`),`/en/alumni#generacija-${g.number}`);
  }
  for(const r of redirects)assert.equal(r.statusCode,301);
  assert.ok(redirects.every(r=>r.destination!=='/'||/^\/(sq\/|en\/)?home$/.test(r.source)||r.source==='/home'),'only /home goes to the homepage');
});

test('old documents go to the page that now carries their subject; the theme demo entries are gone (410)',()=>{
  assert.equal(to('/wp-content/uploads/2026/05/KONKURS-2026-2027.pdf'),'/upis');
  assert.equal(to('/wp-content/uploads/2026/05/KONKURS-2026-2027-ALB.pdf'),'/sq/regjistrimi');
  assert.equal(to('/wp-content/uploads/2026/06/2026-06-22-14-06.pdf'),'/upis');
  for(const p of ['rt-program','rt-research','teams','my-account'])assert.ok(gonePaths.includes(p),p);
  const sources=redirects.map(r=>r.source);
  assert.equal(new Set(sources).size,sources.length,'no duplicate redirect sources');
});
