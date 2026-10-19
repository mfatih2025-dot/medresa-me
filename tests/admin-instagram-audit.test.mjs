import {test, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';

const env={...process.env};
afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);});
const now=new Date('2026-10-19T12:00:00Z');
function report(){return {provider:'instagram',state:'connected',reason:null,timezone:'UTC',range:{start:'2026-07-21',end:'2026-10-18'},totals:{views:30},totalCoverage:{views:{days:90,expectedDays:90,partial:false,basis:'period'}},daily:[],fetchedAt:'2026-10-19T10:00:00Z',lastSuccessAt:'2026-10-19T11:00:00Z'};}
function auditLoader(r=report(),graph=async()=>{throw Error('Unexpected Meta call');}){
  return moduleLoader({'./service':{dashboard:async(period,date)=>{assert.equal(period,'90');return {storage:'ready',generatedAt:date.toISOString(),reports:[r]};}},'./instagramDiagnostic':{
    discoverInstagramFacebook:async()=>({id:'101',token:'synthetic-page-secret',credential:'page',redactions:[]}),instagramGraph:graph,
  }});
}
test('compact audit projects only safe Instagram values, distinguishes inferred coverage, never invents old raw values',async()=>{
  const r={...report(),secret:'must-not-return',topContent:[{label:'must-not-return'}],headers:{Authorization:'must-not-return'}};
  const {instagramAudit}=auditLoader(r)('src/server/admin/analytics/instagramAudit');
  const out=await instagramAudit(false,now);
  assert.equal(out.report.savedAggregatedValue,30);assert.equal(out.report.savedPeriodValue,30);
  assert.equal(out.report.displayedValueSource,'saved_period_total');assert.equal(out.report.measuredDailyViews.days,0);
  assert.equal(out.report.coverage.days,90);assert.match(out.report.coverageEvidence,/inferred/);
  assert.equal(out.rawMetaAtSavedRefresh.value,null);assert.equal(out.rawMetaAtSavedRefresh.available,false);
  assert.equal(out.freshMeta.requested,false);assert.equal(out.persisted,false);
  assert.ok(!JSON.stringify(out).includes('must-not-return'));assert.ok(JSON.stringify(out).length<2200);
});
test('fresh audit captures three raw account views totals, matches UTC windows, does not replace displayed saved value or write',async()=>{
  process.env.INSTAGRAM_ACCESS_TOKEN='synthetic-user-secret';const requests=[];const r=report();const before=JSON.stringify(r);
  const {instagramAudit}=auditLoader(r,async(token,path,params)=>{
    assert.equal(token,'synthetic-page-secret');assert.equal(path,'101/insights');assert.equal(params.metric,'views');assert.equal(params.period,'day');assert.equal(params.metric_type,'total_value');
    assert.equal(params.breakdown,undefined);requests.push(params);return {data:[{name:'views',period:'day',total_value:{value:12},private:'must-not-return'}],access_token:'must-not-return'};
  })('src/server/admin/analytics/instagramAudit');
  const out=await instagramAudit(true,now);
  assert.equal(requests.length,3);assert.equal(out.freshMeta.aggregatedValue,36);assert.equal(out.freshMeta.differenceFromSaved,6);
  assert.ok(Number.isFinite(Date.parse(out.freshMeta.respondedAt)));
  assert.equal(out.report.savedAggregatedValue,30);assert.equal(out.report.displayedValueSource,'saved_period_total');assert.equal(out.freshMetaUsedForDisplayedValue,false);
  assert.equal(Number(requests[0].since)*1000,Date.parse('2026-07-21'));assert.equal(Number(requests[2].until)*1000,Date.parse('2026-10-19'));
  for(let i=0;i<3;i++){assert.equal(Number(requests[i].until)-Number(requests[i].since),30*86400);if(i)assert.equal(requests[i].since,requests[i-1].until);}
  assert.equal(JSON.stringify(r),before);for(const secret of ['synthetic-user-secret','synthetic-page-secret','must-not-return'])assert.ok(!JSON.stringify(out).includes(secret));
});

