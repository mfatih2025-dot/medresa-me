import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
const env={...process.env},originalFetch=globalThis.fetch,originalWarn=console.warn;
afterEach(()=>{globalThis.fetch=originalFetch;console.warn=originalWarn;for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);});
function credentials(){Object.assign(process.env,{YOUTUBE_OAUTH_CLIENT_ID:'synthetic-client',YOUTUBE_OAUTH_CLIENT_SECRET:'synthetic-secret',YOUTUBE_REFRESH_TOKEN:'synthetic-refresh'});delete process.env.YOUTUBE_CHANNEL_ID;console.warn=()=>{};}
test('read-only YouTube identifies OAuth, channel and Analytics failures without persistence, other providers or raw responses',async()=>{
 credentials();const {readOnlyYouTubeDiagnostic}=moduleLoader()('src/server/admin/analytics/youtubeReadOnly');
 for(const [failedStage,status,googleErrorCode,oauth,channel] of [['oauth',400,'invalid_grant',false,false],['channel',403,'insufficientPermissions',true,false],['daily',403,'serviceDisabled',true,true]]){
  const requests=[];globalThis.fetch=async(input,init)=>{
   const u=new URL(input);requests.push({host:u.hostname,method:init.method??'GET'});
   assert.ok(['oauth2.googleapis.com','www.googleapis.com','youtubeanalytics.googleapis.com'].includes(u.hostname));
   const stage=u.hostname==='oauth2.googleapis.com'?'oauth':u.hostname==='www.googleapis.com'?'channel':'daily';
   if(stage===failedStage)return new Response(JSON.stringify({error:stage==='oauth'?googleErrorCode:{code:status,status:'PERMISSION_DENIED',message:'synthetic-secret',errors:[{reason:googleErrorCode}]},error_description:'synthetic-refresh',access_token:'synthetic-access'}),{status});
   return new Response(JSON.stringify(stage==='oauth'?{access_token:'synthetic-access'}:{items:[{id:'UC'+'a'.repeat(22)}]}));
  };
  const r=await readOnlyYouTubeDiagnostic('30');assert.equal(r.failedStage,failedStage);assert.equal(r.httpStatus,status);assert.equal(r.googleErrorCode,googleErrorCode);assert.equal(r.refreshTokenExchangeSucceeded,oauth);assert.equal(r.channelDiscoverySucceeded,channel);assert.equal(r.analyticsRequestSucceeded,false);
  assert.equal(requests.filter(r=>r.method==='POST').length,1);assert.equal(requests[0].host,'oauth2.googleapis.com');
  for(const secret of ['synthetic-secret','synthetic-refresh','synthetic-access'])assert.ok(!JSON.stringify(r).includes(secret));
 }
});
test('successful API reads and configuration/validation failures are distinguished without inventing an OAuth cause',async()=>{
 credentials();const {readOnlyYouTubeDiagnostic}=moduleLoader()('src/server/admin/analytics/youtubeReadOnly');
 globalThis.fetch=async input=>{const u=new URL(input);return new Response(JSON.stringify(u.hostname==='oauth2.googleapis.com'?{access_token:'synthetic-access'}:u.hostname==='www.googleapis.com'?{items:[{id:'UC'+'a'.repeat(22)}]}:{columnHeaders:[{name:u.searchParams.get('dimensions')},...['views','estimatedMinutesWatched','subscribersGained','subscribersLost'].map(name=>({name}))],rows:[]}));};
 const ok=await readOnlyYouTubeDiagnostic('30');assert.equal(ok.failedStage,null);assert.equal(ok.httpStatus,200);assert.equal(ok.refreshTokenExchangeSucceeded,true);assert.equal(ok.channelDiscoverySucceeded,true);assert.equal(ok.analyticsRequestSucceeded,true);
 delete process.env.YOUTUBE_REFRESH_TOKEN;globalThis.fetch=()=>{throw Error('Configuration failure must not fetch');};
 const missing=await readOnlyYouTubeDiagnostic('30');assert.equal(missing.failedStage,'configuration');assert.equal(missing.httpStatus,null);assert.equal(missing.googleErrorCode,null);assert.equal(missing.reason,'not_configured');
 credentials();globalThis.fetch=async input=>new Response(JSON.stringify(new URL(input).hostname==='oauth2.googleapis.com'?{access_token:'synthetic-access'}:{items:[]}));
 const invalid=await readOnlyYouTubeDiagnostic('30');assert.equal(invalid.failedStage,'channel');assert.equal(invalid.reason,'project_mismatch');assert.equal(invalid.httpStatus,200);assert.equal(invalid.channelDiscoverySucceeded,false);
});
test('server/browser projection discards arbitrary error text, unknown codes, credentials and channel metadata',()=>{
 const {youtubeReadOnlyResult}=moduleLoader()('src/admin/analytics/youtubeReadOnly');const r=youtubeReadOnlyResult({failedStage:'oauth',httpStatus:400,googleErrorCode:'invalid_grant',reason:'expired_credential',message:'private-token',headers:{Authorization:'private-token'},channelId:'private-token',refreshTokenExchangeSucceeded:false});
 assert.equal(r.googleErrorCode,'invalid_grant');assert.ok(!JSON.stringify(r).includes('private-token'));assert.equal(Object.keys(r).length,8);
 const invalid=youtubeReadOnlyResult({failedStage:'private-token',googleErrorCode:'private-token',reason:'private-token',httpStatus:'private-token'});assert.equal(invalid.failedStage,null);assert.equal(invalid.googleErrorCode,null);assert.equal(invalid.httpStatus,null);
});
test('diagnostic endpoint uses existing Admin auth first, is GET-only/no-store/noindex and supports approved main/Preview without sync',async()=>{
 Object.assign(process.env,{VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'main',MEDRESA_ADMIN_USER:'synthetic-user',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128),MEDRESA_ADMIN_SESSION_SECRET:'synthetic-session-secret-at-least-32-characters',MEDRESA_ADMIN_ORIGIN:'https://admin.example.test'});
 let calls=0;const load=moduleLoader({'@/server/admin/analytics/youtubeReadOnly':{readOnlyYouTubeDiagnostic:async period=>{assert.equal(period,'30');calls++;return {failedStage:'oauth'};}}}),auth=load('src/server/admin/auth'),handler=load('src/pages/api/admin/analytics/youtube-diagnostic').default;
 const request=async(cookies={},method='GET',period='30')=>{const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;}};await handler({cookies,method,query:{period},headers:{}},res);return res;};
 assert.equal((await request()).code,401);assert.equal(calls,0);const cookies={[auth.cookieName()]:auth.createSession()};
 const ok=await request(cookies);assert.equal(ok.code,200);assert.match(ok.headers['Cache-Control'],/no-store/);assert.match(ok.headers['X-Robots-Tag'],/noindex, nofollow/);
 assert.equal((await request(cookies,'POST')).code,405);assert.equal((await request(cookies,'GET','bad')).code,422);
 process.env.VERCEL_ENV='preview';process.env.VERCEL_GIT_COMMIT_REF='codex/admin-panel';assert.equal((await request(cookies)).code,200);
 process.env.VERCEL_GIT_COMMIT_REF='other';assert.equal((await request(cookies)).code,404);assert.equal(calls,2);
});
