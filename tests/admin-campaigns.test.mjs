import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import sharp from 'sharp';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
import { campaignDatabase, campaignRest, fixtureEnvironment } from './fixtures/campaigns.mjs';
const env={...process.env},originalFetch=globalThis.fetch;
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);globalThis.fetch=originalFetch;});
const load=moduleLoader();
const {validateCampaign}=load('src/admin/campaigns/contracts');
const {validDestination,eligible,dismissalKey}=load('src/admin/campaigns/model');
const service=load('src/server/admin/campaigns/service');
const content=()=>({bs:{text:'SAZNAJ VIŠE',link:'/upis'},sq:{text:'SQ fixture',link:'/sq/upis'},en:{text:'EN fixture',link:'/en/upis'}});
const draft=(overrides={})=>({id:randomUUID(),revision:0,name:'Explicit local campaign fixture',posterId:null,ctaText:'SAZNAJ VIŠE',ctaLink:'/upis',content:content(),active:false,startsAt:null,endsAt:null,...overrides});
const image=()=>sharp({create:{width:600,height:900,channels:3,background:'#123c31'}}).png().toBuffer();
test('campaign contract rejects executable destinations, unsafe assets, malformed schedules and active missing posters',()=>{
  validateCampaign(draft());
  for(const url of ['/upis','/donacije?akcija=1#info','https://example.org/path?q=1#exact'])assert.equal(validDestination(url),true);
  for(const url of ['javascript:alert(1)','data:text/html,x','//evil.example','/\\evil.example','https://user:pass@example.org','/admin','/api/admin/login','/./admin','/%61dmin','/upis\n',' http://x','http://example.org',''])assert.equal(validDestination(url),false,url);
  for(const patch of [{active:true},{name:''},{name:'x'.repeat(161)},{content:{bs:{text:'',link:''}}},{revision:-1},{posterId:'bad'},{startsAt:'2026-02-31T12:00:00Z'},{startsAt:'2026-10-10T12:00:00.000Z',endsAt:'2026-10-10T11:00:00.000Z'}])assert.throws(()=>validateCampaign(draft(patch)));
});
test('manual status and schedule boundaries select just one campaign; no name in public projection',()=>{
  const id=randomUUID(),p={id:randomUUID(),src:'/private',width:600,height:900};
  const c={...draft({id}),revision:1,poster:p,createdAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',activatedAt:'2026-10-01T00:00:00Z',active:true};
  const n=Date.parse('2026-10-10T12:00:00Z');
  assert.equal(eligible(c,n),true);assert.equal(eligible({...c,active:false},n),false);
  assert.equal(eligible({...c,startsAt:'2026-10-10T12:00:01Z'},n),false);assert.equal(eligible({...c,endsAt:'2026-10-10T12:00:00Z'},n),false);
  const second={...c,id:randomUUID(),activatedAt:'2026-10-09T00:00:00Z'};
  const selected=service.selectCampaign([c,second],n).campaign;assert.equal(selected.id,second.id);assert.equal(selected.ctaLink,'/upis');assert.equal('name' in selected,false);assert.equal(selected.poster.src,`/api/campaigns/poster/${second.id}?version=1`);
  assert.equal(service.selectCampaign([{...c,startsAt:'2026-10-11T00:00:00Z'}],n).nextChangeAt,'2026-10-11T00:00:00Z');
  assert.equal(service.selectCampaign([{...c,active:false}],n).campaign,null);
  assert.notEqual(dismissalKey({id,version:1}),dismissalKey({id,version:2}));assert.notEqual(dismissalKey({id,version:1}),dismissalKey({id:randomUUID(),version:1}));
});
test('Preview guard fails closed on main, Production, different project, read-only mutations; empty public fail-safe',async()=>{
  Object.assign(process.env,fixtureEnvironment);let calls=0;globalThis.fetch=()=>{calls++;throw new Error('Network forbidden');};
  for(const patch of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},{SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',MEDRESA_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst'}]){
    Object.assign(process.env,fixtureEnvironment,patch);await assert.rejects(service.saveCampaign(draft(),'fixture'));assert.equal((await service.currentCampaign()).campaign,null);
  }
  Object.assign(process.env,fixtureEnvironment,{MEDRESA_SUPABASE_WRITE_ENABLED:'false'});assert.throws(()=>service.campaignConfiguration(true));assert.equal(calls,0);
});
test('additive campaign migration validates RLS/private Storage/grants and optimistic save/history retention',async()=>{
  const db=await campaignDatabase();try {
    const tables=(await db.query("select relname,relrowsecurity from pg_class where relname in ('medresa_campaigns','medresa_campaign_assets')")).rows;assert.equal(tables.length,2);assert.ok(tables.every(t=>t.relrowsecurity));
    const bucket=(await db.query("select * from storage.buckets where id='medresa-campaigns-preview'")).rows[0];assert.equal(bucket.public,false);assert.equal(bucket.file_size_limit,4194304);assert.deepEqual(bucket.allowed_mime_types,['image/jpeg','image/png','image/webp']);
    assert.equal((await db.query('select count(*)::int n from medresa_campaigns')).rows[0].n,0);
    const f=(await db.query("select prosecdef,proconfig from pg_proc where proname='medresa_campaign_save'")).rows[0];assert.equal(f.prosecdef,false);assert.deepEqual(f.proconfig,['search_path=public, pg_temp']);
    for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(db.query('select * from medresa_campaigns'),e=>e.code==='42501');await assert.rejects(db.query('select medresa_campaign_save($1,0,$2,null,$3,$4,false,null,null,$5)',[randomUUID(),'x','CTA','/upis','actor']),e=>e.code==='42501');await db.exec('reset role');}
    Object.assign(process.env,fixtureEnvironment);globalThis.fetch=campaignRest(db);const saved=await service.saveCampaign(draft(),'fixture');assert.equal(saved.revision,1);
    const updated=await service.saveCampaign({...draft({id:saved.id}),revision:1,name:'Edited local fixture'},'fixture');assert.equal(updated.revision,2);
    await assert.rejects(service.saveCampaign({...draft({id:saved.id}),revision:1},'fixture'),e=>e.status===409);
    await db.exec('set role service_role');assert.equal((await service.saveCampaign(draft(),'service-role-fixture')).revision,1);assert.equal((await db.query("select has_table_privilege('service_role','medresa_campaigns','DELETE') allowed")).rows[0].allowed,true);await assert.rejects(db.query('truncate medresa_campaigns'),e=>e.code==='42501');await assert.rejects(db.query('update medresa_campaign_assets set mime=$1',['image/png']),e=>e.code==='42501');await db.exec('reset role');
    assert.equal((await db.query('select count(*)::int n from medresa_admin_articles')).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n,0);
    assert.equal((await db.query("select public from storage.buckets where id='medresa-news-preview'")).rows[0].public,false);
  }finally{await db.close();}
});
test('original poster bytes, replacement, remove, activation/deactivation and authenticated/public readbacks stay isolated',async()=>{
  const db=await campaignDatabase();try {
    Object.assign(process.env,fixtureEnvironment);const objects=new Map();globalThis.fetch=campaignRest(db,objects);
    const original=await image(),poster=await service.uploadPoster(original,'image/png','fixture');assert.equal(poster.width,600);assert.equal(poster.height,900);
    assert.deepEqual((await service.readPoster(poster.id)).bytes,original);
    const p2=await service.uploadPoster(original,'image/png','fixture');assert.notEqual(p2.id,poster.id);
    let c=await service.saveCampaign(draft({posterId:poster.id,active:true,ctaText:'Exact admin CTA',ctaLink:'https://example.org/donate?q=1#details',content:{...content(),bs:{text:'Exact admin CTA',link:'https://example.org/donate?q=1#details'}}}),'fixture');
    assert.equal((await service.listCampaigns()).campaigns[0].name,c.name);const current=(await service.currentCampaign()).campaign;assert.equal(current.ctaLink,c.ctaLink);
    assert.equal(createHash('sha256').update((await service.publicPoster(c.id,String(c.revision))).bytes).digest('hex'),createHash('sha256').update(original).digest('hex'));
    c=await service.saveCampaign({...draft({id:c.id,posterId:p2.id,active:true}),revision:c.revision},'fixture');assert.equal(c.poster.id,p2.id);assert.equal(objects.size,2);
    await assert.rejects(service.publicPoster(c.id,'1'),e=>e.status===404);await assert.rejects(service.publicPoster(randomUUID(),String(c.revision)),e=>e.status===404);
    c=await service.saveCampaign({...draft({id:c.id,posterId:p2.id}),revision:c.revision},'fixture');assert.equal((await service.currentCampaign()).campaign,null);await assert.rejects(service.publicPoster(c.id,String(c.revision)),e=>e.status===404);
    c=await service.saveCampaign({...draft({id:c.id}),revision:c.revision},'fixture');assert.equal(c.poster,null);assert.equal(objects.size,2,'Removing image reference never destroys history/original assets');
    assert.equal((await db.query('select count(*)::int n from medresa_campaigns')).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from medresa_campaign_assets')).rows[0].n,2);
    await assert.rejects(service.validatePoster(original,'image/jpeg'));await assert.rejects(service.validatePoster(Buffer.from('bad'),'image/png'));await assert.rejects(service.validatePoster(Buffer.alloc(4194305),'image/png'));
    const oriented=await sharp({create:{width:40,height:80,channels:3,background:'#123c31'}}).jpeg().withMetadata({orientation:6}).toBuffer();
    assert.deepEqual(await service.validatePoster(oriented,'image/jpeg'),{width:80,height:40});
    const rotated=await service.uploadPoster(oriented,'image/jpeg','fixture');assert.deepEqual((await service.readPoster(rotated.id)).bytes,oriented);
    const css=new Proxy({}, {get:(_,k)=>String(k)}),{PosterDialog}=moduleLoader({'./popup.module.css':{default:css}})('src/components/campaigns/PosterDialog');
    const html=renderToStaticMarkup(React.createElement(PosterDialog,{campaign:current,onClose(){}}));assert.ok(html.includes('Obavijest Medrese'));assert.ok(html.includes('Exact admin CTA'));assert.ok(!html.includes(c.name));assert.ok(!html.includes(process.env.SUPABASE_SERVICE_ROLE_KEY));
  }finally{await db.close();}
});
test('campaign mutation/upload/asset endpoints authenticate before touching storage and reject foreign origins',async()=>{
  let calls=0;const fake={deleteCampaign(){calls++;},campaignConfiguration(){calls++;},listCampaigns(){calls++;},saveCampaign(){calls++;},uploadPoster(){calls++;},readPoster(){calls++;}};
  Object.assign(process.env,fixtureEnvironment);const {createSession,cookieName}=load('src/server/admin/auth');
  process.env.MEDRESA_ADMIN_USER='fixture';process.env.MEDRESA_ADMIN_SESSION_SECRET='x'.repeat(48);process.env.MEDRESA_ADMIN_PASSWORD_HASH='scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128);process.env.MEDRESA_ADMIN_ORIGIN='http://localhost:3214';
  const token=createSession();
  for(const path of ['src/pages/api/admin/campaigns/index','src/pages/api/admin/campaigns/assets/index','src/pages/api/admin/campaigns/assets/[id]']) {
    const {default:handler}=moduleLoader({'@/server/admin/campaigns/service':fake})(path);
    for(const req of [{method:'GET',cookies:{},headers:{},query:{}},{method:'POST',cookies:{[cookieName()]:token},headers:{origin:'https://evil.example'},query:{}}]) {
      const res={setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;return this;}};await handler(req,res);assert.equal(res.code, !Object.keys(req.cookies).length ? 401 : path.endsWith("[id]") ? 405 : 403);
    }
  }
  assert.equal(calls,0);
});

