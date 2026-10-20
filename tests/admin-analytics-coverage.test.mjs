import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
import {database,reports,begin,finish,releaseCooldown,restFixture,fixtureEnvironment} from './fixtures/analytics.mjs';
const oldEnv={...process.env},oldFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in oldEnv))delete process.env[k];Object.assign(process.env,oldEnv);});
const load=moduleLoader(),{ranges,days}=load('src/admin/analytics/period');
const now=new Date('2026-10-20T12:00:00Z');
test('historical Instagram views use disjoint one-day UTC requests, bounded concurrency, real zeros and no invented missing days',async()=>{
 const {instagramDailyViews}=load('src/server/admin/analytics/instagramDailyViews');
 const range=ranges('90',now,'UTC').current,dates=days(range),requests=[],warnings=[];let active=0,max=0;
 const result=await instagramDailyViews(range,'2026-10-20',async params=>{
  assert.equal(params.metric,'views');assert.equal(params.period,'day');assert.equal(params.metric_type,'total_value');
  assert.equal(Number(params.until)-Number(params.since),86400);active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1));active--;
  const day=new Date(Number(params.since)*1000).toISOString().slice(0,10);requests.push(day);
  return day===dates[20]?{data:[]}:{data:[{name:'views',period:'day',total_value:{value:day===dates[0]?0:2}}]};
 },new AbortController().signal,[],[],reason=>warnings.push(reason));
 assert.equal(requests.length,90);assert.equal(new Set(requests).size,90);assert.equal(max,3);assert.equal(result.length,89);assert.equal(result[0].metrics.views,0);assert.ok(!result.some(d=>d.date===dates[20]));assert.ok(warnings.includes('no_data'));
 assert.equal(requests.sort()[0],range.start);assert.equal(requests.sort().at(-1),range.end);
 const {storedTotals}=load('src/admin/analytics/storedTotals');const selected=storedTotals('instagram',range,{},result);
 assert.equal(selected.totals.views,176);assert.equal(selected.coverage.views.days,89);assert.equal(selected.coverage.views.partial,true);
});
test('backfill skips confirmed old measurements, retries recent days, does not copy stale cached values as fresh API data',async()=>{
 const {instagramDailyViews}=load('src/server/admin/analytics/instagramDailyViews'),range=ranges('7',now,'UTC').current,dates=days(range);
 const saved=dates.map(date=>({date,metrics:{views:5},complete:true})),requests=[];
 const fresh=[{date:range.end,metrics:{views:7},complete:true}];
 const received=await instagramDailyViews(range,'2026-10-20',async params=>{requests.push(new Date(Number(params.since)*1000).toISOString().slice(0,10));return {data:[{name:'views',period:'day',total_value:{value:6}}]};},new AbortController().signal,saved,fresh);
 assert.deepEqual(requests,['2026-10-18']);assert.deepEqual(received,[{date:'2026-10-18',metrics:{views:6},complete:true}]);
});
test('malformed metrics, empty results and denied access never produce fabricated measured days',async()=>{
 const {instagramDailyViews}=load('src/server/admin/analytics/instagramDailyViews'),{ProviderFailure}=load('src/server/admin/analytics/common'),range={start:'2026-10-18',end:'2026-10-18'};
 for(const response of [{data:[]},{data:[{name:'reach',period:'day',total_value:{value:9}}]},{data:[{name:'views',period:'week',total_value:{value:9}}]},{data:[{name:'views',period:'day',total_value:{value:null}}]}])assert.deepEqual(await instagramDailyViews(range,'2026-10-20',async()=>response,new AbortController().signal),[]);
 let warnings=[];assert.deepEqual(await instagramDailyViews(range,'2026-10-20',async()=>{throw new ProviderFailure('permission_required','expired_credential');},new AbortController().signal,[],[],(...args)=>warnings.push(args)),[]);assert.deepEqual(warnings,[['expired_credential',true]]);
});
test('a saved aggregate never fabricates daily coverage; real Facebook90/YouTube87 and Instagram7 remain distinct',()=>{
 const {storedTotals}=load('src/admin/analytics/storedTotals'),{periodViews}=load('src/admin/analytics/views'),range=ranges('90',now,'UTC').current,dates=days(range);
 const daily=(count,value)=>dates.slice(-count).map(date=>({date,metrics:{views:value},complete:true}));
 const ig=storedTotals('instagram',range,{},daily(7,10)),fb=storedTotals('facebook',range,{views:900},daily(90,10)),yt=storedTotals('youtube',range,{},daily(87,1));
 const result=periodViews([{provider:'instagram',totals:ig.totals,totalCoverage:ig.coverage},{provider:'facebook',totals:fb.totals,totalCoverage:fb.coverage},{provider:'youtube',totals:yt.totals,totalCoverage:yt.coverage}]);
 assert.equal(result.total,1057);assert.equal(result.incomplete,true);assert.equal(result.coverage,3);assert.equal(ig.coverage.views.days,7);assert.equal(fb.coverage.views.days,90);assert.equal(yt.coverage.views.days,87);
 const aggregate=storedTotals('instagram',range,{views:900},daily(7,10));assert.equal(aggregate.totals.views,900);assert.equal(aggregate.coverage.views.days,7);assert.equal(aggregate.coverage.views.partial,true);assert.equal(aggregate.coverage.views.basis,'period');
 assert.equal(storedTotals('youtube',range,{},[]).totals.views,undefined);
});
test('daily row backfill is idempotent in PostgreSQL, feeds all period selectors, and later refreshes cannot freeze Today/Yesterday in an older report',async()=>{
 Object.assign(process.env,fixtureEnvironment);const db=await database();try{
  const initial=reports('90',now);for(const r of initial){r.totals={};r.previousTotals={};r.daily=[];r.today=null;r.yesterday=null;}
  const dates=days(ranges('90',now,'UTC').current);initial[1].daily=dates.slice(-7).map(date=>({date,metrics:{views:10},complete:true}));
  initial[1].today={date:'2026-10-20',metrics:{views:1},complete:false};initial[1].yesterday={date:'2026-10-19',metrics:{views:10},complete:true};
  initial[1].daily.push(initial[1].today);const id=randomUUID();await begin(db,id,'90');await finish(db,id,initial);
  globalThis.fetch=restFixture(db);
  const service=moduleLoader({'./providers':{configurations:Object.fromEntries(['website','instagram','facebook','youtube'].map(p=>[p,()=>true])),timezones:{website:'UTC',instagram:'UTC',facebook:'America/Los_Angeles',youtube:'America/Los_Angeles'}}})('src/server/admin/analytics/service');
  assert.equal((await service.dashboard('90',now)).reports[1].totalCoverage.views.days,7);
  const backfill=reports('90',now)[1];backfill.totals={};backfill.previousTotals={};backfill.today={date:'2026-10-20',metrics:{views:1},complete:false};backfill.yesterday={date:'2026-10-19',metrics:{views:10},complete:true};backfill.daily=dates.map(date=>({date,metrics:{views:10},complete:true}));backfill.daily.push(backfill.today);
  for(let repeat=0;repeat<2;repeat++){await releaseCooldown(db);const run=randomUUID();await begin(db,run,'90','instagram');await finish(db,run,[backfill]);}
  const newer=reports('30',now)[1];newer.totals={};newer.previousTotals={};newer.today={date:'2026-10-20',metrics:{views:2},complete:false};newer.daily=[newer.today];
  await releaseCooldown(db);const freshRun=randomUUID();await begin(db,freshRun,'30','instagram');await finish(db,freshRun,[newer]);
  assert.equal((await db.query("select count(*)::int n from medresa_analytics_daily where provider='instagram'")).rows[0].n,91);
  const before=JSON.stringify((await db.query('select * from medresa_analytics_daily order by provider,day')).rows);
  for(const period of ['7','30','60','90']){const r=(await service.dashboard(period,now)).reports[1];assert.equal(r.totals.views,Number(period)*10);assert.equal(r.totalCoverage.views.days,Number(period));assert.equal(r.today.metrics.views,2);assert.equal(r.yesterday.metrics.views,10);}
  assert.equal((await service.dashboard('today',now)).reports[1].totals.views,2);assert.equal((await service.dashboard('yesterday',now)).reports[1].totals.views,10);
  assert.equal(JSON.stringify((await db.query('select * from medresa_analytics_daily order by provider,day')).rows),before);
 }finally{await db.close();}
});

