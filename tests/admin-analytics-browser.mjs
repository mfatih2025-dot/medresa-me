import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import http from 'node:http';
import { database, reports, begin, finish, releaseCooldown, restFixture, fixtureEnvironment, providerHost } from './fixtures/analytics.mjs';
const requireProject=createRequire(resolve('package.json'));
const next=requireProject('next'),{chromium}=requireProject('playwright');

// Real production Next/Admin route handlers, entirely local PostgreSQL/provider fixtures.
// No remote write, credential lookup or production connection is possible here.
process.env.NODE_ENV='production';
const origin='http://localhost:3213';
(async()=>{
  const db=await database();const fixtureDate=new Date();
  for(const period of ['today','yesterday','7','30','60','90']) {
    await releaseCooldown(db);const id=randomUUID();await begin(db,id,period);const r=reports(period,fixtureDate);
    for(const p of r) {
      if(p.provider==='website') {p.totals.visitors=3;p.previousTotals.visitors=2;}
      if(p.provider==='instagram') for(const day of p.daily) day.metrics.reach=8;
      p.today={date:p.todayDate,metrics:p.provider==='website'?{pageviews:0,visitors:0}:{views:0,reach:0,interactions:0},complete:false};
      p.yesterday={date:new Date(Date.parse(p.todayDate)-86400000).toISOString().slice(0,10),metrics:p.provider==='website'?{pageviews:10,visitors:2}:{views:10,reach:9,interactions:2},complete:true};
      p.topContent=[{label:'Dugi stvarni naziv sadržaja za provjeru prijeloma na mobilnim ekranima '.repeat(2),value:42,url:null,basis:'period'}];
    }
    await finish(db,id,r);
  }
  await releaseCooldown(db);
  const adapter=restFixture(db),originalFetch=globalThis.fetch;let missingSchema=false,delay=false,syncRequests=0;
  globalThis.fetch=async(input,init={})=>{
    const address=input instanceof URL?input.href:typeof input==='string'?input:input.url;
    if(address.startsWith(providerHost+'/')) {
      if(missingSchema && address.includes('/medresa_analytics_sync_lock?')) return new Response(JSON.stringify({code:'PGRST205'}),{status:404});
      if(address.includes('/rpc/medresa_analytics_begin_sync')) {syncRequests++;if(delay) await new Promise(r=>setTimeout(r,350));}
      return adapter(address,init);
    }
    // Existing News/public modules are intentionally outside this test and remain unchanged.
    if(new URL(address).hostname.endsWith('supabase.co')) throw new Error('Unexpected remote Supabase request');
    return originalFetch(input,init);
  };
  for(const k of ['INSTAGRAM_ACCESS_TOKEN','FACEBOOK_PAGE_ACCESS_TOKEN','VERCEL_ANALYTICS_TOKEN','YOUTUBE_OAUTH_CLIENT_ID','YOUTUBE_OAUTH_CLIENT_SECRET','YOUTUBE_REFRESH_TOKEN']) delete process.env[k];
  const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
  Object.assign(process.env,fixtureEnvironment,{NEXT_TELEMETRY_DISABLED:'1',MEDRESA_ADMIN_USER:'analytics-browser-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:randomBytes(48).toString('base64url'),MEDRESA_ADMIN_ORIGIN:origin});
  const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3213});await app.prepare();
  const server=http.createServer(app.getRequestHandler());await new Promise(r=>server.listen(3213,'localhost',r));
  const browser=await chromium.launch({executablePath:process.env.MEDRESA_TEST_CHROMIUM||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.ok([302,307].includes((await context.request.get(origin+'/admin/analitika',{maxRedirects:0})).status()));
  assert.equal((await context.request.get(origin+'/api/admin/analytics')).status(),401);
  assert.equal((await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:origin},data:{period:'30',requestId:randomUUID()}})).status(),401);
  assert.equal((await context.request.post(origin+'/api/admin/login',{headers:{Origin:origin},data:{user:process.env.MEDRESA_ADMIN_USER,password}})).status(),200);
  assert.equal((await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:'https://evil.invalid'},data:{period:'30',requestId:randomUUID()}})).status(),403);
  await page.goto(origin+'/admin/analitika');await page.getByRole('heading',{name:'Analitika',exact:true}).waitFor();
  const inert=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});await inert.addCookies(await context.cookies());const serverPage=await inert.newPage();await serverPage.goto(origin+'/admin/analitika');
  assert.deepEqual(await serverPage.locator('svg title').allTextContents(),await page.locator('svg title').allTextContents(),'Chart accessibility text must match server/client DOM');await inert.close();
  const initialReport=await (await context.request.get(origin+'/api/admin/analytics?period=30')).json();
  assert.equal(initialReport.storage,'ready',JSON.stringify({storage:initialReport.storage,reports:initialReport.reports?.map(r=>({provider:r.provider,state:r.state,reason:r.reason,days:r.daily.length}))}));
  assert.ok(initialReport.reports.every(r=>r.daily.length>0),JSON.stringify(initialReport.reports.map(r=>({provider:r.provider,state:r.state,reason:r.reason,range:r.range,days:r.daily.length,totals:r.totals}))));
  assert.equal(await page.getByRole('button',{name:'30 dana',exact:true}).getAttribute('aria-pressed'),'true');
  const fits=async(width)=>{
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'Analytics page overflow '+width);
    for(const name of ['Danas','Juče','7 dana','30 dana','60 dana','90 dana','Osvježi podatke']) {
      const box=await page.getByRole('button',{name,exact:true}).boundingBox();assert.ok(box.height>=44 && box.width>=44,name+' touch target '+width);
    }
    assert.equal(await page.locator('svg[role="img"]').count(),4);
    assert.ok(!(await page.locator('main').innerText()).includes('NaN'));assert.ok(!(await page.locator('main').innerText()).includes('Infinity'));
  };
  for(const width of [360,390,412,430]) {
    await page.setViewportSize({width,height:900});await fits(width);
    const periodResponse=page.waitForResponse(r=>r.url().includes('/api/admin/analytics?period=7'));await page.getByRole('button',{name:'7 dana',exact:true}).tap();await periodResponse;
    await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));
    const slider=page.getByRole('slider',{name:'Odaberi dan · Website',exact:true});await slider.tap();await slider.press('Home');for(let i=0;i<3;i++) await slider.press('ArrowRight');assert.equal(await slider.inputValue(),'3');await fits(width);
    for(const name of ['Danas','Juče','60 dana','90 dana','30 dana']) {
      const awaited=page.waitForResponse(r=>r.url().includes('/api/admin/analytics?period='));await page.getByRole('button',{name,exact:true}).tap();await awaited;
      await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));await fits(width);
    }
    if(process.env.MEDRESA_TEST_SCREENSHOT_DIR) await page.screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'analytics-'+width+'.png'),fullPage:true});
  }
  delay=true;const pending=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Osvježi podatke',exact:true}).tap();
  assert.equal(await page.getByRole('button',{name:'Osvježavam podatke…',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'7 dana',exact:true}).isDisabled(),true);await pending;
  await page.getByText('Osvježavanje je završeno; izvori još nijesu vratili dostupne podatke.',{exact:true}).waitFor();assert.equal(syncRequests,1);
  const saved=await context.request.get(origin+'/api/admin/analytics?period=30');assert.equal(saved.status(),200);
  const body=await saved.json();assert.equal(body.reports[0].totals.visitors,3);assert.equal(body.reports[0].state,'not_configured');assert.ok(body.reports[0].lastSuccessAt);
  await page.reload();assert.equal(await page.locator('svg[role="img"]').count(),4);
  missingSchema=true;await page.reload();await page.getByText('Historija analitike čeka zasebnu Preview migraciju. News i prijevod ostaju dostupni.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Osvježi podatke',exact:true}).isDisabled(),true);
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);}
  const html=await page.content();
  for(const secret of [process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.MEDRESA_ADMIN_PASSWORD_HASH,process.env.MEDRESA_ADMIN_SESSION_SECRET]) assert.ok(!html.includes(secret));
  const scripts=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src));
  for(const script of scripts) {
    const code=await (await context.request.get(script)).text();
    for(const marker of ['sb_secret_local-analytics-fixture','graph.instagram.com','graph.facebook.com','oauth2.googleapis.com','api.vercel.com/v1/query','medresa_analytics_complete_sync',process.env.MEDRESA_ADMIN_SESSION_SECRET]) assert.ok(!code.includes(marker),'Server code/credential leaked to client chunk');
  }
  assert.deepEqual(errors,[]);console.log('PASS: Analytics production SSR/API authentication/origin protection; all six periods; PostgreSQL persistence after reload; failed/unconfigured sync preserves prior data; missing migration safely disables sync; four SVG charts; touch slider; 44px actions; 360/390/412/430px populated and unavailable states without horizontal overflow; server modules/credentials absent from client chunks. All data/provider calls are explicit local fixtures.');
  await browser.close();await db.close();server.close();await app.close();process.exit(0);
})().catch(e=>{console.error((e.stack||e.message).split('Call log:')[0]);process.exit(1);});
