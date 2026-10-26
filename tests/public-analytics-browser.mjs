import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync } from 'node:fs';
import next from 'next';
import { chromium } from 'playwright';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
// Virtual HTTPS hosts are bridged only to localhost. The real Vercel intake is
// never contacted: this stub consumes the actual SDK queue to count pageviews.
const origin = 'https://www.medresa.me', local = 'http://localhost:3228';
const script = `(() => {
  const queue = window.vaq || []; let beforeSend = e => e;
  function handle(name, props) {
    if (name === 'beforeSend') beforeSend = props;
    if (name === 'pageview') {
      const event = beforeSend({type:'pageview',url:new URL(props.path,location.origin).href});
      if (event) fetch('/__local_analytics_intake', {method:'POST',body:JSON.stringify(event)});
    }
  }
  window.va = handle; queue.forEach(args => handle(...args)); window.vaq=[];
  if (!document.currentScript.dataset.disableAutoTrack) handle('pageview',{path:location.pathname});
})();`;
Object.assign(process.env, {NODE_ENV:'production',VERCEL_ENV:'production',VERCEL_GIT_COMMIT_REF:'main',MEDRESA_ADMIN_ORIGIN:origin,MEDRESA_ADMIN_USER:'local-tracker-fixture',MEDRESA_ADMIN_SESSION_SECRET:'explicit-local-tracker-fixture-secret-at-least-32-characters',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+'a'.repeat(32)+'$'+'b'.repeat(128)});
const auth=moduleLoader()('src/server/admin/auth');
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const address = input instanceof Request ? input.url : String(input);
  assert.ok(address.startsWith(local + '/'), 'All remote server requests are blocked');
  return realFetch(input, init);
};
async function bridge(url, request, preserveHost = false) {
  const originalHeaders = await request.allHeaders();
  return new Promise((resolve, reject) => {
    const headers = {...originalHeaders,host:preserveHost?url.host:new URL(local).host}; delete headers['accept-encoding']; delete headers['x-forwarded-host']; delete headers['x-forwarded-proto'];
    const req = http.request(local + url.pathname + url.search, {method:request.method(),headers}, res => {
      const chunks=[];res.on('data', chunk=>chunks.push(chunk));res.on('end',()=>{
        const resultHeaders={};for(const [key,value] of Object.entries(res.headers)) if(value!==undefined&&!['content-length','transfer-encoding','content-encoding'].includes(key))resultHeaders[key]=Array.isArray(value)?value.join(', '):value;
        resolve({status:res.statusCode,headers:resultHeaders,body:Buffer.concat(chunks)});
      });
    });req.on('error',reject);req.end(request.postDataBuffer()??undefined);
  });
}
const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3228});
await app.prepare();const server=http.createServer(app.getRequestHandler());await new Promise(resolve=>server.listen(3228,'localhost',resolve));
const browser=await chromium.launch({headless:true,executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox']});
const context=await browser.newContext();const views=[],loads=[],errors=[];
try {
  await context.addCookies([{name:'medresa-locale',value:'bs',url:origin}]);
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    assert.ok(['www.medresa.me','medresa.me','preview.vercel.app','localhost'].includes(url.hostname),'Unexpected browser network destination '+url.hostname);
    if(url.pathname==='/_vercel/insights/script.js') {loads.push(url.href);return route.fulfill({contentType:'application/javascript',body:script});}
    if(url.pathname==='/__local_analytics_intake') {views.push(JSON.parse(request.postData()));return route.fulfill({status:204});}
    return route.fulfill(await bridge(url,request));
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  let viewResponse=page.waitForResponse(response=>response.url().endsWith('/__local_analytics_intake'));
  await page.goto(origin+'/historijat');await viewResponse;await page.waitForLoadState('networkidle');
  assert.equal(views.length,1,'Exactly one initial pageview');assert.equal(loads.length,1);
  assert.equal(await page.locator('script[src*="/_vercel/insights/script.js"]').count(),1);
  assert.equal(await page.locator('script[src*="/_vercel/insights/script.js"]').getAttribute('data-disable-auto-track'),'1','SDK must own routing; script must not auto-count again');
  viewResponse=page.waitForResponse(response=>response.url().endsWith('/__local_analytics_intake'));
  await page.evaluate(()=>{window.__trackerDocument='same';document.querySelector('a[href="/upis"]').click();});
  await page.waitForURL(origin+'/upis');await page.waitForFunction(()=>window.location.pathname==='/upis');await viewResponse;await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(()=>window.__trackerDocument),'same','Test must exercise client navigation');
  assert.equal(views.length,2,'Exactly one additional SDK pageview per client navigation');assert.equal(loads.length,1,'No second script');
  await page.evaluate(()=>window.va('pageview',{path:'/ulaz7/login'}));await page.waitForLoadState('networkidle');assert.equal(views.length,2,'beforeSend rejects private event URLs');
  for(const path of ['/ulaz7/login','/admin','/en/admin']) {
    await page.goto(origin+path);await page.waitForLoadState('networkidle');assert.equal(views.length,2,'No private pageviews '+path);assert.equal(loads.length,1,'No private tracker '+path);
  }
  await context.addCookies([{name:auth.cookieName(),value:auth.createSession(),url:origin,httpOnly:true,secure:true,sameSite:'Strict'}]);
  await page.goto(origin+'/admin-preview/editor');await page.waitForLoadState('networkidle');
  assert.equal(views.length,2,'Authenticated private preview never tracks');assert.equal(loads.length,1);
  await context.clearCookies({name:auth.cookieName()});
  for(const host of ['https://preview.vercel.app','http://localhost']) {
    await page.goto(host+'/historijat');await page.waitForLoadState('networkidle');assert.equal(views.length,2,'No alias/dev events');assert.equal(loads.length,1);
  }
  // Virtual HTTPS redirect follow-ups bypass interception in Chromium. Verify
  // the real host redirect via the bridge, then visit its exact destination.
  const apex=await bridge(new URL('https://medresa.me/historijat'),{allHeaders:async()=>({}),method:()=> 'GET',postDataBuffer:()=>null},true);
  assert.equal(apex.status,301);assert.equal(apex.headers.location,origin+'/historijat');
  viewResponse=page.waitForResponse(response=>response.url().endsWith('/__local_analytics_intake'));
  await page.goto(apex.headers.location);await viewResponse;await page.waitForLoadState('networkidle');
  assert.equal(views.length,3,'Apex redirects and counts only the final canonical page');assert.equal(loads.length,2);
  assert.ok(views.every(event=>new URL(event.url).hostname==='www.medresa.me'));
  assert.deepEqual(errors,[]);
  console.log('PASS: actual Next SDK, one initial/client-navigation pageview, one script per document, private/localized-admin/Preview-host/dev exclusions, canonical apex redirect. Intake/script are local fixtures; no live analytics events.');
} finally {await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));await app.close();globalThis.fetch=realFetch;}
