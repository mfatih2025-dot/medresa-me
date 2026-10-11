import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import http from 'node:http';
const require=createRequire(resolve('package.json'));const next=require('next'),{chromium}=require('playwright');
process.env.NODE_ENV='production';process.env.VERCEL_ENV='preview';process.env.VERCEL_GIT_COMMIT_REF='codex/admin-panel';
const origin='http://localhost:3218';
const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3218});await app.prepare();
const server=http.createServer(app.getRequestHandler());await new Promise(r=>server.listen(3218,'localhost',r));
const browser=await chromium.launch({executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.addCookies([{name:'medresa-locale',value:'bs',url:origin}]);const page=await context.newPage();
 for(const path of ['/admin','/admin/login','/admin/vijesti','/missing-genuine-page']){const r=await context.request.get(origin+path,{maxRedirects:0});assert.equal(r.status(),404,path);assert.equal(r.headers().location,undefined);assert.ok(!(await r.text()).includes('/ulaz7'),path+' does not disclose hidden entry');}
 for(const path of ['/ulaz7','/ulaz7/vijesti','/ulaz7/akcije','/ulaz7/rezultati','/ulaz7/analitika']){const r=await context.request.get(origin+path,{maxRedirects:0});assert.equal(r.status(),307);assert.equal(r.headers().location,'/ulaz7/login');assert.match(r.headers()['x-robots-tag'],/noindex.*nofollow/);}
 const login=await context.request.get(origin+'/ulaz7/login');assert.equal(login.status(),200);assert.match(await login.text(),/name="robots" content="noindex, nofollow"/);
 const sitemap=await context.request.get(origin+'/sitemap.xml');assert.equal(sitemap.status(),200);const xml=await sitemap.text();assert.ok(xml.includes('https://www.medresa.me/'));assert.ok(!xml.includes('/ulaz7'));assert.ok(!/https:\/\/www\.medresa\.me\/admin(?:[\/<])/ .test(xml));assert.ok(xml.includes('hreflang="sq"'));
 const robots=await context.request.get(origin+'/robots.txt');assert.equal(robots.status(),200);assert.match(await robots.text(),/Disallow: \//);
 for(const path of ['/shop','/en/shop'])assert.equal((await context.request.get(origin+path,{maxRedirects:0})).status(),410);
 const legacy=await context.request.get(origin+'/dn1',{maxRedirects:0});assert.equal(legacy.status(),301);assert.equal(legacy.headers().location,'/donacije');
 const paths=['/','/sq','/en','/vijesti','/historijat','/upis','/galerija','/alumni','/kucni-red'];
 for(const width of [360,390,412,430,768,1024,1280,1440,1920]){
  await page.setViewportSize({width,height:900});
  for(const path of paths){const response=await page.goto(origin+path);assert.equal(response.status(),200,path);await page.waitForTimeout(75);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),`${path} overflow ${width}`);assert.ok(await page.locator('header').count());assert.ok(await page.locator('footer').count());const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');assert.equal(new URL(canonical).origin,'https://www.medresa.me',path+' canonical '+canonical);}
 }
 for(const [path,locale] of [['/','bs'],['/sq','sq'],['/en','en']]){await page.goto(origin+path);assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.ok((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));}
 console.log('PASS: public layout at all nine widths, localized SEO, sitemap/robots, obsolete Admin 404 and protected ulaz7 routes. No live provider calls or database writes.');
}finally{await browser.close();await new Promise(r=>server.close(r));await app.close();}