test('temporary in-Admin display uses a numeric/date allowlist and stays absent unless explicitly enabled',async()=>{
  const {instagramAudit}=auditLoader(report(),async()=>({data:[{name:'views',period:'day',total_value:{value:0}}]}))('src/server/admin/analytics/instagramAudit');
  process.env.INSTAGRAM_ACCESS_TOKEN='synthetic-user-secret';
  const response=await instagramAudit(true,now);response.secret='must-not-return';response.freshMeta.headers={Authorization:'must-not-return'};
  const {instagramAuditView}=moduleLoader()('src/admin/analytics/instagramAuditView');
  const view=instagramAuditView(response);
  assert.equal(view['FRESH META VALUE'].value,0);assert.equal(view['SAVED ADMIN VALUE'].value,30);
  assert.equal(view['SAVED ADMIN VALUE'].provenance,'saved_period_total');assert.equal(view.startDate,'2026-07-21');assert.equal(view.endDate,'2026-10-18');assert.equal(view.timezone,'UTC');
  assert.ok(!JSON.stringify(view).includes('must-not-return'));
  assert.throws(()=>instagramAuditView({...response,persisted:true}));
  assert.throws(()=>instagramAuditView({...response,report:{...response.report,metric:'reach'}}));
  const {default:React}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
  const css=new Proxy({},{get:(_,name)=>String(name)});
  const load=moduleLoader({'../Shell':{Shell:({children})=>React.createElement('main',null,children)},'../admin.module.css':{default:css},'./analytics.module.css':{default:css},'./InstagramAuditControl':{InstagramAuditControl:()=>React.createElement('button',null,'Instagram 90d diagnostic')}});
  const {Analytics}=load('src/admin/analytics/Dashboard');
  const initial={period:'90',generatedAt:now.toISOString(),reports:[],storage:'ready',writable:false,sync:{running:false,runId:null},history:[]};
  assert.ok(!renderToStaticMarkup(React.createElement(Analytics,{initial})).includes('Instagram 90d diagnostic'));
  assert.ok(renderToStaticMarkup(React.createElement(Analytics,{initial,instagramDiagnosticEnabled:true})).includes('Instagram 90d diagnostic'));
});
test('daily fallback and unavailable provenance remain honest; malicious fields/errors cannot enter diagnostic',async()=>{
  const r=report();r.totalCoverage.views.basis='daily';r.daily=[{date:'2026-10-18',metrics:{views:30},complete:true}];
  const load=auditLoader(r);const {projectInstagramAudit,instagramAudit}=load('src/server/admin/analytics/instagramAudit');
  assert.equal(projectInstagramAudit(r,now.toISOString()).report.displayedValueSource,'daily_snapshots');
  assert.equal(projectInstagramAudit(r,now.toISOString()).report.savedPeriodValue,null);
  process.env.INSTAGRAM_ACCESS_TOKEN='synthetic-user-secret';
  const failure=await instagramAudit(true,now);assert.equal(failure.freshMeta.status,'unavailable');assert.equal(failure.freshMeta.reason,'invalid_response');
  assert.equal(failure.freshMeta.aggregatedValue,null);assert.equal(failure.report.savedAggregatedValue,30);
  r.totals={};assert.equal(projectInstagramAudit(r,now.toISOString()).report.displayedValueSource,'unavailable');
});
test('wrong metric, wrong period, empty/malformed values and upstream errors are rejected without raw response leakage',async()=>{
  process.env.INSTAGRAM_ACCESS_TOKEN='synthetic-user-secret';
  for(const row of [{name:'reach',period:'day',total_value:{value:1}},{name:'views',period:'lifetime',total_value:{value:1}},{name:'views',period:'day',total_value:{value:'token-not-a-number'}}]){
    const {instagramAudit}=auditLoader(report(),async()=>({data:[row]}))('src/server/admin/analytics/instagramAudit');
    const out=await instagramAudit(true,now);assert.equal(out.freshMeta.aggregatedValue,null);assert.equal(out.freshMeta.status,'unavailable');assert.ok(!JSON.stringify(out).includes('token-not-a-number'));
  }
});
test('existing endpoint authenticates first, remains GET-only/no-store/noindex, and limits diagnostic to Preview/90 days',async()=>{
  Object.assign(process.env,{VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/admin-panel',MEDRESA_ADMIN_USER:'fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128),MEDRESA_ADMIN_SESSION_SECRET:'synthetic-session-secret-at-least-32-characters',MEDRESA_ADMIN_ORIGIN:'https://preview.example'});
  let calls=0,normalCalls=0;
  const load=moduleLoader({'@/server/admin/analytics/common':{previewConfiguration(){}},'@/server/admin/analytics/instagramAudit':{instagramAudit:async fresh=>{calls++;return {fresh,persisted:false};}},'@/server/admin/analytics/service':{dashboard:async()=>{normalCalls++;return {reports:[]};}}});
  const auth=load('src/server/admin/auth'),handler=load('src/pages/api/admin/analytics/index').default;
  const request=async(query,cookies={},method='GET')=>{const res={headers:{},status(n){this.code=n;return this;},setHeader(k,v){this.headers[k]=v;},json(body){this.body=body;return this;}};await handler({method,query,cookies,headers:{}},res);return res;};
  const query={period:'90',diagnostic:'instagram',fresh:'1'};
  assert.equal((await request(query)).code,401);assert.equal(calls,0);
  const cookies={[auth.cookieName()]:auth.createSession()};
  const ok=await request(query,cookies);assert.equal(ok.code,200);assert.equal(ok.body.fresh,true);assert.match(ok.headers['Cache-Control'],/no-store/);assert.match(ok.headers['X-Robots-Tag'],/noindex, nofollow/);
  assert.equal((await request(query,cookies,'POST')).code,405);
  assert.equal((await request({...query,period:'30'},cookies)).code,422);assert.equal((await request({...query,fresh:['1']},cookies)).code,422);
  process.env.VERCEL_ENV='production';process.env.VERCEL_GIT_COMMIT_REF='main';assert.equal((await request(query,cookies)).code,404);
  assert.equal((await request({period:'90'},cookies)).code,200);assert.equal(normalCalls,1);assert.equal(calls,1);
});