test('real Instagram provider/service path persists measured historical days once and reuses them across all periods',async()=>{
 Object.assign(process.env,fixtureEnvironment,{INSTAGRAM_ACCESS_TOKEN:'synthetic-coverage-test-only'});
 const db=await database();try{
  const adapter=restFixture(db),requests=[];
  globalThis.fetch=async(input,init={})=>{
   const u=new URL(String(input));if(u.hostname.endsWith('supabase.co'))return adapter(input,init);
   assert.equal(u.hostname,'graph.facebook.com');
   const json=body=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
   if(u.pathname.endsWith('/me/accounts'))return json({data:[{id:'578640758657974'}]});
   if(u.pathname.endsWith('/578640758657974'))return json({id:'578640758657974',instagram_business_account:{id:'1001'}});
   if(u.pathname.endsWith('/me/permissions'))return json({data:[]});
   if(u.searchParams.get('fields')==='id,username,account_type')return json({id:'1001',username:'medresacg',account_type:'BUSINESS'});
   if(u.searchParams.get('fields')==='followers_count')return json({followers_count:20});
   if(u.pathname.endsWith('/media'))return json({data:[]});
   assert.ok(u.pathname.endsWith('/insights'));
   const metric=u.searchParams.get('metric'),start=new Date(Number(u.searchParams.get('since'))*1000).toISOString().slice(0,10),end=new Date(Number(u.searchParams.get('until'))*1000-1).toISOString().slice(0,10),count=days({start,end}).length;
   if(metric==='views')requests.push({start,end,count});
   if(u.searchParams.get('metric_type')==='time_series')return json({data:[{name:metric,period:'day',values:days({start,end}).map(day=>({end_time:new Date(Date.parse(day)+86400000).toISOString(),value:4}))}]});
   return json({data:[{name:metric,period:'day',total_value:metric==='follows_and_unfollows'?{breakdowns:[{results:[{dimension_values:['FOLLOW'],value:1},{dimension_values:['UNFOLLOW'],value:0}]}]}:{value:metric==='views'?count*3:count}}]});
  };
  const {synchronize,dashboard}=moduleLoader()('src/server/admin/analytics/service');
  const first=await synchronize('90',randomUUID(),'instagram');assert.equal(first.dashboard.storage,'ready');assert.equal(first.dashboard.reports[1].totalCoverage.views.days,90);
  const distinct=(await db.query("select count(*)::int n from medresa_analytics_daily where provider='instagram' and jsonb_typeof(metrics->'views')='number'")).rows[0].n;assert.equal(distinct,91);
  assert.equal(requests.filter(r=>r.count===1).length,91);
  const after=requests.length;await releaseCooldown(db);await synchronize('90',randomUUID(),'instagram');
  assert.equal(requests.slice(after).filter(r=>r.count===1).length,3,'Only Today/Yesterday and recent processing window are re-read');
  assert.equal((await db.query("select count(*)::int n from medresa_analytics_daily where provider='instagram' and jsonb_typeof(metrics->'views')='number'")).rows[0].n,distinct);
  for(const period of ['7','30','60','90']){const r=(await dashboard(period)).reports[1];assert.equal(r.totals.views,Number(period)*3);assert.equal(r.totalCoverage.views.days,Number(period));assert.equal(r.totalCoverage.views.partial,false);}
 }finally{await db.close();}
});
