import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import http from 'node:http';
import { database, reports, begin, finish, releaseCooldown, restFixture, fixtureEnvironment, providerHost, load } from './fixtures/analytics.mjs';
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
      p.totals[p.provider==='website'?'pageviews':'views']=({today:0,yesterday:5,'7':70,'30':300,'60':600,'90':900})[period];
      if(p.provider==='website') {p.totals.visitors=3;p.previousTotals.visitors=2;}
      if(p.provider==='instagram') for(const day of p.daily) day.metrics.reach=8;
      p.today={date:p.todayDate,metrics:p.provider==='website'?{pageviews:0,visitors:0}:{views:0,reach:0,interactions:0},complete:false};
      p.yesterday={date:new Date(Date.parse(p.todayDate)-86400000).toISOString().slice(0,10),metrics:p.provider==='website'?{pageviews:10,visitors:2}:{views:10,reach:9,interactions:2},complete:true};
      p.topContent=[{label:'Dugi stvarni naziv sadržaja za provjeru prijeloma na mobilnim ekranima '.repeat(2),value:42,url:null,basis:'period'}];
    }
    await finish(db,id,r);
  }
  await releaseCooldown(db);
  const adapter=restFixture(db),originalFetch=globalThis.fetch;let missingSchema=false,delay=false,syncRequests=0,youtubeDenied=false,outage=false;const providerCalls=[];
  globalThis.fetch=async(input,init={})=>{
    const address=input instanceof URL?input.href:typeof input==='string'?input:input.url;
    if(address.startsWith(providerHost+'/')) {
      if(missingSchema && address.includes('/medresa_analytics_sync_lock?')) return new Response(JSON.stringify({code:'PGRST205'}),{status:404});
      if(address.includes('/rpc/medresa_analytics_begin_sync')) {syncRequests++;if(delay) await new Promise(r=>setTimeout(r,350));}
      return adapter(address,init);
    }
    // Existing News/public modules are intentionally outside this test and remain unchanged.
    if(new URL(address).hostname.endsWith('supabase.co')) throw new Error('Unexpected remote Supabase request');
    if(outage && ['api.vercel.com','graph.facebook.com','oauth2.googleapis.com','youtubeanalytics.googleapis.com','www.googleapis.com'].includes(new URL(address).hostname)) return new Response(JSON.stringify({error:{message:'raw-private-provider-response'}}),{status:503});
    if(['oauth2.googleapis.com','youtubeanalytics.googleapis.com','www.googleapis.com'].includes(new URL(address).hostname)) {
      const u=new URL(address);providerCalls.push(u.hostname);assert.ok(['oauth2.googleapis.com','www.googleapis.com','youtubeanalytics.googleapis.com'].includes(u.hostname),'Unexpected Google host');
      const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
      if(u.hostname==='oauth2.googleapis.com') {
        const body=new URLSearchParams(init.body);assert.equal(body.get('client_id'),'local-youtube-client-browser-fixture');assert.equal(body.get('client_secret'),'private-youtube-client-browser-fixture');assert.equal(body.get('refresh_token'),'private-youtube-refresh-browser-fixture');
        return youtubeDenied?json({error:'invalid_grant',error_description:'private-youtube-refresh-browser-fixture raw-private-youtube-response'},400):json({access_token:'private-youtube-access-browser-fixture'});
      }
      assert.equal(new Headers(init.headers).get('Authorization'),'Bearer private-youtube-access-browser-fixture');assert.ok(!u.searchParams.has('access_token'));
      if(u.pathname.endsWith('/channels')) {assert.equal(u.searchParams.get('mine'),'true');assert.ok(!u.searchParams.has('id'));return json({items:[{id:'UC'+'a'.repeat(22),statistics:{subscriberCount:'31'}}]});}
      const dimension=u.searchParams.get('dimensions'),metrics=['views','estimatedMinutesWatched','subscribersGained','subscribersLost'];
      return json({columnHeaders:[...(dimension?[{name:dimension}]:[]),...metrics.map(name=>({name}))],rows:dimension==='day'?load('src/admin/analytics/period').days({start:u.searchParams.get('startDate'),end:u.searchParams.get('endDate')}).map(day=>[day,1,0.5,0,0]):dimension==='video'?[]:[[30,15,0,0]]});
    }
    if(new URL(address).hostname==='graph.facebook.com' && ['Bearer local-facebook-browser-fixture','Bearer local-facebook-page-browser-fixture'].includes(new Headers(init.headers).get('Authorization'))) {
      const u=new URL(address),auth=new Headers(init.headers).get('Authorization');providerCalls.push('facebook');assert.equal(u.hostname,'graph.facebook.com');assert.ok(!u.searchParams.has('access_token'));
      const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
      if(u.pathname.includes('/me/') || u.searchParams.get('fields')==='id,access_token') assert.equal(auth,'Bearer local-facebook-browser-fixture');
      else assert.equal(auth,'Bearer local-facebook-page-browser-fixture','Facebook calls must use its returned Page token');
      if(u.searchParams.get('fields')==='id,access_token') return json({id:'578640758657974',access_token:'local-facebook-page-browser-fixture'});
      if(u.pathname.endsWith('/me/permissions')) return json({data:[{permission:'read_insights',status:'granted'},{permission:'pages_read_engagement',status:'granted'},{permission:'pages_show_list',status:'granted'}]});
      if(u.pathname.endsWith('/me/accounts')) return json({data:[{id:'578640758657974',tasks:['ANALYZE','MANAGE']}]});
      if(u.searchParams.get('fields')==='followers_count') return json({followers_count:23});
      if(u.pathname.endsWith('/published_posts')) return json({data:[]});
      assert.ok(u.pathname.endsWith('/578640758657974/insights'));assert.equal(u.searchParams.get('period'),'day');
      // Local official-shaped daily aggregates only; no live provider calls/data.
      const start=Number(u.searchParams.get('since'))*1000,end=Number(u.searchParams.get('until'))*1000,values=[];
      for(let day=start;day<end;day+=86400000) values.push({end_time:new Date(day+86400000).toISOString(),value:0});
      return json({data:[{name:u.searchParams.get('metric'),values}]});
    }
    if(new URL(address).hostname==='graph.facebook.com' && ['Bearer local-instagram-browser-fixture','Bearer local-instagram-page-browser-fixture'].includes(new Headers(init.headers).get('Authorization'))) {
      const u=new URL(address);providerCalls.push('instagram');assert.equal(u.hostname,'graph.facebook.com');
      const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
      const auth=new Headers(init.headers).get('Authorization');assert.ok(!u.searchParams.has('access_token'));
      if(u.pathname.includes('/me/')) assert.equal(auth,'Bearer local-instagram-browser-fixture');
      if(u.pathname.endsWith('/me/permissions')) return json({data:[{permission:'instagram_manage_insights',status:'granted'},{permission:'instagram_basic',status:'granted'}]});
      if(u.pathname.endsWith('/me/accounts')) {assert.equal(u.searchParams.get('fields'),'id,access_token,tasks');return json({data:[{id:'578640758657974',access_token:'local-instagram-page-browser-fixture',tasks:['ANALYZE','MANAGE']}]});}
      if(u.searchParams.get('fields')==='instagram_business_account') {assert.ok(['Bearer local-instagram-browser-fixture','Bearer local-instagram-page-browser-fixture'].includes(auth));return auth==='Bearer local-instagram-page-browser-fixture'?json({id:'578640758657974',instagram_business_account:{id:'1001'}}):json({id:'578640758657974'});}
      assert.equal(auth,'Bearer local-instagram-page-browser-fixture');
      if(u.searchParams.get('fields')==='id,username,account_type') return json({id:'1001',username:'medresacg',account_type:'BUSINESS'});
      if(u.searchParams.get('fields')==='followers_count') return json({followers_count:17});
      if(u.pathname.endsWith('/media')) return json({data:[]});
      if(u.searchParams.get('metric_type')==='time_series') return json({data:[]});
      const metric=u.searchParams.get('metric');
      return json({data:[{name:metric,total_value:metric==='follows_and_unfollows'?{breakdowns:[{results:[{dimension_values:['FOLLOW'],value:0},{dimension_values:['UNFOLLOW'],value:0}]}]}:{value:0}}]});
    }
    if(new URL(address).hostname==='api.vercel.com') {
      const u=new URL(address);
      if(['api.vercel.com','graph.instagram.com','graph.facebook.com','oauth2.googleapis.com','youtubeanalytics.googleapis.com','www.googleapis.com'].includes(u.hostname)) {
        providerCalls.push(u.hostname);
        assert.equal(u.hostname,'api.vercel.com','Website uses the official Vercel host');
        const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
        if(u.pathname.startsWith('/v9/projects/')) return json({name:'medresa-me',id:'prj_local_fixture'});
        assert.equal(u.searchParams.get('filter'),"environment eq 'preview' and not startswith(requestPath, '/admin')");
        const by=u.searchParams.get('by');
        if(by==='environment') return json({data:[{environment:'preview',pageviews:42,visitors:9}]});
        if(by==='day') return json({data:[]});
        return json({data:[{[by]:by==='requestPath'?'/vijesti/local-fixture':'mobile',pageviews:42}]});
      }
    }
    return originalFetch(input,init);
  };
  const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
  Object.assign(process.env,fixtureEnvironment,{NEXT_TELEMETRY_DISABLED:'1',MEDRESA_ADMIN_USER:'analytics-browser-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:randomBytes(48).toString('base64url'),MEDRESA_ADMIN_ORIGIN:origin,
    VERCEL_ANALYTICS_TOKEN:'local-vercel-browser-fixture',INSTAGRAM_ACCESS_TOKEN:'local-instagram-browser-fixture',FACEBOOK_PAGE_ACCESS_TOKEN:'local-facebook-browser-fixture',YOUTUBE_OAUTH_CLIENT_ID:'local-youtube-client-browser-fixture',YOUTUBE_OAUTH_CLIENT_SECRET:'private-youtube-client-browser-fixture',YOUTUBE_REFRESH_TOKEN:'private-youtube-refresh-browser-fixture'});
  delete process.env.YOUTUBE_CHANNEL_ID;
  const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3213});await app.prepare();
  const server=http.createServer(app.getRequestHandler());await new Promise(r=>server.listen(3213,'localhost',r));
  const browser=await chromium.launch({executablePath:process.env.MEDRESA_TEST_CHROMIUM||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const snapshot=async(table,order)=>JSON.stringify((await db.query(`select * from ${table} order by ${order}`)).rows);
  const savedHistory=JSON.parse(await snapshot('medresa_analytics_sync_runs','id'));
  assert.ok([302,307].includes((await context.request.get(origin+'/admin/analitika',{maxRedirects:0})).status()));
  assert.equal((await context.request.get(origin+'/api/admin/analytics')).status(),401);
  assert.equal((await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:origin},data:{period:'30',requestId:randomUUID()}})).status(),401);
  assert.equal((await context.request.post(origin+'/api/admin/login',{headers:{Origin:origin},data:{user:process.env.MEDRESA_ADMIN_USER,password}})).status(),200);
  assert.equal((await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:'https://evil.invalid'},data:{period:'30',requestId:randomUUID()}})).status(),403);
  await page.goto(origin+'/admin/analitika');await page.getByRole('heading',{name:'Analitika',exact:true}).waitFor();
  const clean=async()=>{
    const text=await page.locator('main').innerText();
    for(const removed of ['Test Website','Test Instagram','Test Facebook','Test YouTube','Preview','HTTP','OAuth','Potrebne dozvole','Historijski baseline','Javni tracker','read_insights','instagram_manage_insights','youtube.readonly','Detalji greške','Provjeri status']) assert.ok(!text.includes(removed),removed+' remains in normal UI');
    for(const name of ['Test Website','Test Instagram','Test Facebook','Test YouTube','Provjeri Preview vezu']) assert.equal(await page.getByRole('button',{name,exact:true}).count(),0);
    assert.equal(await page.locator('main pre').count(),0);assert.ok(!text.includes('NaN')&&!text.includes('Infinity'));
  };
  const fits=async(width)=>{
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'Analytics overflow '+width);
    for(const name of ['Danas','Juče','7 dana','30 dana','60 dana','90 dana','Osvježi podatke']) {const box=await page.getByRole('button',{name,exact:true}).boundingBox();assert.ok(box.height>=44&&box.width>=44,name+' touch target '+width);}
    for(const slider of await page.getByRole('slider').all()) assert.ok((await slider.boundingBox()).height>=52);
    for(const svg of await page.locator('svg[role="img"]').all()) assert.ok((await svg.boundingBox()).height>=190,'Charts need readable plot height');
    assert.ok(await page.getByTestId('period-views').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=52));
    await clean();
  };
  assert.equal(await page.getByRole('button',{name:'30 dana',exact:true}).getAttribute('aria-pressed'),'true');
  for(const width of [360,390,412,430]) {
    await page.setViewportSize({width,height:900});await fits(width);
    for(const name of ['7 dana','Danas','Juče','60 dana','90 dana','30 dana']) {
      const response=page.waitForResponse(r=>r.url().includes('/api/admin/analytics?period='));await page.getByRole('button',{name,exact:true}).tap();await response;await page.waitForFunction(()=>document.querySelector('[aria-busy="false"]'));await fits(width);
      assert.equal(await page.getByTestId('period-views').textContent(),({'7 dana':'280',Danas:'0','Juče':'20','60 dana':'2.400','90 dana':'3.600','30 dana':'1.200'})[name]);
    }
    assert.equal(await page.locator('svg[role="img"]').count(),4);
    const slider=page.getByRole('slider',{name:'Odaberi dan · Website',exact:true});await slider.tap();await slider.press('Home');await slider.press('ArrowRight');assert.equal(await slider.inputValue(),'1');
    if(process.env.MEDRESA_TEST_SCREENSHOT_DIR) {
      await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'analytics-'+width+'.png'),fullPage:false});
      await page.locator('#daily-overview').screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'analytics-daily-'+width+'.png')});
      await page.locator('#analytics-website').screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'analytics-website-'+width+'.png')});
    }
  }
  const refresh=async()=>{
    const posted=page.waitForRequest(r=>r.url().endsWith('/api/admin/analytics/sync')&&r.method()==='POST');const answered=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
    await page.getByRole('button',{name:'Osvježi podatke',exact:true}).tap();const request=(await posted).postDataJSON();assert.deepEqual(Object.keys(request).sort(),['period','requestId']);assert.equal(request.period,'30');
    const response=await answered;assert.equal(response.status(),200);const body=await response.json();await page.getByRole('button',{name:'Osvježi podatke',exact:true}).waitFor();await clean();return {body,request};
  };
  delay=true;const firstPromise=refresh();await page.getByRole('button',{name:'Osvježavam podatke…',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Osvježavam podatke…',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'7 dana',exact:true}).isDisabled(),true);
  const {body:first,request:firstRequest}=await firstPromise;
  assert.equal(syncRequests,1);assert.ok(first.dashboard.reports.every(r=>r.state==='connected'),JSON.stringify(first.dashboard.reports.map(r=>({provider:r.provider,state:r.state,reason:r.reason}))));
  assert.equal(first.dashboard.history.find(r=>r.id===first.runId).outcome,'success');
  for(const provider of ['api.vercel.com','instagram','facebook','oauth2.googleapis.com','youtubeanalytics.googleapis.com']) assert.ok(providerCalls.includes(provider),provider+' was not invoked by normal refresh');
  assert.equal(first.dashboard.reports[0].totals.pageviews,42);assert.equal(first.dashboard.reports[0].totals.visitors,9);assert.equal(first.dashboard.reports[1].current.followers,17);assert.equal(first.dashboard.reports[2].current.followers,23);assert.equal(first.dashboard.reports[3].current.subscribers,31);assert.equal(first.dashboard.reports[3].totals.views,30);assert.equal(first.dashboard.reports[3].totals.watchMinutes,15);
  assert.equal(await page.getByTestId('period-views').textContent(),'72','Native refresh: 42 website + 0 IG + 0 FB + 30 YouTube');
  for(const key of ['websiteDiagnostic','instagramDiagnostic','facebookDiagnostic','youtubeDiagnostic']) assert.equal(first[key],undefined);
  const persisted=await(await context.request.get(origin+'/api/admin/analytics?period=30')).json();assert.deepEqual(persisted.reports.map(r=>r.totals),first.dashboard.reports.map(r=>r.totals));
  const historyAfter=JSON.parse(await snapshot('medresa_analytics_sync_runs','id'));for(const old of savedHistory) assert.deepEqual(historyAfter.find(r=>r.id===old.id),old,'Existing run history was changed');
  const storedPeriods=(await db.query("select count(*) as count from medresa_analytics_reports where start_date<>$1",[first.dashboard.reports[0].range.start])).rows[0].count;assert.ok(storedPeriods>=16,'Older period snapshots must remain available');
  const calls=providerCalls.length;const repeated=await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:origin},data:firstRequest});assert.equal(repeated.status(),200);assert.equal(providerCalls.length,calls,'Idempotent request must not fetch providers again');
  await page.reload();await page.getByRole('heading',{name:'Analitika',exact:true}).waitFor();
  const inert=await browser.newContext({viewport:{width:430,height:900},javaScriptEnabled:false});await inert.addCookies(await context.cookies());const serverPage=await inert.newPage();await serverPage.goto(origin+'/admin/analitika');
  const leafText=p=>p.locator('main').evaluate(root=>{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),out=[];while(walker.nextNode()){const text=walker.currentNode.textContent.trim();if(text)out.push(text);}return out;});assert.deepEqual(await leafText(page),await leafText(serverPage),'Server/client analytics text must agree');await inert.close();
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  for(const width of [768,1024,1440]) {await page.setViewportSize({width,height:1000});await fits(width);if(process.env.MEDRESA_TEST_SCREENSHOT_DIR){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'analytics-'+width+'.png'),fullPage:false});}}
  // A failing provider preserves its saved aggregates while other providers refresh.
  const ytBefore=JSON.stringify((await db.query("select * from medresa_analytics_reports where provider='youtube' order by start_date")).rows);
  await releaseCooldown(db);youtubeDenied=true;const {body:partial}=await refresh();assert.equal(partial.dashboard.history.find(r=>r.id===partial.runId).outcome,'partial');assert.ok(partial.dashboard.reports.filter(r=>r.provider!=='youtube').every(r=>r.state==='connected'));assert.equal(partial.dashboard.reports[3].state,'permission_required');assert.equal(partial.dashboard.reports[3].totals.views,30);assert.equal(JSON.stringify((await db.query("select * from medresa_analytics_reports where provider='youtube' order by start_date")).rows),ytBefore);youtubeDenied=false;
  const reportsBefore=await snapshot('medresa_analytics_reports','provider,start_date,end_date'),dailyBefore=await snapshot('medresa_analytics_daily','provider,day');
  await releaseCooldown(db);outage=true;const {body:failed}=await refresh();assert.ok(failed.dashboard.reports.every(r=>r.state==='temporarily_unavailable'));assert.equal(await snapshot('medresa_analytics_reports','provider,start_date,end_date'),reportsBefore);assert.equal(await snapshot('medresa_analytics_daily','provider,day'),dailyBefore);outage=false;
  // A running external worker updates the page through GET polling, never another sync.
  await releaseCooldown(db);const externalId=randomUUID();await begin(db,externalId,'30');await page.reload();assert.equal(await page.getByRole('button',{name:'Osvježi podatke',exact:true}).isDisabled(),true);
  const requestsBefore=syncRequests,providerReadsBefore=providerCalls.length;await finish(db,externalId,first.dashboard.reports);await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Osvježi podatke'&&!b.disabled),{},{timeout:15000});assert.equal(syncRequests,requestsBefore);assert.equal(providerCalls.length,providerReadsBefore);
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  missingSchema=true;await page.reload();await page.getByText('Historija analitike trenutno nije dostupna.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Osvježi podatke',exact:true}).isDisabled(),true);await clean();
  const secretMarkers=[process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.MEDRESA_ADMIN_PASSWORD_HASH,process.env.MEDRESA_ADMIN_SESSION_SECRET,process.env.VERCEL_ANALYTICS_TOKEN,process.env.INSTAGRAM_ACCESS_TOKEN,process.env.FACEBOOK_PAGE_ACCESS_TOKEN,process.env.YOUTUBE_OAUTH_CLIENT_SECRET,process.env.YOUTUBE_REFRESH_TOKEN,'private-youtube-access-browser-fixture','local-instagram-page-browser-fixture','local-facebook-page-browser-fixture','raw-private-provider-response','raw-private-youtube-response'];
  for(const marker of secretMarkers) assert.ok(!JSON.stringify([first,partial,failed]).includes(marker)&&!(await page.content()).includes(marker),'Secret/raw error exposed');
  for(const script of await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src))) {const code=await(await context.request.get(script)).text();for(const marker of [...secretMarkers,'medresa_analytics_complete_sync','discoverInstagramFacebook','facebookGraph','youtubeJson','Test Website','Test Instagram','Test Facebook','Test YouTube']) assert.ok(!code.includes(marker),'Server/setup code leaked to client chunk');}
  assert.deepEqual(errors,[]);console.log('PASS: clean normal Analytics UI; authenticated full four-provider refresh through production Next handlers; native metric persistence/reload; history and older periods retained; idempotency; partial/total outage preserves saved aggregates; GET-only running-status polling; six periods/charts/touch targets; 360/390/412/430px without overflow; no setup controls, raw errors or secrets in UI/client chunks. Explicit local PostgreSQL/provider fixtures only, not live provider verification.');
  await browser.close();await db.close();server.close();await app.close();process.exit(0);
})().catch(e=>{console.error((e.stack||e.message).split('Call log:')[0]);process.exit(1);});
