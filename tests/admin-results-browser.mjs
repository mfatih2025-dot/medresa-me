import assert from 'node:assert/strict';
import {randomBytes,scryptSync,createHash} from 'node:crypto';
import {existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import http from 'node:http';
import {resultsDatabase,resultsRest,fixtureEnvironment,providerHost,pdfFixture} from './fixtures/results.mjs';
const require=createRequire(resolve('package.json')),next=require('next'),{chromium}=require('playwright');
process.env.NODE_ENV='production';const origin='http://localhost:3215';
(async()=>{
 const db=await resultsDatabase(),objects=new Map(),rest=resultsRest(db,objects),realFetch=globalThis.fetch;
 globalThis.fetch=(input,init={})=>{
  const address=input instanceof URL?input.href:typeof input==='string'?input:input.url;
  if(address.startsWith(providerHost+'/')){
   if(address.includes('/medresa_admin_public_locale_feed'))return Promise.resolve(Response.json([]));
   if(address.includes('/medresa_campaigns'))return Promise.resolve(Response.json([]));
   return rest(address,init);
  }
  if(new URL(address).hostname.endsWith('supabase.co'))throw new Error('Remote writes/connections forbidden by local browser fixture');
  return realFetch(input,init);
 };
 const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
 Object.assign(process.env,fixtureEnvironment,{NEXT_TELEMETRY_DISABLED:'1',MEDRESA_ADMIN_USER:'results-browser-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:randomBytes(48).toString('base64url'),MEDRESA_ADMIN_ORIGIN:origin});
 const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3215});await app.prepare();const server=http.createServer(app.getRequestHandler());await new Promise(r=>server.listen(3215,'localhost',r));
 const browser=await chromium.launch({executablePath:process.env.MEDRESA_TEST_CHROMIUM||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await context.addCookies([{name:'medresa-locale',value:'bs',url:origin}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const hash=b=>createHash('sha256').update(b).digest('hex');
 const tabs=l=>page.getByRole('tab',{name:l.toUpperCase(),exact:true});
 const upload=async(locale,bytes,name=locale+'.pdf')=>{await tabs(locale).click();await page.getByLabel('Odaberi PDF',{exact:true}).setInputFiles({name,mimeType:'application/pdf',buffer:bytes});await page.getByText('PDF je pripremljen. Javna objava ostaje nepromijenjena do objavljivanja rezultata.',{exact:true}).waitFor();};
 const publish=async(locale)=>{await tabs(locale).click();await page.getByRole('button',{name:'OBJAVI '+locale.toUpperCase()+' REZULTATE',exact:true}).click();const confirmation=page.getByRole('dialog',{name:'Objavi rezultate'});await confirmation.waitFor();await confirmation.getByRole('button',{name:'OBJAVI '+locale.toUpperCase()+' REZULTATE',exact:true}).click();await page.getByText('Rezultati za izabrani jezik su objavljeni.',{exact:true}).waitFor();};
 try{
  assert.equal((await context.request.get(origin+'/api/admin/results')).status(),401);assert.equal((await context.request.post(origin+'/api/admin/results/upload',{headers:{Origin:origin},data:{}})).status(),401);assert.equal((await context.request.get(origin+'/api/results/bs')).status(),404);
  await page.goto(origin+'/upis');const resultModule=page.locator('main article section').last();const beforeClasses=await resultModule.locator('*').evaluateAll(xs=>xs.map(e=>e.getAttribute("class")||""));const originalTitle=await resultModule.locator('h2').innerText();assert.ok(originalTitle.includes('2026 - 2027'));
  assert.equal((await context.request.post(origin+'/api/admin/login',{headers:{Origin:origin},data:{user:process.env.MEDRESA_ADMIN_USER,password}})).status(),200);
  assert.equal((await context.request.post(origin+'/api/admin/results/upload',{headers:{Origin:'https://evil.example'},data:{}})).status(),403);
  await page.goto(origin+'/admin/rezultati');await page.getByRole('heading',{name:'Rezultati ispita',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/^OBJAVI (BS|SQ|EN) REZULTATE$/}).isDisabled(),true);
  for(const width of [360,390,412,430,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'Results overflow '+width);const choose=await page.locator('button').filter({hasText:/^Odaberi PDF$/}).boundingBox();assert.ok(choose.height>=44);}
  await page.setViewportSize({width:390,height:844});const pdfs={bs:await pdfFixture('BS local original'),sq:await pdfFixture('SQ local original'),en:await pdfFixture('EN local 5MB original',5*1024*1024)};
  await upload('bs',pdfs.bs,'Bosanski rezultati.pdf');assert.equal((await context.request.get(origin+'/api/results/bs')).status(),404,'Draft must not be public');assert.equal(await page.getByRole('button',{name:/^OBJAVI (BS|SQ|EN) REZULTATE$/}).isEnabled(),true);
  await publish('bs');assert.equal((await context.request.get(origin+'/api/results/sq')).status(),404);assert.equal((await context.request.get(origin+'/api/results/en')).status(),404);
  await upload('sq',pdfs.sq);await upload('en',pdfs.en);assert.equal(await page.getByRole('button',{name:/^OBJAVI (BS|SQ|EN) REZULTATE$/}).isEnabled(),true);await publish('sq');await publish('en');
  const snapshotDir=process.env.MEDRESA_TEST_SCREENSHOT_DIR;if(snapshotDir)mkdirSync(snapshotDir,{recursive:true});
  for(const width of [360,390,412,430,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);if(snapshotDir)await page.screenshot({path:resolve(snapshotDir,'results-admin-'+width+'.png'),fullPage:true});}
  // These are the unchanged existing localized routes, not invented routes.
  for(const [locale,path]of [['bs','/upis'],['sq','/sq/regjistrimi'],['en','/en/admissions']]){
   await page.goto(origin+path);const link=page.locator('main article a[download]');await link.waitFor();assert.equal(await link.getAttribute('href'),'/api/results/'+locale);
   const pdf=await context.request.get(origin+'/api/results/'+locale);assert.equal(pdf.status(),200);assert.equal(hash(await pdf.body()),hash(pdfs[locale]));assert.equal(pdf.headers()['content-type'],'application/pdf');assert.equal(pdf.headers()['transfer-encoding'],'chunked');assert.ok(pdf.headers()['content-disposition'].startsWith('attachment;'));
  }
  await page.goto(origin+'/upis');assert.equal(await resultModule.locator('h2').innerText(),originalTitle);const afterClasses=await resultModule.locator('*').evaluateAll(xs=>xs.map(e=>e.getAttribute("class")||""));assert.deepEqual(afterClasses.map(x=>x.replace(' cursor-default text-left','')),beforeClasses.map(x=>x.replace(' cursor-default text-left','')),'Same module styling after publishing');
  const oldRelease=(await(await context.request.get(origin+'/api/admin/results')).json()).state.published.bs.id;
  await page.goto(origin+'/admin/rezultati');const replacement=await pdfFixture('BS replacement local');await upload('bs',replacement,'Replacement.pdf');assert.equal(hash(await(await context.request.get(origin+'/api/results/bs')).body()),hash(pdfs.bs));
  await tabs('sq').click();await page.getByRole('button',{name:'Ukloni PDF',exact:true}).click();await page.getByText('PDF je uklonjen iz pripreme. Objavljeni rezultati ostaju dostupni.',{exact:true}).waitFor();assert.equal(hash(await(await context.request.get(origin+'/api/results/sq')).body()),hash(pdfs.sq));assert.equal(await page.getByRole('button',{name:/^OBJAVI (BS|SQ|EN) REZULTATE$/}).isDisabled(),true);

  await upload('sq',pdfs.sq,'SQ again.pdf');await publish('bs');assert.equal(hash(await(await context.request.get(origin+'/api/results/bs')).body()),hash(replacement),'New release visible without rebuild/redeployment');assert.notEqual((await(await context.request.get(origin+'/api/admin/results')).json()).state.published.bs.id,oldRelease);
  // Invalid file is rejected after server parsing and leaves the prepared/public sets unchanged.
  await tabs('bs').click();await page.getByLabel('Odaberi PDF',{exact:true}).setInputFiles({name:'disguised.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a pdf')});await page.getByText('Datoteka nije ispravan, nešifrovan PDF bez aktivnog sadržaja.',{exact:true}).waitFor();assert.equal(hash(await(await context.request.get(origin+'/api/results/bs')).body()),hash(replacement));
  for(const src of await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src))){const code=await(await context.request.get(src)).text();assert.ok(!code.includes(process.env.SUPABASE_SERVICE_ROLE_KEY));assert.ok(!code.includes('medresa_results_publish'));}
  assert.equal((await db.query('select count(*)::int n from medresa_results_locale_publications')).rows[0].n,4);assert.equal((await db.query('select count(*)::int n from medresa_admin_articles')).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n,0);assert.deepEqual(errors,[]);
  console.log('PASS: authenticated native-picker PDF upload incl. exact 5 MB; 360/390/412/430/tablet/desktop; real locked Upis module unchanged; BS/SQ/EN route-to-PDF mapping; independent locale publication and replacement without server rebuild; draft removal/invalid PDF preserve publication; streaming bytes; history/security/client secret isolation. Local fixtures ONLY, no remote data.');
 }finally{await context.close();await browser.close();await new Promise(r=>server.close(r));await app.close();await db.close();globalThis.fetch=realFetch;}
})().catch(error=>{console.error(error.stack||String(error));process.exit(1);});
