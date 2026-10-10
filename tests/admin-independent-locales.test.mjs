import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
import {resultsRest} from './fixtures/results.mjs';
import {campaignDatabase,campaignRest,fixtureEnvironment} from './fixtures/campaigns.mjs';
const load=moduleLoader(),service=load('src/server/admin/campaigns/service');
const env={...process.env},fetch=globalThis.fetch;
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);globalThis.fetch=fetch;});
test('campaign channels activate independently and incomplete locales cannot suppress another valid campaign',async()=>{
 const db=await campaignDatabase();try{
  Object.assign(process.env,fixtureEnvironment);globalThis.fetch=campaignRest(db);await db.exec('set role service_role');
  const poster=await service.uploadPoster(await sharp({create:{width:100,height:150,channels:3,background:'#123c31'}}).png().toBuffer(),'image/png','fixture');
  let c=await service.saveCampaign({id:randomUUID(),revision:0,name:'Explicit local channel fixture',posterId:poster.id,content:{bs:{text:'BS fixture',link:'/upis'},sq:{text:'',link:''},en:{text:'',link:''}},localeActive:{bs:true,sq:false,en:false},active:true,startsAt:null,endsAt:null},'fixture');
  const bs=structuredClone(c.content.bs);
  assert.equal((await service.currentCampaign(Date.now(),'bs')).campaign.id,c.id);
  for(const l of ['sq','en'])assert.equal((await service.currentCampaign(Date.now(),l)).campaign,null);
  for(const l of ['sq','en']){
   c=await service.saveCampaign({...c,posterId:poster.id,content:{...c.content,[l]:{text:l+' fixture',link:l==='sq'?'/sq/regjistrimi':'/en/admissions'}},localeActive:{...c.localeActive,[l]:true}},'fixture');
   assert.deepEqual(c.content.bs,bs);const p=(await service.currentCampaign(Date.now(),l)).campaign;assert.equal(p.ctaText,l+' fixture');assert.equal('content' in p,false,'No inactive/draft localization in public response');
  }
  const en=structuredClone(c.content.en);
  c=await service.saveCampaign({...c,posterId:poster.id,content:{...c.content,sq:{text:'SQ draft',link:'invalid unfinished route'}},localeActive:{...c.localeActive,sq:false}},'fixture');
  assert.deepEqual(c.content.bs,bs);assert.deepEqual(c.content.en,en);assert.equal((await service.currentCampaign(Date.now(),'sq')).campaign,null);assert.equal((await service.currentCampaign(Date.now(),'en')).campaign.ctaText,en.text);
  await assert.rejects(service.saveCampaign({...c,posterId:poster.id,localeActive:{...c.localeActive,sq:true}},'fixture'),e=>e.status===422);
  c=await service.saveCampaign({...c,posterId:poster.id,localeActive:{bs:false,sq:false,en:true}},'fixture');assert.equal((await service.currentCampaign(Date.now(),'bs')).campaign,null);assert.equal((await service.currentCampaign(Date.now(),'en')).campaign.id,c.id);
  await db.exec('reset role');
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);await assert.rejects(db.query('select medresa_campaign_save_channels($1,0,$2,null,$3,$4,null,null,$5)',[randomUUID(),'x',JSON.stringify(c.content),JSON.stringify(c.localeActive),'fixture']),e=>e.code==='42501');await db.exec('reset role');}
 }finally{await db.close();}
});
test('migration preserves existing complete result releases and active campaigns without replacing files/content/versions',async()=>{
 const db=await campaignDatabase(false);try{
  await db.exec(readFileSync('supabase/migrations/202610100002_campaign_localization_delete.sql','utf8'));await db.exec(readFileSync('supabase/migrations/202610100003_admission_results.sql','utf8'));
  const a=randomUUID();await db.query("insert into medresa_campaign_assets(id,object_path,mime,bytes,width,height,created_by) values($1,$2,'image/png',10,100,150,'fixture')",[a,'posters/'+a+'.png']);
  const id=randomUUID(),content={bs:{text:'BS fixture',link:'/upis'},sq:{text:'SQ fixture',link:'/sq/regjistrimi'},en:{text:'EN fixture',link:'/en/admissions'}};
  await db.query('select medresa_campaign_save_localized($1,0,$2,$3,$4,true,null,null,$5)',[id,'Legacy fixture',a,JSON.stringify(content),'fixture']);
  const before=(await db.query('select * from medresa_campaigns where id=$1',[id])).rows[0];
  const ids={};for(const l of ['bs','sq','en']){ids[l]=randomUUID();await db.query("insert into medresa_results_assets(id,locale,filename,object_path,bytes,pages,sha256,created_by) values($1,$2,'fixture.pdf',$3,100,1,$4,'fixture')",[ids[l],l,'documents/'+ids[l]+'.pdf','a'.repeat(64)]);}
  await db.query('update medresa_results_state set bs_id=$1,sq_id=$2,en_id=$3',[ids.bs,ids.sq,ids.en]);const pub=randomUUID();await db.query("select medresa_results_publish($1,0,'fixture')",[pub]);
  Object.assign(process.env,fixtureEnvironment);const campaignFetch=campaignRest(db),resultFetch=resultsRest(db);
  globalThis.fetch=(url,init)=>String(url).includes('medresa_results_')?resultFetch(url,init):new URL(String(url)).searchParams.get('select')?.includes('locale_active')?Promise.resolve(new Response('{}',{status:400})):campaignFetch(url,init);
  assert.equal((await service.currentCampaign()).campaign.id,id,'Legacy campaign stays public before migration');assert.equal((await service.listCampaigns()).writable,false);
  const resultService=load('src/server/admin/results/service');for(const l of ['bs','sq','en'])assert.equal(await resultService.publishedHref(l),'/api/results/'+l,'Legacy result links stay public');assert.equal((await resultService.listResults()).writable,false);
  await db.exec(readFileSync('supabase/migrations/202610100004_independent_locale_channels.sql','utf8'));
  const after=(await db.query('select * from medresa_campaigns where id=$1',[id])).rows[0];assert.equal(after.revision,before.revision);assert.equal(after.active,true);assert.deepEqual(after.cta_localizations,content);assert.deepEqual(after.locale_active,{bs:true,sq:true,en:true});
  const heads=(await db.query('select h.locale,p.asset_id,p.version from medresa_results_locale_heads h join medresa_results_locale_publications p on p.id=h.publication_id')).rows;
  assert.equal(heads.length,3);for(const h of heads){assert.equal(h.asset_id,ids[h.locale]);assert.equal(h.version,1);}
  assert.equal((await db.query('select count(*)::int n from medresa_results_publications')).rows[0].n,1);
  for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);for(const table of ['medresa_results_locale_heads','medresa_results_locale_publications'])await assert.rejects(db.query(`select * from ${table}`),e=>e.code==='42501');await assert.rejects(db.query("select medresa_results_publish_locale($1,1,'bs','fixture')",[randomUUID()]),e=>e.code==='42501');await db.exec('reset role');}
 }finally{await db.close();}
});
