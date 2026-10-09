import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, scryptSync } from 'node:crypto';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
import { database, load, now, reports, begin, finish, releaseCooldown, fixtureEnvironment, restFixture } from './fixtures/analytics.mjs';
const initialEnv = { ...process.env }, initialFetch = globalThis.fetch;
afterEach(() => { for (const key of Object.keys(process.env)) if (!(key in initialEnv)) delete process.env[key]; Object.assign(process.env,initialEnv); globalThis.fetch=initialFetch; });
const { ranges, days, comparison, startInstant, parsePeriod, validDay } = load('src/admin/analytics/period');
const { blank, number, safeText, safeUrl, providerJson, previewConfiguration } = load('src/server/admin/analytics/common');
const { collectProvider } = load('src/server/admin/analytics/providers');
const json=(b,status=200)=>new Response(JSON.stringify(b),{status,headers:{'Content-Type':'application/json'}});
function credentials() {
  Object.assign(process.env,fixtureEnvironment);
  for(const k of ['VERCEL_ANALYTICS_TOKEN','INSTAGRAM_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN','YOUTUBE_OAUTH_CLIENT_ID','YOUTUBE_OAUTH_CLIENT_SECRET','YOUTUBE_REFRESH_TOKEN']) delete process.env[k];
}

test('all periods, previous equivalent ranges, year boundaries and DST calendar days', () => {
  assert.equal(parsePeriod(undefined),'30'); for(const x of ['',[], '8', 'all']) assert.throws(()=>parsePeriod(x));
  for(const p of ['today','yesterday','7','30','60','90']) {
    const r=ranges(p,new Date('2026-01-01T18:00:00Z'),'UTC'); const n=['today','yesterday'].includes(p)?1:Number(p);
    assert.equal(days(r.current).length,n); assert.equal(days(r.previous).length,n); assert.ok(r.previous.end<r.current.start);
    assert.equal(r.current.end,p==='today'?'2026-01-01':'2025-12-31');
  }
  assert.equal(validDay('2026-02-31'),false);
  assert.equal((Date.parse(startInstant('2026-03-09','America/Los_Angeles'))-Date.parse(startInstant('2026-03-08','America/Los_Angeles')))/3600000,23);
  assert.equal((Date.parse(startInstant('2026-11-02','America/Los_Angeles'))-Date.parse(startInstant('2026-11-01','America/Los_Angeles')))/3600000,25);
});
test('comparisons: missing/partial/zero/negative/NaN never invent percentages', () => {
  assert.deepEqual(comparison(10,0),{direction:'↑',delta:10,percent:null});
  assert.deepEqual(comparison(0,0),{direction:'—',delta:0,percent:null});
  assert.equal(comparison(5,10).percent,-50); assert.equal(comparison(-2,-1).percent,null);
  for(const v of [null,undefined,NaN,Infinity]) assert.equal(comparison(v,2).delta,null);
  assert.equal(comparison(2,1,false).delta,null); assert.equal(number(''),null); assert.equal(number(0),0);
});
test('Website test summary shows only sanitized status/dates/metrics and never treats old data as a new success', () => {
  const { websiteTestResult }=load('src/admin/analytics/websiteTest');
  const runId=randomUUID(),web=reports()[0];web.totals={pageviews:0,visitors:4};
  const body={acquired:true,runId,dashboard:{storage:'ready',reports:[web],history:[{id:runId,outcome:'success'}]}};
  const success=websiteTestResult(body,200);assert.equal(success.stored,true);assert.equal(success.pageviews,0);assert.equal(success.visitors,4);assert.equal(success.state,'connected');assert.deepEqual(success.range,web.range);
  for(const outcome of ['cooldown','running']) {
    const skipped=websiteTestResult({...body,acquired:false,outcome},200);assert.equal(skipped.stored,false);assert.equal(skipped.pageviews,null);assert.equal(skipped.state,null);assert.match(skipped.message,/nije pokrenut/);
  }
  const failure=websiteTestResult({...body,dashboard:{...body.dashboard,reports:[{...web,state:'permission_required',reason:'expired_credential'}],history:[{id:runId,outcome:'failed'}]}},200);
  assert.equal(failure.reason,'expired_credential');assert.equal(failure.stored,false);assert.equal(failure.pageviews,null);
  const secret='never-show-credential-fixture';
  const unsafe=websiteTestResult({error:secret,acquired:true,runId,dashboard:{storage:secret,reports:[{provider:'website',state:secret,reason:secret,range:{start:secret,end:secret},totals:{pageviews:secret,visitors:Infinity},warnings:[secret],fetchedAt:secret}],history:[{id:runId,outcome:secret}]}},200);
  assert.ok(!JSON.stringify(unsafe).includes(secret));assert.equal(unsafe.range,null);assert.equal(unsafe.pageviews,null);assert.deepEqual(unsafe.warnings,[]);
  for(const status of [0,401,403,503]) {
    const rejected=websiteTestResult({error:secret,...body},status);assert.equal(rejected.stored,false);assert.equal(rejected.state,null);assert.ok(!JSON.stringify(rejected).includes(secret));
  }
  const empty=websiteTestResult({...body,dashboard:{...body.dashboard,reports:[{...web,warnings:['no_data']}]}},200);
  assert.equal(empty.stored,true);assert.equal(empty.pageviews,null);assert.ok(empty.warnings.includes('no_data'));
});
test('exact Preview guard rejects wrong project/branch/Production before any remote request', async () => {
  credentials(); previewConfiguration(true); let calls=0; globalThis.fetch=()=>{calls++;throw new Error();};
  const service=load('src/server/admin/analytics/service');
  for(const patch of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},{SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co',MEDRESA_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst'}]) {
    Object.assign(process.env,fixtureEnvironment,patch); assert.throws(()=>previewConfiguration());
    await assert.rejects(service.synchronize('7',randomUUID())); assert.equal((await service.dashboard('7')).storage,'preview_required');
  }
  assert.equal(calls,0);
});
test('unconfigured providers are isolated and make no network calls', async () => {
  credentials(); globalThis.fetch=()=>{throw new Error('Network forbidden');};
  const r=await Promise.all(['website','instagram','facebook','youtube'].map(p=>collectProvider(p,'30',now,new AbortController().signal)));
  assert.ok(r.every(x=>x.state==='not_configured' && Object.keys(x.totals).length===0 && x.fetchedAt===null));
});
test('Vercel uses official Preview aggregates, direct unique totals, no Production count or fake visits', async () => {
  credentials(); process.env.VERCEL_ANALYTICS_TOKEN='fixture-vercel-private'; const requests=[];
  globalThis.fetch=async(input,init)=>{
    const u=new URL(input); requests.push(u); assert.equal(new Headers(init.headers).get('Authorization'),'Bearer fixture-vercel-private');
    if(u.pathname.startsWith('/v9/projects/')) return json({id:'prj_verified_fixture',name:'medresa-me'});
    assert.equal(u.pathname,'/v1/query/web-analytics/visits/aggregate'); assert.equal(u.searchParams.get('filter'),"environment eq 'preview' and not startswith(requestPath, '/admin')");
    // Reproduce the identified live rejection, never an assumed maximum range.
    if(u.searchParams.get('limit')==='200') return json({error:{code:'bad_request',message:"Invalid query parameter 'limit'"}},400);
    assert.equal(u.searchParams.get('limit'),'10','Use the documented Vercel default without changing traffic scope');
    const by=u.searchParams.get('by');
    if(by==='environment') return json({data:[{environment:'preview',pageviews:12,visitors:3}]});
    if(by==='day') return json({data:[{timestamp:'2026-10-07T00:00:00Z',pageviews:12,visitors:3},{timestamp:'2026-10-06T00:00:00Z',pageviews:10,visitors:3}]});
    return json({data:[{[by]:by==='requestPath'?'/bs/vijesti?private=discard':'mobile',pageviews:12}]});
  };
  const r=await collectProvider('website','7',now,new AbortController().signal);
  assert.equal(r.state,'connected'); assert.equal(r.totals.visitors,3); assert.equal(r.totals.visits,undefined);
  assert.equal(r.topContent[0].label,'/bs/vijesti'); assert.equal(r.trackingStart,null); assert.deepEqual(r.cumulative,{});
  assert.ok(requests.length>=10); assert.ok(!JSON.stringify(r).includes(process.env.VERCEL_ANALYTICS_TOKEN));
  const selected=requests.find(u=>u.searchParams.get('by')==='environment');const selectedRange=ranges('7',now,'UTC').current;
  assert.equal(selected.searchParams.get('since'),selectedRange.start+'T00:00:00Z');assert.equal(selected.searchParams.get('until'),selectedRange.end+'T23:59:59.999Z');
  globalThis.fetch=async(input)=>new URL(input).pathname.startsWith('/v9/')?json({id:'prj_verified_fixture',name:'medresa-me'}):json({data:[]});
  const empty=await collectProvider('website','7',now,new AbortController().signal); assert.deepEqual(empty.totals,{}); assert.ok(empty.warnings.includes('no_data'));
});
test('Website optional HTTP 400 queries keep direct current totals and report the exact rejected requests without raw errors', async () => {
  credentials();process.env.VERCEL_ANALYTICS_TOKEN='private-vercel-diagnostic-fixture';
  const range=ranges('30',now,'UTC').current,observations=[];
  globalThis.fetch=async(input)=>{
    const u=new URL(input);assert.equal(u.hostname,'api.vercel.com');
    if(u.pathname.startsWith('/v9/projects/')) return json({name:'medresa-me',id:'prj_fixture'});
    assert.equal(u.searchParams.get('filter'),"environment eq 'preview' and not startswith(requestPath, '/admin')");
    const by=u.searchParams.get('by');
    if(by==='day'||by==='referrerHostname'||u.searchParams.get('until').slice(0,10)<range.start) return json({error:{code:'bad_request',message:'private-vercel-diagnostic-fixture raw response'}},400);
    if(by==='environment') return json({data:[{environment:'preview',pageviews:0,visitors:7}]});
    return json({data:[]});
  };
  const r=await collectProvider('website','30',now,new AbortController().signal,row=>observations.push(row));
  assert.equal(r.state,'connected');assert.deepEqual(r.totals,{pageviews:0,visitors:7});
  assert.deepEqual(r.previousTotals,{});assert.deepEqual(r.daily,[]);assert.deepEqual(r.breakdowns.referrers,[]);
  assert.equal(r.totals.visits,undefined);assert.ok(r.warnings.includes('invalid_response'));assert.ok(!r.warnings.includes('unsupported_metric'));
  assert.deepEqual(observations.filter(r=>r.httpStatus===400).map(r=>r.request).sort(),['daily','previous','referrers']);
  assert.deepEqual(observations.find(r=>r.request==='current'),{request:'current',range,httpStatus:200,reason:null});
  assert.ok(!JSON.stringify([r,observations]).includes('private-vercel-diagnostic-fixture'));
  assert.ok(!JSON.stringify(observations).includes('raw response'));
});
test('Website required totals rejection is attributed to that request, makes no optional calls and fabricates no metrics', async () => {
  credentials();process.env.VERCEL_ANALYTICS_TOKEN='private-vercel-diagnostic-fixture';const observations=[],requests=[];
  globalThis.fetch=async(input)=>{
    const u=new URL(input);requests.push(u);
    return u.pathname.startsWith('/v9/projects/')?json({name:'medresa-me',id:'prj_fixture'}):json({error:{message:'private-vercel-diagnostic-fixture raw response'}},400);
  };
  const r=await collectProvider('website','30',now,new AbortController().signal,row=>observations.push(row));
  assert.equal(r.state,'error');assert.equal(r.reason,'invalid_response');assert.deepEqual(r.totals,{});
  assert.equal(r.fetchedAt,null);assert.equal(requests.length,2);
  assert.deepEqual(observations.map(r=>[r.request,r.httpStatus]),[['project',200],['current',400]]);
  assert.ok(!JSON.stringify([r,observations]).includes('private-vercel-diagnostic-fixture'));
  const {websiteTestResult}=load('src/admin/analytics/websiteTest');
  const testResult=websiteTestResult({acquired:true,websiteRequests:[...observations,{request:'private-vercel-diagnostic-fixture',httpStatus:400},{request:'daily',httpStatus:'private-vercel-diagnostic-fixture',reason:'private-vercel-diagnostic-fixture',range:{start:'private-vercel-diagnostic-fixture',end:'2026-10-08'}}]},200);
  assert.equal(testResult.requests.length,3);assert.equal(testResult.requests[2].httpStatus,null);assert.equal(testResult.requests[2].range,null);
  assert.ok(!JSON.stringify(testResult).includes('private-vercel-diagnostic-fixture'));
});
test('Vercel query validation preserves only named parameters/known codes and reporting-window evidence, never raw response values', async () => {
  const {vercelRejection}=load('src/server/admin/analytics/website');
  const secret='private-vercel-validation-fixture';
  assert.deepEqual(vercelRejection({error:{code:'bad_request',message:`Invalid query parameter 'filter': ${secret}`,errors:[{path:['query','filter'],value:secret}]}}),{code:'bad_request',parameters:['filter'],reportingWindowMentioned:false,detailsPresent:true});
  assert.deepEqual(vercelRejection({error:{code:'bad_request',message:`The 'since' timestamp is outside the reporting window. ${secret}`}}),{code:'bad_request',parameters:['since'],reportingWindowMentioned:true,detailsPresent:true});
  const unknown=vercelRejection({error:{code:secret,message:secret,field:secret}});assert.equal(unknown.code,null);assert.deepEqual(unknown.parameters,[]);assert.ok(!JSON.stringify(unknown).includes(secret));
  credentials();process.env.VERCEL_ANALYTICS_TOKEN=secret;
  const requests=[];
  globalThis.fetch=async(input)=>new URL(input).pathname.startsWith('/v9/projects/')?json({name:'medresa-me',id:'prj_fixture'}):json({error:{code:'bad_request',message:`Invalid query parameter 'filter': ${secret}`}},400);
  await collectProvider('website','30',now,new AbortController().signal,row=>requests.push(row));
  assert.equal(requests.length,2);assert.equal(requests[1].rejection.code,'bad_request');assert.deepEqual(requests[1].rejection.parameters,['filter']);assert.ok(!JSON.stringify(requests).includes(secret));
  const {websiteTestResult}=load('src/admin/analytics/websiteTest');
  const summary=websiteTestResult({acquired:true,websiteRequests:[...requests,{request:'daily',httpStatus:400,rejection:{code:secret,parameters:['since',secret],reportingWindowMentioned:secret,detailsPresent:secret,message:secret}}]},200);
  assert.deepEqual(summary.requests[2].rejection,{code:null,parameters:['since'],reportingWindowMentioned:false,detailsPresent:false});assert.ok(!JSON.stringify(summary).includes(secret));
});
test('Website exposes only returned totals; missing visitors and malformed optional rows never become fabricated zeroes', async () => {
  credentials();process.env.VERCEL_ANALYTICS_TOKEN='private-vercel-fixture';
  globalThis.fetch=async(input)=>{
    const u=new URL(input);
    if(u.pathname.startsWith('/v9/projects/')) return json({name:'medresa-me',id:'prj_fixture'});
    return u.searchParams.get('by')==='environment'?json({data:[{environment:'preview',pageviews:12}]}):json({data:[null]});
  };
  const r=await collectProvider('website','7',now,new AbortController().signal);
  assert.equal(r.state,'connected');assert.deepEqual(r.totals,{pageviews:12,visitors:null});
  assert.equal(r.totals.visits,undefined);assert.deepEqual(r.daily,[]);assert.deepEqual(r.breakdowns.pages,[]);
  assert.ok(r.warnings.includes('invalid_response'));assert.equal(r.cumulative.visits,undefined);
});
test('Meta reuses feed tokens, discovers account/page and detects individual missing capabilities', async () => {
  credentials(); process.env.INSTAGRAM_ACCESS_TOKEN='fixture-instagram-private'; process.env.FACEBOOK_PAGE_ACCESS_TOKEN='fixture-facebook-private';
  globalThis.fetch=async(input,init)=>{
    const u=new URL(input); assert.ok(!u.searchParams.has('access_token'));
    if(u.hostname==='graph.instagram.com') {
      assert.equal(new Headers(init.headers).get('Authorization'),'Bearer fixture-instagram-private');
      if(u.pathname.endsWith('/me')) return json({id:'1001',user_id:'1001'});
      if(u.searchParams.get('fields')==='followers_count') return json({followers_count:11});
      if(u.pathname.endsWith('/media')) return json({data:[]});
      const m=u.searchParams.get('metric');
      if(m==='reach') return json({error:{code:100,message:'fixture-instagram-private raw error'}},400);
      if(m==='follows_and_unfollows') return json({data:[{name:m,total_value:{breakdowns:[{results:[{dimension_values:['FOLLOW'],value:3},{dimension_values:['UNFOLLOW'],value:1}]}]}}]});
      return json({data:[{name:m,total_value:{value:0}}]});
    }
    assert.equal(u.hostname,'graph.facebook.com'); assert.ok(u.pathname.includes('578640758657974'));
    if(u.searchParams.get('fields')==='id,access_token') return json({id:'578640758657974',access_token:'derived-page-private'});
    assert.equal(new Headers(init.headers).get('Authorization'),'Bearer derived-page-private');
    if(u.searchParams.get('fields')==='followers_count') return json({followers_count:20});
    if(u.pathname.endsWith('/published_posts')) return json({data:[]});
    return json({error:{code:200,message:'derived-page-private raw error'}},403);
  };
  const [ig,fb]=await Promise.all(['instagram','facebook'].map(p=>collectProvider(p,'7',now,new AbortController().signal)));
  assert.equal(ig.state,'connected'); assert.equal(ig.totals.views,0); assert.equal(ig.totals.reach,null); assert.equal(ig.totals.followerChange,2);
  assert.equal(fb.state,'permission_required'); assert.equal(fb.current.followers,20); assert.equal(fb.totals.views,null); assert.ok(fb.requiredPermissions.includes('read_insights'));
  for(const secret of ['fixture-instagram-private','fixture-facebook-private','derived-page-private','raw error']) assert.ok(!JSON.stringify([ig,fb]).includes(secret));
});
test('YouTube uses owner OAuth/channel discovery, handles delayed days and preserves hidden subscriber counts', async () => {
  credentials(); Object.assign(process.env,{YOUTUBE_OAUTH_CLIENT_ID:'client-fixture',YOUTUBE_OAUTH_CLIENT_SECRET:'private-youtube-fixture',YOUTUBE_REFRESH_TOKEN:'private-refresh-fixture'});
  globalThis.fetch=async(input,init)=>{
    const u=new URL(input);
    if(u.hostname==='oauth2.googleapis.com') {assert.equal(init.method,'POST');return json({access_token:'private-derived-youtube'});}
    assert.equal(new Headers(init.headers).get('Authorization'),'Bearer private-derived-youtube');
    if(u.pathname.endsWith('/channels')) {assert.equal(u.searchParams.get('mine'),'true');assert.equal(u.searchParams.has('id'),false);return json({items:[{id:'UCfixture',statistics:{subscriberCount:'20',hiddenSubscriberCount:true}}]});}
    if(u.searchParams.get('dimensions')==='video') return json({columnHeaders:[{name:'video'},{name:'views'}],rows:[]});
    return json({columnHeaders:[{name:'day'},{name:'views'},{name:'estimatedMinutesWatched'},{name:'subscribersGained'},{name:'subscribersLost'}],rows:[['2026-10-06',0,0,0,0]]});
  };
  const r=await collectProvider('youtube','7',now,new AbortController().signal);
  assert.equal(r.state,'connected'); assert.equal(r.current.subscribers,null); assert.equal(r.today,null); assert.equal(r.yesterday,null); assert.equal(r.totals.views,undefined); assert.equal(r.daily[0].metrics.views,0); assert.ok(r.warnings.includes('provider_delay'));
  globalThis.fetch=async()=>json({error:'invalid_grant',error_description:'private-refresh-fixture'},400);
  const rejected=await collectProvider('youtube','7',now,new AbortController().signal); assert.equal(rejected.state,'permission_required');assert.equal(rejected.reason,'expired_credential');
});
test('bounded retries, provider failure isolation and explicit sanitized projection', async () => {
  credentials(); process.env.INSTAGRAM_ACCESS_TOKEN='private-fixture'; let calls=0;
  globalThis.fetch=async()=>{calls++; return json({error:{message:'private-fixture'}},500);};
  const failed=await collectProvider('instagram','7',now,new AbortController().signal); assert.equal(calls,2); assert.equal(failed.state,'temporarily_unavailable'); assert.equal(failed.fetchedAt,null);
  assert.equal((await collectProvider('facebook','7',now,new AbortController().signal)).state,'not_configured');
  await assert.rejects(providerJson('https://untrusted.invalid/')); assert.equal(calls,2);
  const { sanitizedReport }=load('src/server/admin/analytics/service'); const base=blank('instagram','7',now,'UTC',true);
  const r=sanitizedReport({...base,secret:'private-fixture',source:'private-fixture',totals:{views:Infinity,followers:-1,followerChange:-2,identity:'person'},topContent:[{label:'private-fixture',value:1,url:'https://instagram.com/p/abc?access_token=private-fixture',basis:'lifetime'}]},base);
  assert.equal(r.totals.views,null); assert.equal(r.totals.followers,null); assert.equal(r.totals.followerChange,-2); assert.equal(r.totals.identity,undefined); assert.ok(!JSON.stringify(r).includes('private-fixture'));
  assert.equal(safeUrl('https://evil.invalid/','instagram'),null); assert.equal(safeText('private-fixture'),'[skriveno]');
});
test('Analytics endpoints require Admin session and same-origin writes before provider/DB access', async () => {
  credentials(); const salt='ab'.repeat(16); Object.assign(process.env,{MEDRESA_ADMIN_USER:'analytics-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync('local-password',salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:'local-session-fixture-'.repeat(3),MEDRESA_ADMIN_ORIGIN:'http://localhost:3213'});
  const auth=load('src/server/admin/auth'); const token=auth.createSession(); let calls=0;
  const selections=[];
  const isolated=moduleLoader({'@/server/admin/analytics/service':{dashboard:async()=>{calls++;return {};},synchronize:async(...args)=>{calls++;selections.push(args);return {};}}});
  const get=isolated('src/pages/api/admin/analytics/index').default,post=isolated('src/pages/api/admin/analytics/sync').default;
  async function request(handler,patch={}) {
    const req={method:'GET',headers:{},cookies:{},query:{},body:{},...patch}; const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;}};
    await handler(req,res); assert.match(res.headers['Cache-Control'],/no-store/);return res;
  }
  assert.equal((await request(get)).code,401); assert.equal((await request(post,{method:'POST'})).code,401);
  assert.equal((await request(post,{method:'POST',cookies:{[auth.cookieName()]:token},headers:{origin:'https://evil.invalid'}})).code,403);
  assert.equal((await request(get,{cookies:{[auth.cookieName()]:token},query:{period:'all'}})).code,422); assert.equal(calls,0);
  assert.equal((await request(get,{cookies:{[auth.cookieName()]:token}})).code,200); assert.equal(calls,1);
  const authenticated={method:'POST',cookies:{[auth.cookieName()]:token},headers:{origin:process.env.MEDRESA_ADMIN_ORIGIN}};
  for(const provider of ['website','instagram','facebook','youtube',undefined]) {
    const requestId=randomUUID();
    assert.equal((await request(post,{...authenticated,body:{period:'7',requestId,...(provider===undefined?{}:{provider})}})).code,200);
    assert.deepEqual(selections.at(-1),['7',requestId,provider]);
  }
  const before=calls;
  for(const provider of [null,'all','WEBSITE','',[],{},1]) assert.equal((await request(post,{...authenticated,body:{requestId:randomUUID(),provider}})).code,422);
  assert.equal((await request(post,{...authenticated,body:{requestId:randomUUID(),provider:'website',extra:true}})).code,422);
  assert.equal(calls,before);
});
test('new migration executes in PostgreSQL, RLS/service-only grants and News/Storage remain unchanged', async () => {
  const db=await database({providerSync:false}); try {
    const tables=(await db.query("select relname,relrowsecurity from pg_class where relname like 'medresa_analytics_%' and relkind='r'")).rows;
    assert.equal(tables.length,5);assert.ok(tables.every(t=>t.relrowsecurity));
    for(const t of tables) {
      const r=(await db.query("select has_table_privilege('anon',$1,'SELECT') as browser,has_table_privilege('authenticated',$1,'INSERT') as writer,has_table_privilege('service_role',$1,'SELECT,INSERT,UPDATE') as service,has_table_privilege('service_role',$1,'DELETE') as destructive",[t.relname])).rows[0];
      assert.deepEqual(r,{browser:false,writer:false,service:true,destructive:false});
    }
    const funcs=(await db.query("select proname,prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') as browser from pg_proc where proname like 'medresa_analytics_%'")).rows;
    assert.equal(funcs.length,3);assert.ok(funcs.every(f=>!f.prosecdef&&!f.browser&&f.proconfig.includes('search_path=public, pg_temp')));
    assert.equal((await db.query('select count(*)::int n from medresa_admin_articles')).rows[0].n,0);
    assert.deepEqual((await db.query('select id,public from storage.buckets')).rows,[{id:'medresa-news-preview',public:false}]);
    for(const value of [{views:'invalid'},{views:-1},{identity:1}]) assert.equal((await db.query('select medresa_analytics_valid_metrics($1) ok',[JSON.stringify(value)])).rows[0].ok,false);
  } finally {await db.close();}
});
test('sync lease, cooldown and request idempotency prevent duplicate snapshots; failures preserve history', async () => {
  const db=await database(); try {
    const id=randomUUID(),r=reports();assert.equal((await begin(db,id)).acquired,true);
    assert.equal((await begin(db,randomUUID())).acquired,false);assert.equal((await begin(db,id)).acquired,false);
    await assert.rejects(begin(db,id,'30'));await finish(db,id,r);await finish(db,id,r);
    assert.equal((await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n,28);
    assert.equal((await db.query('select count(*)::int n from medresa_analytics_reports')).rows[0].n,4);
    assert.equal((await begin(db,randomUUID())).outcome,'cooldown'); await releaseCooldown(db);
    const before=(await db.query('select * from medresa_analytics_reports order by provider')).rows;
    const next=randomUUID();await begin(db,next);
    const failure=r.map(x=>({...x,state:'temporarily_unavailable',reason:'provider_timeout',fetchedAt:null,lastSuccessAt:null,daily:[],totals:{}}));await finish(db,next,failure);
    assert.deepEqual((await db.query('select * from medresa_analytics_reports order by provider')).rows,before);
    assert.equal((await db.query('select outcome from medresa_analytics_sync_runs where id=$1',[next])).rows[0].outcome,'failed');
    assert.ok((await db.query('select last_success_at from medresa_analytics_provider_state')).rows.every(x=>x.last_success_at));
  } finally {await db.close();}
});
test('invalid report rolls back every provider atomically; expired lease is retryable', async () => {
  const db=await database();try {
    const id=randomUUID();await begin(db,id);const r=reports();r[3].daily[0].metrics={IP:'forbidden'};
    await assert.rejects(finish(db,id,r));assert.equal((await db.query('select count(*)::int n from medresa_analytics_reports')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from medresa_analytics_provider_state')).rows[0].n,0);
    await db.exec("update medresa_analytics_sync_lock set lease_until=now()-interval '1 second',last_started_at=now()-interval '9 minutes'");
    const replacement=randomUUID();assert.equal((await begin(db,replacement)).acquired,true);await assert.rejects(finish(db,id,reports()),e=>e.code==='40001');await finish(db,replacement,reports());
    assert.equal((await db.query('select outcome from medresa_analytics_sync_runs where id=$1',[id])).rows[0].outcome,'abandoned');
  }finally{await db.close();}
});
test('service-role can complete RPCs; null metrics never erase complete data and partial data is never promoted', async () => {
  const db=await database();try {
    await db.exec('set role service_role');const id=randomUUID();await begin(db,id);const initial=reports();
    initial[0].totals.visitors=2;initial[0].daily[0].metrics={pageviews:0,visitors:2};initial[1].daily[0].complete=false;initial[1].daily[0].metrics={views:4};await finish(db,id,initial);
    await db.exec('reset role');await releaseCooldown(db);await db.exec('set role service_role');const replacement=randomUUID();await begin(db,replacement);
    const update=reports();update[0].totals.visitors=null;update[0].daily[0].metrics={pageviews:null};update[1].daily[0].metrics={reach:6};for(const r of update){r.state='permission_required';r.reason='permission_required';}await finish(db,replacement,update);
    const rows=(await db.query("select provider,metrics,complete from medresa_analytics_daily where day=$1 order by provider",[initial[0].daily[0].date])).rows;
    assert.deepEqual(rows.find(r=>r.provider==='website').metrics,{pageviews:0,visitors:2});
    assert.deepEqual(rows.find(r=>r.provider==='instagram').metrics,{reach:6});assert.equal(rows.find(r=>r.provider==='instagram').complete,true);
    assert.equal((await db.query("select report->'totals'->>'visitors' n from medresa_analytics_reports where provider='website'")).rows[0].n,'2');
    assert.equal((await db.query('select outcome from medresa_analytics_sync_runs where id=$1',[replacement])).rows[0].outcome,'partial');
    await assert.rejects(db.query('delete from medresa_analytics_daily'),e=>e.code==='42501');
  }finally{await db.close();}
});
test('real service sync writes/readbacks local PostgreSQL and preserves unique metrics, zero and unavailable providers', async () => {
  credentials();const db=await database();try {
    globalThis.fetch=restFixture(db);
    const providerOverrides={configurations:Object.fromEntries(['website','instagram','facebook','youtube'].map(p=>[p,()=>true])),timezones:{website:'UTC',instagram:'UTC',facebook:'America/Los_Angeles',youtube:'America/Los_Angeles'},collectProvider:async(p,period,date)=>{
      const r=reports(period,date).find(x=>x.provider===p);if(p==='facebook'){r.state='permission_required';r.reason='permission_required';r.fetchedAt=null;r.daily=[];}if(p==='website'){r.totals.visitors=2;r.totals.pageviews=0;}return r;
    }};
    const service=moduleLoader({'./providers':providerOverrides})('src/server/admin/analytics/service');
    const id=randomUUID(), result=await service.synchronize('7',id);assert.equal(result.dashboard.storage,'ready');
    assert.equal(result.dashboard.reports[0].totals.pageviews,0);assert.equal(result.dashboard.reports[0].totals.visitors,2);assert.equal(result.dashboard.reports[2].state,'permission_required');
    const count=(await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n;await service.synchronize('7',id);assert.equal((await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n,count);
    const repeat=await service.dashboard('7');assert.equal(repeat.reports[0].totals.visitors,2);assert.equal(repeat.reports[0].daily.length,7);assert.equal(repeat.history.length,1);assert.ok(!JSON.stringify(repeat).includes(process.env.SUPABASE_SERVICE_ROLE_KEY));
  }finally{await db.close();}
});

test('single-provider database scope is idempotent, atomic and preserves other provider rows and security', async () => {
  const db=await database(); try {
    const old=randomUUID();await begin(db,old);await finish(db,old,reports());await releaseCooldown(db);
    const unrelated=async()=>({
      reports:(await db.query("select * from medresa_analytics_reports where provider<>'website' order by provider")).rows,
      daily:(await db.query("select * from medresa_analytics_daily where provider<>'website' order by provider,day")).rows,
      states:(await db.query("select * from medresa_analytics_provider_state where provider<>'website' order by provider")).rows,
    });
    const before=await unrelated();const id=randomUUID();
    await db.exec('set role service_role');
    assert.equal((await begin(db,id,'7','website')).acquired,true);
    assert.equal((await begin(db,id,'7','website')).acquired,false);
    await assert.rejects(begin(db,id,'7','instagram'),/Idempotency request mismatch/);
    await assert.rejects(begin(db,id),/Idempotency request mismatch/);
    assert.equal((await begin(db,randomUUID(),'7','instagram')).outcome,'running');
    await assert.rejects(finish(db,id,reports()),/Invalid analytics reports/);
    await assert.rejects(finish(db,id,[reports()[1]]),/provider does not match claimed run/);
    const changed=reports()[0];changed.totals={pageviews:23,visitors:4};changed.daily[0].metrics={pageviews:23,visitors:4};
    await finish(db,id,[changed]);await finish(db,id,[changed]);
    assert.deepEqual(await unrelated(),before);
    assert.equal((await db.query('select provider,outcome from medresa_analytics_sync_runs where id=$1',[id])).rows[0].outcome,'success');
    assert.equal((await db.query('select provider from medresa_analytics_sync_runs where id=$1',[id])).rows[0].provider,'website');
    assert.deepEqual((await db.query("select report->'totals' totals from medresa_analytics_reports where provider='website'")).rows[0].totals,changed.totals);
    await db.exec('reset role');await releaseCooldown(db);
    const full=randomUUID();await begin(db,full);
    await assert.rejects(finish(db,full,[changed]),/Invalid analytics reports/);
    await finish(db,full,reports());
    const funcs=(await db.query("select proname,prosecdef,proconfig,has_function_privilege('anon',oid,'EXECUTE') browser,has_function_privilege('authenticated',oid,'EXECUTE') authenticated,has_function_privilege('service_role',oid,'EXECUTE') server from pg_proc where proname like 'medresa_analytics_%'")).rows;
    assert.equal(funcs.length,4);assert.ok(funcs.every(f=>!f.prosecdef&&!f.browser&&!f.authenticated&&f.server&&f.proconfig.includes('search_path=public, pg_temp')));
    await assert.rejects(begin(db,randomUUID(),'7','bad-provider'),/Invalid analytics provider/);
  } finally {await db.close();}
});

test('Website-only service sync calls only Vercel, persists and reloads real-shaped aggregates without changing other providers', async () => {
  credentials();
  Object.assign(process.env,{VERCEL_ANALYTICS_TOKEN:'local-vercel-fixture',INSTAGRAM_ACCESS_TOKEN:'unused-instagram-fixture',FACEBOOK_PAGE_ACCESS_TOKEN:'unused-facebook-fixture',YOUTUBE_OAUTH_CLIENT_ID:'unused-youtube-fixture',YOUTUBE_OAUTH_CLIENT_SECRET:'unused-youtube-fixture',YOUTUBE_REFRESH_TOKEN:'unused-youtube-fixture'});
  const db=await database(); try {
    const full=randomUUID();await begin(db,full,'30');await finish(db,full,reports('30'));await releaseCooldown(db);
    const unrelated=async()=>JSON.stringify((await db.query("select provider,report,fetched_at from medresa_analytics_reports where provider<>'website' order by provider")).rows);
    const before=await unrelated(),adapter=restFixture(db),external=[];
    globalThis.fetch=async(input,init)=>{
      const u=new URL(input);
      if(u.hostname.endsWith('.supabase.co')) return adapter(input,init);
      external.push(u);
      assert.equal(u.hostname,'api.vercel.com','No Meta/YouTube request is allowed in a Website-only sync');
      if(u.pathname.startsWith('/v9/projects/')) return json({name:'medresa-me',id:'prj_fixture'});
      assert.equal(u.pathname,'/v1/query/web-analytics/visits/aggregate');
      assert.equal(u.searchParams.get('filter'),"environment eq 'preview' and not startswith(requestPath, '/admin')");
      const by=u.searchParams.get('by');
      if(by==='environment') return json({data:[{environment:'preview',pageviews:42,visitors:9}]});
      if(by==='day') return json({error:{message:'local-vercel-fixture raw error'}},400);
      return json({data:[{[by]:by==='requestPath'?'/vijesti/fixture':'mobile',pageviews:42}]});
    };
    const service=load('src/server/admin/analytics/service'),id=randomUUID();
    const result=await service.synchronize('30',id,'website');
    assert.equal(result.dashboard.storage,'ready');
    const web=result.dashboard.reports.find(r=>r.provider==='website');
    assert.equal(web.state,'connected');assert.deepEqual(web.totals,{pageviews:42,visitors:9});
    assert.ok(web.warnings.includes('invalid_response'));
    assert.equal(result.websiteRequests.find(r=>r.request==='daily').httpStatus,400);
    assert.ok(!JSON.stringify(result.websiteRequests).includes('local-vercel-fixture'));
    assert.ok(!JSON.stringify((await db.query("select report from medresa_analytics_reports where provider='website'")).rows).includes('websiteRequests'));
    assert.ok(external.length>=10);assert.equal(await unrelated(),before);
    const states=(await db.query("select provider,last_attempt_at from medresa_analytics_provider_state where provider<>'website' order by provider")).rows;
    const daily=(await db.query("select * from medresa_analytics_daily where provider<>'website' order by provider,day")).rows;
    const callCount=external.length;await service.synchronize('30',id,'website');assert.equal(external.length,callCount);
    await assert.rejects(service.synchronize('30',id,'instagram'));assert.equal(external.length,callCount);
    assert.deepEqual((await db.query("select provider,last_attempt_at from medresa_analytics_provider_state where provider<>'website' order by provider")).rows,states);
    assert.deepEqual((await db.query("select * from medresa_analytics_daily where provider<>'website' order by provider,day")).rows,daily);
    const reload=await service.dashboard('30');assert.deepEqual(reload.reports.find(r=>r.provider==='website').totals,web.totals);
    assert.equal((await db.query('select count(*)::int n from medresa_analytics_sync_runs')).rows[0].n,2);
    assert.equal((await db.query('select outcome from medresa_analytics_sync_runs where id=$1',[id])).rows[0].outcome,'success');
    assert.ok(!JSON.stringify(reload).includes(process.env.VERCEL_ANALYTICS_TOKEN));
    await assert.rejects(service.synchronize('30',randomUUID(),'invalid'),e=>e.status===422);
    assert.equal(external.length,callCount);
  } finally {await db.close();}
});

test('missing provider-sync migration stops before provider calls; existing full refresh still works', async () => {
  credentials();process.env.VERCEL_ANALYTICS_TOKEN='local-vercel-fixture';
  const db=await database({providerSync:false});try {
    globalThis.fetch=restFixture(db);const calls=[];
    const service=moduleLoader({'./providers':{
      configurations:Object.fromEntries(['website','instagram','facebook','youtube'].map(p=>[p,()=>true])),
      timezones:{website:'UTC',instagram:'UTC',facebook:'America/Los_Angeles',youtube:'America/Los_Angeles'},
      collectProvider:async(p,period,date)=>{calls.push(p);return reports(period,date).find(r=>r.provider===p);},
    }})('src/server/admin/analytics/service');
    await assert.rejects(service.synchronize('7',randomUUID(),'website'),e=>e.status===503 && e.message.includes('pojedinačne izvore'));
    assert.deepEqual(calls,[]);assert.equal((await db.query('select count(*)::int n from medresa_analytics_sync_runs')).rows[0].n,0);
    const result=await service.synchronize('7',randomUUID());assert.equal(result.dashboard.storage,'ready');
    assert.deepEqual(calls,['website','instagram','facebook','youtube']);
  }finally{await db.close();}
});