test('localized migration preserves original BS data, gates activation, and retains incomplete drafts',async()=>{
  const {readFileSync}=await import('node:fs');const db=await campaignDatabase(false);
  try {
    const id=randomUUID();await db.query('select medresa_campaign_save($1,0,$2,null,$3,$4,false,null,null,$5)',[id,'Original retained','Original BS CTA','/upis','fixture']);
    await db.exec(readFileSync('supabase/migrations/202610100002_campaign_localization_delete.sql','utf8'));
    const row=(await db.query('select * from medresa_campaigns where id=$1',[id])).rows[0];
    assert.equal(row.name,'Original retained');assert.deepEqual(row.cta_localizations,{bs:{text:'Original BS CTA',link:'/upis'},sq:{text:'',link:''},en:{text:'',link:''}});
    Object.assign(process.env,fixtureEnvironment);globalThis.fetch=campaignRest(db);
    const incomplete={bs:{text:'Original BS CTA',link:'/upis'},sq:{text:'',link:''},en:{text:'',link:''}};
    const saved=await service.saveCampaign(draft({id,revision:1,content:incomplete}),'fixture');assert.equal(saved.revision,2);assert.equal(service.selectCampaign([saved]).campaign,null);
    const p=await service.uploadPoster(await image(),'image/png','fixture');
    await assert.rejects(service.saveCampaign(draft({id,revision:2,posterId:p.id,active:true,content:incomplete}),'fixture'),e=>e.status===422);
    await assert.rejects(db.query('update medresa_campaigns set active=true,poster_id=$2,activated_at=now() where id=$1',[id,p.id]),e=>e.code==='23514');
    for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(db.query('select medresa_campaign_delete($1,2)',[id]),e=>e.code==='42501');await db.exec('reset role');}
  }finally{await db.close();}
});
test('confirmed deletion preserves shared posters, rejects stale revisions, and removes only unreferenced original storage',async()=>{
  const db=await campaignDatabase();try {
    Object.assign(process.env,fixtureEnvironment);const objects=new Map();globalThis.fetch=campaignRest(db,objects);
    const p=await service.uploadPoster(await image(),'image/png','fixture');
    await db.exec('set role service_role');
    const a=await service.saveCampaign(draft({posterId:p.id}),'fixture'),b=await service.saveCampaign(draft({posterId:p.id}),'fixture');
    await assert.rejects(service.deleteCampaign({id:a.id,revision:2}),e=>e.status===409);
    assert.deepEqual(await service.deleteCampaign(a),{id:a.id,cleanup:true});assert.equal(objects.size,1);assert.equal((await service.readPoster(p.id)).mime,'image/png');
    assert.deepEqual(await service.deleteCampaign(b),{id:b.id,cleanup:true});assert.equal(objects.size,0);assert.equal((await db.query('select count(*)::int n from medresa_campaign_assets')).rows[0].n,0);
    await db.exec('reset role');
    const p2=await service.uploadPoster(await image(),'image/png','fixture'),c=await service.saveCampaign(draft({posterId:p2.id}),'fixture');
    const reservation=(await db.query('select medresa_campaign_delete($1,$2) result',[c.id,c.revision])).rows[0].result;assert.equal(reservation.asset_id,p2.id);
    await assert.rejects(service.saveCampaign(draft({posterId:p2.id}),'fixture'),'Cleanup reservation blocks new references before storage removal');
    assert.equal(objects.size,1,'Private object retained until storage succeeds');
    assert.equal((await db.query('select cleanup_pending from medresa_campaign_assets where id=$1',[p2.id])).rows[0].cleanup_pending,true);
  }finally{await db.close();}
});
test('cleanup outage never loses another campaign or falsely reports image removal',async()=>{
  const db=await campaignDatabase();try {
    Object.assign(process.env,fixtureEnvironment);const objects=new Map(),rest=campaignRest(db,objects);globalThis.fetch=rest;
    const p=await service.uploadPoster(await image(),'image/png','fixture'),c=await service.saveCampaign(draft({posterId:p.id}),'fixture');
    globalThis.fetch=(url,init)=>init?.method==='DELETE'?Promise.resolve(new Response('{}',{status:503})):rest(url,init);
    assert.deepEqual(await service.deleteCampaign(c),{id:c.id,cleanup:false});assert.equal((await service.listCampaigns()).campaigns.length,0);assert.equal(objects.size,1);
    assert.equal((await db.query('select cleanup_pending from medresa_campaign_assets where id=$1',[p.id])).rows[0].cleanup_pending,true);
  }finally{await db.close();}
});

