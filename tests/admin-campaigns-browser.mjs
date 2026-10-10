import assert from 'node:assert/strict';
import { randomBytes, scryptSync, createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import http from 'node:http';
import sharp from 'sharp';
import { campaignDatabase, campaignRest, fixtureEnvironment, providerHost } from './fixtures/campaigns.mjs';
const require=createRequire(resolve('package.json')),next=require('next'),{chromium}=require('playwright');
process.env.NODE_ENV='production';
const origin='http://localhost:3214';
// Structural solid-pixel fixtures ONLY. No invented campaign is sent to Preview.
(async()=>{
  const db=await campaignDatabase(),objects=new Map(),adapter=campaignRest(db,objects),realFetch=globalThis.fetch;
  let missing=false;
  globalThis.fetch=async(input,init={})=>{
    const address=input instanceof URL?input.href:typeof input==='string'?input:input.url;
    if(address.startsWith(providerHost+'/')) {
      if(missing)return new Response(JSON.stringify({code:'42P01'}),{status:503});
      if(address.includes('/medresa_admin_public_locale_feed'))return Response.json([]);
      return adapter(address,init);
    }
    if(new URL(address).hostname.endsWith('supabase.co'))throw new Error('Unexpected remote project');
    return realFetch(input,init);
  };
  const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
  Object.assign(process.env,fixtureEnvironment,{NEXT_TELEMETRY_DISABLED:'1',MEDRESA_ADMIN_USER:'campaign-browser-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:randomBytes(48).toString('base64url'),MEDRESA_ADMIN_ORIGIN:origin});
  const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3214});await app.prepare();
  const server=http.createServer(app.getRequestHandler());await new Promise(r=>server.listen(3214,'localhost',r));
  const browser=await chromium.launch({executablePath:process.env.MEDRESA_TEST_CHROMIUM||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,timezoneId:'America/New_York'});await context.addCookies([{name:'medresa-locale',value:'bs',url:origin}]);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const png=await sharp({create:{width:600,height:900,channels:3,background:'#123c31'}}).png().toBuffer();
  const dialog=page.getByRole('dialog',{name:'Obavijest Medrese'});
  const save=async()=>{await page.getByRole('button',{name:'Sačuvaj akciju',exact:true}).click();await page.getByText('Akcija je sačuvana.',{exact:true}).waitFor();};
  const current=async()=> (await (await context.request.get(origin+'/api/campaigns/current?locale=bs')).json()).campaign;
  const fillTranslations=async()=>{for(const [locale,text,link]of [['SQ','SQ fixture','/sq/regjistrimi'],['EN','EN fixture','/en/admissions']]){await page.getByRole('tab',{name:new RegExp('^'+locale)}).click();await page.getByLabel('Tekst dugmeta').fill(text);await page.getByLabel('Link',{exact:true}).fill(link);}await page.getByRole('tab',{name:/^BS/}).click();};
  const adminRows=async()=> (await(await context.request.get(origin+'/api/admin/campaigns')).json()).campaigns;
  const directSave=async(c,change)=>{
    const body={id:c.id,revision:c.revision,name:c.name,posterId:c.poster?.id??null,ctaText:c.ctaText,ctaLink:c.ctaLink,content:c.content,active:c.active,startsAt:c.startsAt,endsAt:c.endsAt,...change,localeActive:change.localeActive??(change.active===false?{bs:false,sq:false,en:false}:c.localeActive)};
    if(change.ctaText)body.content={...body.content,bs:{...body.content.bs,text:change.ctaText}};
    const res=await context.request.post(origin+'/api/admin/campaigns',{headers:{Origin:origin},data:body});assert.ok(res.ok(),await res.text());return (await res.json()).campaign;
  };
  try {
    assert.ok([302,307].includes((await context.request.get(origin+'/admin/akcije',{maxRedirects:0})).status()));
    assert.equal((await context.request.get(origin+'/api/admin/campaigns')).status(),401);
    assert.equal((await context.request.post(origin+'/api/admin/campaigns',{headers:{Origin:origin},data:{}})).status(),401);
    assert.equal((await context.request.post(origin+'/api/admin/campaigns/assets',{headers:{Origin:origin,'Content-Type':'image/png'},data:png})).status(),401);
    assert.equal((await context.request.post(origin+'/api/admin/login',{headers:{Origin:origin},data:{user:process.env.MEDRESA_ADMIN_USER,password}})).status(),200);
    assert.equal((await context.request.post(origin+'/api/admin/campaigns',{headers:{Origin:'https://evil.invalid'},data:{}})).status(),403);
    await page.goto(origin+'/historijat');await page.waitForFunction(()=>document.fonts.status==='loaded');
    assert.equal(await dialog.count(),0);assert.equal(await current(),null);
    const publicBaseline=await page.locator('main').boundingBox();
    await page.goto(origin+'/admin/akcije');await page.getByRole('heading',{name:'Akcije',exact:true}).waitFor();assert.ok((await page.locator('main').innerText()).includes('Trenutno nema akcija.'));
    await page.getByRole('button',{name:'Nova akcija',exact:true}).click();
    for (const width of [360,390,412,430]) { await page.setViewportSize({width,height:844}); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'Admin form overflow '+width); }
    await page.setViewportSize({width:390,height:844});
    await page.getByLabel('Početak prikazivanja').fill('2000-01-01T10:00');await page.getByLabel('Naziv akcije').fill('Internal fixture name never public');await page.getByLabel('Link',{exact:true}).fill('/upis?fixture=exact#destination');
    await page.getByLabel('Odaberi sliku',{exact:true}).setInputFiles({name:'structural-fixture.png',mimeType:'image/png',buffer:png});
    await page.getByAltText('Odabrani poster').waitFor();await save();assert.equal(await current(),null);
    let first=(await adminRows())[0];const originalAsset=first.poster.id;assert.equal(Date.parse(first.startsAt),Date.parse('2000-01-01T15:00:00Z'),'Browser-local input persists as the correct UTC instant');
    assert.equal(createHash('sha256').update(await(await context.request.get(origin+first.poster.src)).body()).digest('hex'),createHash('sha256').update(png).digest('hex'));
    await page.getByRole('button',{name:'Uredi',exact:true}).first().click();await page.getByLabel('Status',{exact:true}).selectOption('active');await save();first=(await adminRows())[0];assert.equal((await current()).id,first.id);for(const l of ['sq','en'])assert.equal((await(await context.request.get(origin+'/api/campaigns/current?locale='+l)).json()).campaign,null);await page.goto(origin+'/sq/historiku');await page.waitForTimeout(250);assert.equal(await dialog.count(),0,'BS active popup never appears on SQ');await page.goto(origin+'/en/history');await page.waitForTimeout(250);assert.equal(await dialog.count(),0,'BS active popup never appears on EN');await page.goto(origin+'/admin/akcije');await page.getByRole('button',{name:'Uredi',exact:true}).first().click();await fillTranslations();await page.getByLabel('Status',{exact:true}).selectOption('active');await page.getByLabel('Tekst dugmeta').fill('SAZNAJ VIŠE');await save();first=(await adminRows())[0];assert.equal((await current()).id,first.id);
    await page.getByRole('button',{name:'Provjeri prikaz',exact:true}).first().click();await page.getByText('Akcija je spremna za prikaz nakon izbora jezika.',{exact:true}).waitFor();
    await page.goto(origin+'/historijat');await dialog.waitFor();await page.waitForFunction(()=>document.fonts.status==='loaded');
    assert.ok(!(await dialog.innerText()).includes(first.name));assert.equal(await dialog.locator('a').getAttribute('href'),'/upis?fixture=exact#destination');
    assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
    const lockedScroll=await page.evaluate(()=>window.scrollY);await page.mouse.wheel(0,300);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.scrollY),lockedScroll,'Background user scrolling blocked');
    const during=await page.locator('main').boundingBox();assert.ok(Math.abs(during.x-publicBaseline.x)<1 && Math.abs(during.width-publicBaseline.width)<1,'Popup must not shift page layout');
    const screenshotDir=process.env.MEDRESA_TEST_SCREENSHOT_DIR;if(screenshotDir)mkdirSync(screenshotDir,{recursive:true});
    for(const width of [360,390,412,430,768,1024,1440]) {
      await page.setViewportSize({width,height:width>=768?900:844});
      const img=dialog.locator('img');await img.evaluate(el=>el.decode());const imageBox=await img.boundingBox(),closeBox=await dialog.getByRole('button',{name:'Zatvori obavijest'}).boundingBox(),ctaBox=await dialog.locator('a').boundingBox();
      assert.ok(closeBox.width>=44 && closeBox.height>=44);assert.ok(ctaBox.height>=44);assert.ok(Math.abs(imageBox.width/imageBox.height-600/900)<0.01,'Original aspect ratio '+width);
      assert.ok(closeBox.y>=0 && ctaBox.y+ctaBox.height<=(width>=768?900:844),'Complete composition accessible '+width);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'No overflow '+width);
      assert.equal(await img.evaluate(el=>getComputedStyle(el).objectFit),'contain');
      if(screenshotDir)await page.screenshot({path:resolve(screenshotDir,`campaign-${width}.png`)});
    }
    await page.keyboard.press('Tab');assert.equal(await dialog.locator('a').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await dialog.getByRole('button').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),`medresa.campaign.dismissed.${first.id}.v${first.revision}`),'1');
    await page.reload();assert.equal(await dialog.count(),0);await page.goto(origin+'/upis');assert.equal(await dialog.count(),0);
    // Editing the same ID changes its version; new campaign is independently dismissible.
    first=await directSave(first,{ctaText:'Updated fixture CTA'});await page.goto(origin+'/historijat');await dialog.waitFor();await page.mouse.click(2,2);await dialog.waitFor({state:'detached'});
    // Poster replacement and removal keep original uploads/history private and intact.
    await page.goto(origin+'/admin/akcije');await page.getByRole('button',{name:'Uredi',exact:true}).first().click();
    const landscape=await sharp({create:{width:1200,height:600,channels:3,background:'#b39961'}}).png().toBuffer();
    await page.getByLabel('Odaberi sliku',{exact:true}).setInputFiles({name:'landscape-fixture.png',mimeType:'image/png',buffer:landscape});await page.getByAltText('Odabrani poster').waitFor();await save();first=(await adminRows())[0];assert.notEqual(first.poster.id,originalAsset);
    await page.goto(origin+'/historijat');await dialog.waitFor();await dialog.locator('img').evaluate(el=>el.decode());assert.ok(Math.abs((await dialog.locator('img').boundingBox()).width/(await dialog.locator('img').boundingBox()).height-2)<0.01);const exactHref=await dialog.locator('a').getAttribute('href'); await Promise.all([page.waitForURL(origin+exactHref),dialog.locator('a').click()]); assert.equal(page.url(),origin+exactHref);
    first=await directSave(first,{active:false});assert.equal(await current(),null);
    await page.goto(origin+'/admin/akcije');await page.getByRole('button',{name:'Uredi',exact:true}).first().click();await page.getByRole('button',{name:'Ukloni',exact:true}).click();assert.equal(await page.getByAltText('Odabrani poster').count(),0);await save();first=(await adminRows())[0];assert.equal(first.poster,null);assert.equal(objects.size,2);
    await page.getByRole('button',{name:'Nova akcija',exact:true}).click();await page.getByLabel('Naziv akcije').fill('Second internal fixture');await page.getByLabel('Link',{exact:true}).fill('/donacije');await page.getByLabel('Odaberi sliku',{exact:true}).setInputFiles({name:'new-fixture.png',mimeType:'image/png',buffer:png});await page.getByAltText('Odabrani poster').waitFor();await fillTranslations();await page.getByLabel('Status',{exact:true}).selectOption('active');await save();
    let second=(await adminRows()).find(c=>c.id!==first.id);await page.goto(origin+'/historijat');await dialog.waitFor();assert.equal(await dialog.locator('a').getAttribute('href'),'/donacije');assert.equal((await current()).id,second.id);
    for (const [width,height] of [[600,1800],[800,800]]) {
      const bytes=await sharp({create:{width,height,channels:3,background:'#123c31'}}).png().toBuffer();
      const uploaded=await context.request.post(origin+'/api/admin/campaigns/assets',{headers:{Origin:origin,'Content-Type':'image/png'},data:bytes});assert.equal(uploaded.status(),201);
      second=await directSave(second,{posterId:(await uploaded.json()).poster.id});
      await page.setViewportSize({width:390,height:844});await page.goto(origin+'/historijat');await dialog.waitFor();await dialog.locator('img').evaluate(el=>el.decode());
      const artwork=await dialog.locator('img').boundingBox(),cta=await dialog.locator('a').boundingBox();assert.ok(Math.abs(artwork.width/artwork.height-width/height)<0.01);assert.ok(cta.y+cta.height<=844);
      await dialog.getByRole('button').click();await dialog.waitFor({state:'detached'});
    }
    second=await directSave(second,{ctaText:'SAZNAJ VIŠE'});
    await page.route('**/api/campaigns/poster/*',route=>route.abort());await page.reload();await page.waitForTimeout(500);
    assert.equal(await dialog.count(),0,'Image failure never exposes a blank dialog');assert.equal(await page.evaluate(key=>localStorage.getItem(key),`medresa.campaign.dismissed.${second.id}.v${second.revision}`),null,'Image failure is not visitor dismissal');
    await page.unroute('**/api/campaigns/poster/*');await page.reload();await dialog.waitFor();await dialog.getByRole('button').click();
    second=await directSave(second,{startsAt:new Date(Date.now()+2000).toISOString(),endsAt:new Date(Date.now()+5000).toISOString()});
    await page.reload();assert.equal(await current(),null);const restoreTarget=page.locator('header a:visible').first();await restoreTarget.focus();assert.equal(await restoreTarget.evaluate(el=>el===document.activeElement),true,'Visible restore target focused before scheduled popup');await dialog.waitFor({timeout:10000});await dialog.waitFor({state:'detached',timeout:10000});await page.waitForFunction(el=>el===document.activeElement,await restoreTarget.elementHandle(),{timeout:2000});assert.equal(await current(),null,'Expired never appears');
    // Failed DB/Storage readiness is fail-safe, never an empty public modal.
    missing=true;await page.reload();assert.equal(await dialog.count(),0);missing=false;
    const fresh=await browser.newContext({viewport:{width:390,height:844}}),freshPage=await fresh.newPage();
    second=await directSave(second,{startsAt:null,endsAt:null,localeActive:{bs:true,sq:true,en:true}});await freshPage.goto(origin+'/');await freshPage.getByRole('dialog',{name:/Medresa/}).waitFor();assert.equal(await freshPage.getByRole('dialog',{name:'Obavijest Medrese'}).count(),0,'Campaign waits for existing language gateway');
    await freshPage.getByRole('button',{name:'Bosanski'}).click();await freshPage.getByRole('dialog',{name:'Obavijest Medrese'}).waitFor();await freshPage.getByRole('button',{name:'Zatvori obavijest'}).click();await freshPage.getByRole('dialog',{name:'Obavijest Medrese'}).waitFor({state:'detached'});await fresh.close();
    assert.equal((await db.query('select count(*)::int n from medresa_campaigns')).rows[0].n,2,'Both historical campaigns retained');
    // The same identity/version uses website language without duplicating artwork or dismissal.
    await page.goto(origin+'/sq/historiku');await dialog.waitFor();assert.equal((await dialog.locator('a').innerText()).replace(/\s+/g,' '),'SQ fixture →');assert.equal(await dialog.locator('a').getAttribute('href'),'/sq/regjistrimi');
    await dialog.getByRole('button').click();await dialog.waitFor({state:'detached'});await page.goto(origin+'/en/history');assert.equal(await dialog.count(),0,'Dismissal is shared across languages');
    second=await directSave(second,{ctaText:'New version fixture'});await page.reload();await dialog.waitFor();assert.equal(await dialog.locator('a').getAttribute('href'),'/en/admissions');await dialog.getByRole('button').click();
    await page.goto(origin+'/admin/akcije');
    const target=page.locator('li').filter({has:page.getByRole('heading',{name:second.name,exact:true})});
    for(const width of [360,390,412,430,1440]) { await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);const box=await target.getByRole('button',{name:'Obriši',exact:true}).boundingBox();assert.ok(box.height>=44); }
    await target.getByRole('button',{name:'Obriši',exact:true}).click();const confirmation=page.getByRole('dialog',{name:'Obriši akciju'});await confirmation.waitFor();assert.ok((await confirmation.innerText()).includes(second.name));await confirmation.getByRole('button',{name:'Odustani'}).click();assert.equal((await adminRows()).length,2,'Cancel performs no deletion');
    await target.getByRole('button',{name:'Obriši',exact:true}).click();await confirmation.getByRole('button',{name:'Obriši',exact:true}).click();await target.waitFor({state:'detached'});assert.equal((await adminRows()).length,1);assert.equal(await current(),null);

    assert.equal((await db.query('select count(*)::int n from medresa_analytics_daily')).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from medresa_admin_articles')).rows[0].n,0);
    assert.deepEqual(errors,[],'No browser/hydration errors');
    for(const src of await page.locator('script[src]').evaluateAll(xs=>xs.map(x=>x.src))){const code=await(await context.request.get(src)).text();assert.ok(!code.includes(process.env.SUPABASE_SERVICE_ROLE_KEY));assert.ok(!code.includes('medresa_campaign_save'),'RPC/server code stays server-side');}
    console.log('PASS: authenticated campaign CRUD/upload/replacement/removal; exact original pixels and CTA; private storage/history/security; active/inactive/schedule/expiry; campaign/version dismissal; gateway coexistence; focus/ESC/background/scroll restoration; 360/390/412/430/tablet/desktop, no overflow/crop/layout shift. Explicit local fixtures only, no live campaign or remote writes.');
  } finally {await context.close();await browser.close();await new Promise(r=>server.close(r));await app.close();await db.close();globalThis.fetch=realFetch;}
})().catch(error=>{console.error(error.stack||String(error));process.exitCode=1;});
