import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {moduleLoader} from '../scripts/lib/load-typescript.mjs';
const fetchOriginal=globalThis.fetch,warnOriginal=console.warn;
afterEach(()=>{globalThis.fetch=fetchOriginal;console.warn=warnOriginal;});
test('normal YouTube refresh failures retain exact safe Google stage/status without logging credentials or response text',async()=>{
 const {youtubeJson}=moduleLoader()('src/server/admin/analytics/youtubeDiagnostic');
 for(const [stage,status,body,googleReason] of [
  ['oauth',400,{error:'invalid_grant',error_description:'private-token-fixture'},'invalid_grant'],
  ['oauth',401,{error:'invalid_client',error_description:'private-token-fixture'},'invalid_client'],
  ['daily',403,{error:{code:403,status:'PERMISSION_DENIED',message:'private-token-fixture',errors:[{reason:'insufficientPermissions'}]}},'insufficientPermissions'],
  ['channel',403,{error:{code:403,status:'PERMISSION_DENIED',errors:[{reason:'serviceDisabled'}]}},'serviceDisabled'],
  ['daily',403,{error:{code:403,status:'private-token-fixture',errors:[{reason:'private-token-fixture'}]}},null],
 ]){
  const messages=[];console.warn=(...args)=>messages.push(args);
  globalThis.fetch=async()=>new Response(JSON.stringify({...body,access_token:'private-token-fixture'}),{status});
  await assert.rejects(youtubeJson(stage==='oauth'?'https://oauth2.googleapis.com/token':'https://www.googleapis.com/youtube/v3/channels',{headers:{Authorization:'Bearer private-token-fixture'}},new AbortController().signal,stage));
  assert.equal(messages.length,1);assert.equal(messages[0][0],'medresa.youtube.request.failed');
  assert.deepEqual(Object.keys(messages[0][1]).sort(),['code','googleReason','googleStatus','httpStatus','reason','request']);
  assert.equal(messages[0][1].httpStatus,status);assert.equal(messages[0][1].request,stage);assert.equal(messages[0][1].googleReason,googleReason);
  assert.ok(!JSON.stringify(messages).includes('private-token-fixture'));
 }
});
test('successful YouTube API calls emit no failure logs and preserve the exact response',async()=>{
 const {youtubeJson}=moduleLoader()('src/server/admin/analytics/youtubeDiagnostic'),messages=[];
 console.warn=(...args)=>messages.push(args);const response={access_token:'synthetic-test-only'};
 globalThis.fetch=async()=>new Response(JSON.stringify(response),{status:200});
 assert.deepEqual(await youtubeJson('https://oauth2.googleapis.com/token',{},new AbortController().signal,'oauth'),response);assert.deepEqual(messages,[]);
});