test('runtime eligibility gives identical Admin/public rejection reasons and skips incomplete higher-priority campaigns',()=>{
  const {campaignRejection,scheduleEligible}=load('src/admin/campaigns/model'),now=Date.parse('2026-10-10T12:00:00Z');
  const c={...draft(),poster:{id:randomUUID(),width:600,height:900,src:'/private'},revision:1,active:true,activatedAt:'2026-10-10T10:00:00Z'};
  assert.equal(campaignRejection(c,now),null);assert.equal(eligible(c,now),true);
  const cases=[{active:false},{content:{...content(),sq:{text:'',link:''}}},{poster:null},{startsAt:'2026-10-10T12:00:01Z'},{endsAt:'2026-10-10T12:00:00Z'},{startsAt:'invalid'}];
  for(const [i,reason]of ['inactive','localization_incomplete','poster_missing','not_started','expired','invalid_schedule'].entries())assert.equal(campaignRejection({...c,...cases[i]},now),reason);
  assert.equal(scheduleEligible({...c,startsAt:'2026-10-10T08:00:00-04:00'},now),true,'UTC instant includes exact start despite offset');
  assert.equal(scheduleEligible({...c,endsAt:'2026-10-10T14:00:00+02:00'},now),false,'End is exclusive at identical UTC instant');
  const invalid={...c,id:randomUUID(),content:{...content(),en:{text:'',link:''}},activatedAt:'2026-10-10T11:00:00Z'};
  assert.equal(service.selectCampaign([invalid,c],now).campaign.id,c.id,'Invalid newest campaign cannot block another eligible campaign');
});
test('authenticated Preview runtime probe reads actual stored selection and poster, makes no writes and exposes no paths/secrets',async()=>{
  const db=await campaignDatabase();try {
    Object.assign(process.env,fixtureEnvironment);const objects=new Map(),rest=campaignRest(db,objects);globalThis.fetch=rest;
    const p=await service.uploadPoster(await image(),'image/png','fixture'),c=await service.saveCampaign(draft({posterId:p.id,active:true}),'fixture');
    let writes=0;globalThis.fetch=(url,init)=>{if(init?.method&&init.method!=='GET')writes++;return rest(url,init);};
    const result=await service.diagnoseCampaign(c.id);assert.equal(result.active,true);assert.equal(result.selectedForPublic,true);assert.equal(result.localizationComplete,true);assert.equal(result.posterAccessible,true);assert.equal(result.rejectionReason,null);assert.equal(writes,0);
    const serialized=JSON.stringify(result);for(const privateValue of [process.env.SUPABASE_SERVICE_ROLE_KEY,'object_path','posters/','medresa-campaigns-preview','updated_by'])assert.ok(!serialized.includes(privateValue));
    objects.clear();const failed=await service.diagnoseCampaign(c.id);assert.equal(failed.posterAccessible,false);assert.equal(failed.rejectionReason,'poster_unavailable');
    process.env.VERCEL_ENV='production';await assert.rejects(service.diagnoseCampaign(c.id));assert.equal(writes,0);
    const fake={diagnoseCampaign(){throw new Error('Must not be called without authentication');}};
    const {default:handler}=moduleLoader({'@/server/admin/campaigns/service':fake})('src/pages/api/admin/campaigns/diagnostic');
    const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};await handler({method:'GET',cookies:{},headers:{},query:{id:c.id}},res);assert.equal(res.code,401);
  }finally{await db.close();}
});
test('PostgREST timezone-offset schedule readback can be reactivated without touching dates and preserves UTC instants',async()=>{
  const db=await campaignDatabase();try {
    Object.assign(process.env,fixtureEnvironment);globalThis.fetch=campaignRest(db);
    const p=await service.uploadPoster(await image(),'image/png','fixture');
    const c=await service.saveCampaign(draft({posterId:p.id,startsAt:'2000-01-01T15:00:00.000Z',endsAt:'2099-01-01T15:00:00.000Z'}),'fixture');
    const raw=(await db.query('select to_jsonb(c) data from medresa_campaigns c where id=$1',[c.id])).rows[0].data;
    assert.ok(raw.starts_at.endsWith('+00:00'),'Fixture reproduces the actual PostgreSQL/PostgREST offset format');
    const readback=(await service.listCampaigns()).campaigns[0];assert.equal(readback.startsAt,'2000-01-01T15:00:00.000Z');assert.equal(readback.endsAt,'2099-01-01T15:00:00.000Z');
    const activated=await service.saveCampaign({...readback,posterId:readback.poster.id,active:true},'fixture');
    assert.equal(activated.active,true);assert.equal((await service.currentCampaign()).campaign.id,c.id);assert.equal(activated.startsAt,c.startsAt);assert.equal(activated.endsAt,c.endsAt);
  }finally{await db.close();}
});
