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
  const adapter=restFixture(db),originalFetch=globalThis.fetch;let missingSchema=false,delay=false,syncRequests=0,websiteFixture=false,websiteDenied=false,websiteOptionalRejected=false,websiteNoHistory=false,instagramFixture=false,instagramDenied=false;const providerCalls=[];
  globalThis.fetch=async(input,init={})=>{
    const address=input instanceof URL?input.href:typeof input==='string'?input:input.url;
    if(address.startsWith(providerHost+'/')) {
      if(missingSchema && address.includes('/medresa_analytics_sync_lock?')) return new Response(JSON.stringify({code:'PGRST205'}),{status:404});
      if(address.includes('/rpc/medresa_analytics_begin_sync')) {syncRequests++;if(delay) await new Promise(r=>setTimeout(r,350));}
      return adapter(address,init);
    }
    // Existing News/public modules are intentionally outside this test and remain unchanged.
    if(new URL(address).hostname.endsWith('supabase.co')) throw new Error('Unexpected remote Supabase request');
    if(instagramFixture && ['api.vercel.com','graph.instagram.com','graph.facebook.com','oauth2.googleapis.com','youtubeanalytics.googleapis.com','www.googleapis.com'].includes(new URL(address).hostname)) {
      const u=new URL(address);providerCalls.push(u.hostname);assert.equal(u.hostname,'graph.facebook.com','Unselected provider called during Instagram-only sync');
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
      if(instagramDenied) return json({error:{code:100,error_subcode:33,type:'OAuthException',message:'Requires instagram_manage_insights permission. local-instagram-browser-fixture raw-private-instagram-response',fbtrace_id:'private-instagram-trace-fixture'}},400);
      if(u.searchParams.get('metric_type')==='time_series') return json({data:[]});
      const metric=u.searchParams.get('metric');
      return json({data:[{name:metric,total_value:metric==='follows_and_unfollows'?{breakdowns:[{results:[{dimension_values:['FOLLOW'],value:0},{dimension_values:['UNFOLLOW'],value:0}]}]}:{value:0}}]});
    }
    if(websiteFixture) {
      const u=new URL(address);
      if(['api.vercel.com','graph.instagram.com','graph.facebook.com','oauth2.googleapis.com','youtubeanalytics.googleapis.com','www.googleapis.com'].includes(u.hostname)) {
        providerCalls.push(u.hostname);
        assert.equal(u.hostname,'api.vercel.com','Unselected provider called during Website-only sync');
        const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
        if(websiteDenied) return json({error:{message:'local-vercel-browser-fixture raw-error-must-stay-hidden'}},403);
        if(u.pathname.startsWith('/v9/projects/')) return json({name:'medresa-me',id:'prj_local_fixture',...(websiteNoHistory?{webAnalytics:{enabledAt:Date.now()-1000,hasData:true}}:{})});
        assert.equal(u.searchParams.get('filter'),"environment eq 'preview' and not startswith(requestPath, '/admin')");
        if(websiteNoHistory) return json({data:[]});
        const by=u.searchParams.get('by');
        if(websiteOptionalRejected&&(by==='day'||by==='referrerHostname')) return json({error:{code:'invalid_odata_filter',message:"Cannot parse 'filter' expression: local-vercel-browser-fixture raw-error-must-stay-hidden"}},400);
        if(by==='environment') return json({data:[{environment:'preview',pageviews:42,visitors:9}]});
        if(by==='day') return json({data:[]});
        return json({data:[{[by]:by==='requestPath'?'/vijesti/local-fixture':'mobile',pageviews:42}]});
      }
    }
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
    for(const name of ['Danas','Juče','7 dana','30 dana','60 dana','90 dana','Osvježi podatke','Test Website']) {
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
  // The actual authenticated production route selects only Website; other tokens
  // are configured deliberately to catch an accidental full-provider refresh.
  const unrelated=async()=>JSON.stringify({
    reports:(await db.query("select * from medresa_analytics_reports where provider<>'website' order by provider,start_date")).rows,
    daily:(await db.query("select * from medresa_analytics_daily where provider<>'website' order by provider,day")).rows,
    states:(await db.query("select * from medresa_analytics_provider_state where provider<>'website' order by provider")).rows,
  });
  const unchanged=await unrelated();await releaseCooldown(db);websiteFixture=true;
  Object.assign(process.env,{VERCEL_ANALYTICS_TOKEN:'local-vercel-browser-fixture',INSTAGRAM_ACCESS_TOKEN:'unused-instagram-browser-fixture',FACEBOOK_PAGE_ACCESS_TOKEN:'unused-facebook-browser-fixture',YOUTUBE_OAUTH_CLIENT_ID:'unused-client-browser-fixture',YOUTUBE_OAUTH_CLIENT_SECRET:'unused-secret-browser-fixture',YOUTUBE_REFRESH_TOKEN:'unused-refresh-browser-fixture'});
  const posted=page.waitForRequest(r=>r.url().endsWith('/api/admin/analytics/sync')&&r.method()==='POST');
  const answered=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();
  const submitted=(await posted).postDataJSON();const scopedId=submitted.requestId;
  assert.deepEqual(Object.keys(submitted).sort(),['period','provider','requestId']);assert.equal(submitted.provider,'website');assert.equal(submitted.period,'30');
  assert.equal(await page.getByRole('button',{name:'Testiram Website…',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Test Instagram',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Osvježi podatke',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'7 dana',exact:true}).isDisabled(),true);
  const scoped=await answered;
  assert.equal(scoped.status(),200);const scopedBody=await scoped.json();
  const website=scopedBody.dashboard.reports.find(r=>r.provider==='website');assert.equal(website.state,'connected');assert.deepEqual(website.totals,{pageviews:42,visitors:9});
  assert.ok(providerCalls.length>=10);assert.ok(providerCalls.every(host=>host==='api.vercel.com'));assert.equal(await unrelated(),unchanged);
  const visibleResult=page.getByRole('status',{name:'Rezultat Website testa',exact:true});
  await visibleResult.getByText('Rezultat sačuvan u Preview Supabase.',{exact:true}).waitFor();
  assert.ok((await visibleResult.innerText()).includes('connected'));assert.ok((await visibleResult.innerText()).includes('Pregledi stranica: 42'));assert.ok((await visibleResult.innerText()).includes(website.range.start));
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  const count=providerCalls.length;
  assert.equal((await context.request.post(origin+'/api/admin/analytics/sync',{headers:{Origin:origin},data:{period:'30',requestId:scopedId,provider:'website'}})).status(),200);assert.equal(providerCalls.length,count);
  const reloaded=await (await context.request.get(origin+'/api/admin/analytics?period=30')).json();assert.deepEqual(reloaded.reports.find(r=>r.provider==='website').totals,website.totals);
  await page.reload();assert.equal((await db.query('select provider,outcome from medresa_analytics_sync_runs where id=$1',[scopedId])).rows[0].outcome,'success');
  const storedWebsite=page.getByRole('region',{name:'Website analitika',exact:true});
  assert.ok((await storedWebsite.innerText()).includes('42'));assert.ok((await storedWebsite.innerText()).includes('Povezano'));
  const cooldownResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();await cooldownResponse;
  await visibleResult.getByText('Sačekajte dvije minute između osvježavanja. Website test nije pokrenut.',{exact:true}).waitFor();assert.equal(providerCalls.length,count);
  assert.ok(!(await visibleResult.innerText()).includes('Pregledi stranica: 42'));
  await releaseCooldown(db);websiteOptionalRejected=true;
  const optionalResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();const optionalBody=await (await optionalResponse).json();
  assert.equal(optionalBody.dashboard.reports.find(r=>r.provider==='website').state,'connected');
  assert.deepEqual(optionalBody.websiteRequests.filter(r=>r.httpStatus===400).map(r=>r.request).sort(),['daily','referrers']);
  await visibleResult.getByText('Rezultat sačuvan u Preview Supabase.',{exact:true}).waitFor();
  assert.match(await visibleResult.innerText(),/Dnevni tok · by=day · HTTP 400/);
  assert.match(await visibleResult.innerText(),/Validacija Vercela: kod invalid_odata_filter · parametri navedeni u odgovoru: filter/);
  assert.match(await visibleResult.innerText(),/Oblik odgovora: error_object · teme navedene u odgovoru: filter_syntax/);
  assert.ok(!(await page.content()).includes('raw-error-must-stay-hidden'));assert.equal(await unrelated(),unchanged);
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  await page.reload();assert.ok((await storedWebsite.innerText()).includes('42'));
  const privateError='never-display-cookie-token-or-credential-fixture';
  await page.route('**/api/admin/analytics/sync',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:privateError})}));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();
  await visibleResult.getByText('Website test nije završen. Sačuvani podaci ostaju dostupni.',{exact:true}).waitFor();
  assert.ok((await visibleResult.innerText()).includes('HTTP: 503'));assert.ok(!(await page.content()).includes(privateError));assert.ok((await storedWebsite.innerText()).includes('42'));
  await page.unroute('**/api/admin/analytics/sync');await releaseCooldown(db);websiteDenied=true;
  const deniedResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();await deniedResponse;
  await visibleResult.getByText('Razlog: Pristup analitici nije odobren (permission_required)',{exact:true}).waitFor();
  assert.ok(!(await visibleResult.innerText()).includes('Pregledi stranica: 42'));assert.ok(!(await page.content()).includes('raw-error-must-stay-hidden'));assert.equal(await unrelated(),unchanged);
  assert.ok(providerCalls.every(host=>host==='api.vercel.com'));
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  await releaseCooldown(db);websiteDenied=false;websiteOptionalRejected=false;websiteNoHistory=true;
  const historyBefore=JSON.stringify((await db.query("select day,metrics,complete from medresa_analytics_daily where provider='website' order by day")).rows);
  const emptyResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Website',exact:true}).tap();const emptyBody=await (await emptyResponse).json();
  assert.equal(emptyBody.dashboard.reports.find(r=>r.provider==='website').state,'connected');
  assert.equal(emptyBody.websiteRequests.find(r=>r.request==='current').httpStatus,200);
  for(const name of ['daily','previous']) assert.deepEqual({status:emptyBody.websiteRequests.find(r=>r.request===name).httpStatus,reason:emptyBody.websiteRequests.find(r=>r.request===name).reason},{status:name==='daily'?200:null,reason:'no_data'});
  await visibleResult.getByText('Rezultat sačuvan u Preview Supabase.',{exact:true}).waitFor();
  assert.match(await visibleResult.innerText(),/Dnevni tok · by=day · HTTP 200/);assert.match(await visibleResult.innerText(),/Nema dostupnih podataka za prethodni period/);
  assert.ok(!(await visibleResult.innerText()).includes('HTTP 400'));assert.match(await visibleResult.innerText(),/Pregledi stranica: — · Posjetioci: —/);
  assert.equal(JSON.stringify((await db.query("select day,metrics,complete from medresa_analytics_daily where provider='website' order by day")).rows),historyBefore);assert.equal(await unrelated(),unchanged);
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  // Actual authenticated route + local fixture proves Instagram cannot call or
  // overwrite the locked Website provider or the other social providers.
  await releaseCooldown(db);instagramFixture=true;process.env.INSTAGRAM_ACCESS_TOKEN='local-instagram-browser-fixture';providerCalls.length=0;
  const nonInstagram=async()=>JSON.stringify({reports:(await db.query("select * from medresa_analytics_reports where provider<>'instagram' order by provider,start_date")).rows,states:(await db.query("select * from medresa_analytics_provider_state where provider<>'instagram' order by provider")).rows,daily:(await db.query("select * from medresa_analytics_daily where provider<>'instagram' order by provider,day")).rows}),locked=await nonInstagram();
  const instagramPost=page.waitForRequest(r=>r.url().endsWith('/api/admin/analytics/sync')&&r.method()==='POST'),instagramResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));
  await page.getByRole('button',{name:'Test Instagram',exact:true}).tap();
  assert.equal((await instagramPost).postDataJSON().provider,'instagram');assert.equal(await page.getByRole('button',{name:'Testiram Instagram…',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Test Website',exact:true}).isDisabled(),true);
  const igBody=await (await instagramResponse).json();assert.equal(igBody.websiteRequests,undefined);assert.equal(igBody.instagramDiagnostic.tokenPresent,true);assert.equal(igBody.instagramDiagnostic.accountId,'1001');assert.equal(igBody.instagramDiagnostic.pageDiscovered,true);assert.equal(igBody.instagramDiagnostic.pageTokenObtained,true);assert.equal(igBody.instagramDiagnostic.userTokenLookup,'empty');assert.equal(igBody.instagramDiagnostic.pageTokenLookup,'success');assert.equal(igBody.instagramDiagnostic.username,'medresacg');assert.equal(igBody.instagramDiagnostic.selectedCredential,'page');assert.equal(igBody.instagramDiagnostic.insightsPermission,'granted');assert.equal(igBody.instagramDiagnostic.differsFromOldLoginId,true);assert.equal(igBody.instagramDiagnostic.insightsAccess,'verified');
  const igResult=page.getByRole('status',{name:'Rezultat Instagram testa',exact:true});await igResult.getByText('Rezultat sačuvan u Preview Supabase.',{exact:true}).waitFor();
  assert.match(await igResult.innerText(),/Token na serveru: da · račun otkriven: da/);assert.match(await igResult.innerText(),/tip: BUSINESS/);assert.match(await igResult.innerText(),/User token lookup: empty/);assert.match(await igResult.innerText(),/Page token lookup: success/);assert.match(await igResult.innerText(),/Page token dobijen: da/);assert.match(await igResult.innerText(),/graph\.facebook\.com\/v26\.0/);assert.match(await igResult.innerText(),/Potvrđen stvarnim Insights odgovorom/);assert.equal(await nonInstagram(),locked);assert.ok(providerCalls.every(host=>host==='graph.facebook.com'));
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  await page.reload();assert.equal((await (await context.request.get(origin+'/api/admin/analytics?period=30')).json()).reports.find(r=>r.provider==='instagram').current.followers,17);assert.equal(await nonInstagram(),locked);
  await releaseCooldown(db);instagramDenied=true;
  const igDeniedResponse=page.waitForResponse(r=>r.url().endsWith('/api/admin/analytics/sync'));await page.getByRole('button',{name:'Test Instagram',exact:true}).tap();const deniedInstagram=await (await igDeniedResponse).json();
  assert.equal(deniedInstagram.instagramDiagnostic.insightsAccess,'denied');await igResult.getByText('Insights pristup: Odbijen od Meta API-ja.',{exact:true}).waitFor();assert.match(await igResult.innerText(),/Meta kod: 100 · podkod: 33/);assert.equal(await nonInstagram(),locked);
  for(const marker of ['local-instagram-browser-fixture','local-instagram-page-browser-fixture','raw-private-instagram-response','private-instagram-trace-fixture']) assert.ok(!JSON.stringify(deniedInstagram).includes(marker)&&!(await page.content()).includes(marker));
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});await fits(width);}
  missingSchema=true;await page.reload();await page.getByText('Historija analitike čeka zasebnu Preview migraciju. News i prijevod ostaju dostupni.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Osvježi podatke',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Test Website',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Test Instagram',exact:true}).isDisabled(),true);
  for(const width of [360,390,412,430]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);}
  const html=await page.content();
  for(const secret of [process.env.SUPABASE_SERVICE_ROLE_KEY,process.env.MEDRESA_ADMIN_PASSWORD_HASH,process.env.MEDRESA_ADMIN_SESSION_SECRET,process.env.VERCEL_ANALYTICS_TOKEN,process.env.INSTAGRAM_ACCESS_TOKEN]) assert.ok(!html.includes(secret));
  const scripts=await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src));
  for(const script of scripts) {
    const code=await (await context.request.get(script)).text();
    // The public Graph hostname is deliberately displayed; helpers, headers and both tokens stay server-only.
    for(const marker of ['sb_secret_local-analytics-fixture','graph.instagram.com','oauth2.googleapis.com','api.vercel.com/v1/query','medresa_analytics_complete_sync','discoverInstagramFacebook','Authorization',process.env.MEDRESA_ADMIN_SESSION_SECRET,process.env.INSTAGRAM_ACCESS_TOKEN,'local-instagram-page-browser-fixture']) assert.ok(!code.includes(marker),'Server code/credential leaked to client chunk');
  }
  assert.deepEqual(errors,[]);console.log('PASS: Analytics production SSR/API authentication/origin protection; all six periods; optional Website-only sync invokes only Vercel despite configured other providers; scoped idempotency; unchanged other provider records; PostgreSQL persistence and Website dashboard after reload; existing full refresh; failed/unconfigured sync preserves prior data; missing migration safely disables sync; four SVG charts; touch slider; 44px actions; 360/390/412/430px populated and unavailable states without horizontal overflow; server modules/credentials absent from client chunks. All data/provider calls are explicit local fixtures.');
  await browser.close();await db.close();server.close();await app.close();process.exit(0);
})().catch(e=>{console.error((e.stack||e.message).split('Call log:')[0]);process.exit(1);});
