import { createRequire } from "node:module";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import http from "node:http";

// Local-only integration fixture. No external Supabase or production calls.
process.env.NODE_ENV = "production";
const requireProject = createRequire(resolve('package.json'));
const { chromium } = requireProject('playwright');
const { PGlite } = requireProject('@electric-sql/pglite');
const sharp = requireProject('sharp');
const next = requireProject('next');
const origin = 'http://localhost:3212';
const provider = 'https://abcdefghijklmnopqrst.supabase.co';
const objects = new Map();
let providerRequests = 0;
let translationRequests = 0;
let translationMode = 'success';
(async () => {
  const { moduleLoader } = await import('../scripts/lib/load-typescript.mjs');
  const load = moduleLoader();
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  await db.exec(readFileSync('supabase/migrations/202610070001_admin_news.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/202610080002_publication_integrity.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/202610080003_locale_publication.sql','utf8'));
  const { articles } = load('src/content/vijesti');
  const { importArticle } = load('src/admin/import.ts');
  const plan = articles.map((a,i) => ({document:importArticle(a).draft,snapshot:a,fingerprint:'explicit-in-memory-browser-fixture-'+i,source_order:i}));
  await db.query('select medresa_admin_import($1,$2)', [JSON.stringify(plan),'browser-test-fixture']);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    // Explicit local OpenAI fixture only; the deployed handler has no mock path.
    if (address === 'https://api.openai.com/v1/responses') {
      translationRequests++;
      await new Promise(resolve => setTimeout(resolve, 150));
      if (translationMode === 'failure') return new Response(JSON.stringify({error:'explicit-private-provider-fixture'}),{status:500});
      const source = JSON.parse(JSON.parse(init.body).input[0].content);
      const pair = value => ({sq:value ? 'Përkthim: '+value : '',en:value ? 'Translation: '+value : ''});
      const output = {title:pair(source.title),lead:pair(source.lead),blocks:source.blocks.map(b=>({id:b.id,type:b.type,text:pair(b.text)})),images:source.images.map(i=>({id:i.id,alt:pair(i.alt)}))};
      if (translationMode === 'invalid') output.blocks.reverse();
      return new Response(JSON.stringify({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(output)}]}]}),{headers:{'Content-Type':'application/json'}});
    }
    if (!address.startsWith(provider + '/')) return realFetch(input, init);
    providerRequests++;
    const url = new URL(address); const headers = new Headers(init.headers);
    const json = (value,status=200) => new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
    try {
      if (url.pathname.startsWith('/rest/v1/rpc/')) {
        const name = url.pathname.split('/').pop(); const body = JSON.parse(init.body);
        const fields = {medresa_admin_save:['p_document','p_expected','p_actor'],medresa_admin_publish_locales:['p_id','p_expected','p_locales','p_snapshots','p_actor'],medresa_admin_transition:['p_id','p_expected','p_action','p_actor']}[name];
        assert.ok(fields,'Only reviewed RPCs allowed in fixture');
        const values=fields.map(k=>k==='p_locales'?body[k]:typeof body[k]==='object'?JSON.stringify(body[k]):body[k]);
        const result = await db.query(`select to_jsonb(${name}(${fields.map((_,i)=>'$'+(i+1)).join(',')})) as result`,values);
        return json(result.rows[0].result);
      }
      if (url.pathname.startsWith('/rest/v1/')) {
        const table=url.pathname.split('/').pop(); assert.ok(['medresa_admin_articles','medresa_admin_assets','medresa_admin_public_feed','medresa_admin_locale_publication_state','medresa_admin_public_locale_feed'].includes(table));
        if(init.method==='POST') {
          assert.equal(table,'medresa_admin_assets'); const value=JSON.parse(init.body);
          const fields=['id','origin','bucket','object_path','original_path','mime','bytes','metadata','created_by'];
          await db.query(`insert into ${table}(${fields.join(',')}) values(${fields.map((_,i)=>'$'+(i+1)).join(',')})`,fields.map(k=>typeof value[k]==='object'?JSON.stringify(value[k]):value[k]));
          return json({},201);
        }
        const clauses=[]; const args=[];
        for(const [key,value] of url.searchParams) if(['id','origin','article_id'].includes(key)) {
          if(value.startsWith('eq.')) {args.push(value.slice(3)); clauses.push(`${key}=$${args.length}`);}
          if(value.startsWith('in.(')) {args.push(value.slice(4,-1).split(',')); clauses.push(`${key}=any($${args.length}::text[])`);}
        }
        const result=await db.query(`select * from ${table}${clauses.length?' where '+clauses.join(' and '):''}` ,args);
        const offset=Number(url.searchParams.get('offset')||0); const limit=Number(url.searchParams.get('limit')||result.rows.length);
        return json(result.rows.slice(offset,offset+limit));
      }
      const prefix='/storage/v1/object/'; assert.ok(url.pathname.startsWith(prefix));
      const path=url.pathname.slice(prefix.length).replace(/^authenticated\//,'');
      if(init.method==='POST') {assert.equal(headers.get('x-upsert'),'false'); assert.ok(!objects.has(path)); objects.set(path,{bytes:Buffer.from(init.body),mime:headers.get('content-type')}); return json({});}
      const object=objects.get(path); return object ? new Response(new Uint8Array(object.bytes),{headers:{'Content-Type':object.mime}}):json({code:'notfound'},404);
    } catch(error) {return json({code:error.code||'fixture-error'},500);}
  };
  // Test fixtures only, never provider credentials and never written to a file.
  const password=randomBytes(24).toString('base64url'); const salt=randomBytes(16).toString('hex');
  Object.assign(process.env,{OPENAI_API_KEY:'explicit-openai-browser-fixture-no-real-key',NEXT_TELEMETRY_DISABLED:'1',VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/admin-panel',SUPABASE_URL:provider,SUPABASE_SERVICE_ROLE_KEY:'explicit-browser-fixture-no-real-key',MEDRESA_SUPABASE_PROJECT_REF:'abcdefghijklmnopqrst',MEDRESA_SUPABASE_WRITE_ENABLED:'true',MEDRESA_ADMIN_USER:'browser-test-fixture',MEDRESA_ADMIN_PASSWORD_HASH:'scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex'),MEDRESA_ADMIN_SESSION_SECRET:randomBytes(48).toString('base64url'),MEDRESA_ADMIN_ORIGIN:origin});
  const app=next({dev:false,dir:process.cwd(),hostname:'localhost',port:3212}); await app.prepare();
  const server=http.createServer(app.getRequestHandler()); await new Promise(resolve=>server.listen(3212,'localhost',resolve));
  const browser=await chromium.launch({executablePath:process.env.MEDRESA_TEST_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
  const publicContext=await browser.newContext({viewport:{width:390,height:844}}); const publicPage=await publicContext.newPage();
  const errors=[]; publicPage.on('pageerror',error=>errors.push(error.message)); page.on('pageerror',error=>errors.push(error.message)); page.on('dialog',dialog=>dialog.accept());
  for(const path of ['/admin','/admin/vijesti','/admin/vijesti/nova','/admin/vijesti/2026-05-03-kurban','/admin-preview/editor']) {
    const response=await context.request.get(origin+path,{maxRedirects:0}); assert.ok([302,307].includes(response.status()),path); assert.equal(response.headers().location,'/admin/login');
  }
  assert.equal((await context.request.post(origin+'/api/admin/news',{headers:{Origin:origin},data:{}})).status(),401);
  const lockedDiagnostic=await context.request.get(origin+'/api/admin/diagnostics'); assert.equal(lockedDiagnostic.status(),401); const lockedReport=await lockedDiagnostic.json(); assert.equal(lockedReport.checks,undefined); assert.equal(lockedReport.runtime,undefined);
  const login=await context.request.post(origin+'/api/admin/login',{headers:{Origin:origin},data:{user:'browser-test-fixture',password}}); assert.equal(login.status(),200);
  const connection=await context.request.get(origin+'/api/admin/diagnostics?connectivity=1'); assert.equal(connection.status(),200);
  const connectionReport=await connection.json(); assert.deepEqual(connectionReport.connectivity,{state:'connected',httpStatus:200}); assert.equal(connectionReport.translation.checks.openAiKeyPresent,true); assert.equal(connectionReport.translation.available,true); assert.equal(connectionReport.translation.keyDelivery,undefined);
  const beforeDiagnostic=providerRequests;
  try {
    process.env.MEDRESA_SUPABASE_WRITE_ENABLED='false';
    const result=await context.request.get(origin+'/api/admin/diagnostics'); assert.equal(result.status(),200);
    const report=await result.json(); assert.equal(report.configurationAccepted,true); assert.deepEqual(report.failedChecks,[]); assert.ok(Object.values(report.checks).every(v=>v===true));
    assert.deepEqual(report.runtime,{supabaseHostname:'abcdefghijklmnopqrst.supabase.co',projectRef:'abcdefghijklmnopqrst'});
    assert.match(result.headers()['cache-control'],/private.*no-store/); assert.match(result.headers()['x-robots-tag'],/noindex/);
    for(const name of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','MEDRESA_ADMIN_USER','MEDRESA_ADMIN_PASSWORD_HASH','MEDRESA_ADMIN_SESSION_SECRET','MEDRESA_ADMIN_ORIGIN']) assert.ok(!JSON.stringify(report).includes(process.env[name]));
    process.env.MEDRESA_SUPABASE_PROJECT_REF='differentprojectref';
    const mismatch=await (await context.request.get(origin+'/api/admin/diagnostics')).json();
    assert.equal(mismatch.configurationAccepted,false); assert.deepEqual(mismatch.failedChecks,['supabaseHostnameMatchesProjectRef']);
    assert.deepEqual(mismatch.runtime,{supabaseHostname:'abcdefghijklmnopqrst.supabase.co',projectRef:'differentprojectref'});
    process.env.MEDRESA_SUPABASE_PROJECT_REF='abcdefghijklmnopqrst';
    delete process.env.VERCEL_GIT_COMMIT_REF;
    const failed=await context.request.get(origin+'/api/admin/diagnostics'); assert.equal(failed.status(),200); assert.deepEqual((await failed.json()).failedChecks,['adminBranch']);
    assert.equal((await context.request.post(origin+'/api/admin/diagnostics',{headers:{Origin:origin},data:{}})).status(),405);
    process.env.VERCEL_ENV='production';
    const production=await context.request.get(origin+'/api/admin/diagnostics'); assert.equal(production.status(),404); const productionReport=await production.json(); assert.equal(productionReport.checks,undefined); assert.equal(productionReport.runtime,undefined);
    assert.equal(providerRequests,beforeDiagnostic);
  } finally { process.env.VERCEL_ENV='preview'; process.env.VERCEL_GIT_COMMIT_REF='codex/admin-panel'; process.env.MEDRESA_SUPABASE_PROJECT_REF='abcdefghijklmnopqrst'; process.env.MEDRESA_SUPABASE_WRITE_ENABLED='true'; }
  await page.goto(origin+'/admin');
  assert.equal(await page.getByRole('button',{name:'Provjeri Preview vezu',exact:true}).count(),0);
  assert.equal(await page.locator('pre').count(),0);
  await page.goto(origin+'/admin/vijesti'); assert.equal(await page.getByRole('article').count(),17);
  await page.getByRole('searchbox').fill('TIKA'); assert.equal(await page.getByRole('article').count(),1); await page.getByRole('searchbox').fill('');
  await page.getByRole('button',{name:'＋ Nova vijest',exact:true}).click();
  await page.waitForURL(/\/admin\/vijesti\/[a-f0-9-]+$/);
  const newId=page.url().split('/').pop();
  assert.equal((await db.query('select status from medresa_admin_articles where id=$1',[newId])).rows[0].status,'draft');
  await page.reload(); assert.equal(await page.getByLabel('Naslov · BS',{exact:true}).inputValue(),'');
  // Publish a photo-free BS article, then SQ and EN independently through the real API.
  await page.getByLabel('Datum objave',{exact:true}).fill('2026-10-08');
  await page.getByRole('button',{name:'＋ Tekst',exact:true}).click();
  for(const l of ['sq','en']) {
    await page.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).click();
    await page.getByLabel('Naslov · '+l.toUpperCase(),{exact:true}).fill('PRIVATE '+l.toUpperCase()+' DRAFT');
    await page.getByLabel('URL slug · '+l.toUpperCase(),{exact:true}).fill('private-'+l+'-draft');
    await page.getByLabel('Tekst 1 · '+l.toUpperCase(),{exact:true}).fill('PRIVATE '+l.toUpperCase()+' BODY');
  }
  const localeRows = async () => (await db.query('select * from medresa_admin_locale_publication_state where article_id=$1 order by locale',[newId])).rows;
  let preservedBs, preservedEn;
  for(const l of ['bs','sq','en','sq']) {
    await page.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).click();
    const update = l==='sq' && preservedEn;
    await page.getByLabel('Naslov · '+l.toUpperCase(),{exact:true}).fill('Independent '+l.toUpperCase()+(update?' updated':''));
    await page.getByLabel('URL slug · '+l.toUpperCase(),{exact:true}).fill('independent-'+l);
    await page.getByLabel('Tekst 1 · '+l.toUpperCase(),{exact:true}).fill('Independent body '+l.toUpperCase()+(update?' updated':''));
    await page.getByRole('button',{name:'Potvrdi ljudski pregled · '+l.toUpperCase(),exact:true}).click();
    // Ready review is still unsaved: publish must persist it automatically.
    const pendingStatus=page.getByRole('list',{name:'Status jezika',exact:true}).getByRole('listitem').filter({has:page.locator('b',{hasText:new RegExp('^'+l.toUpperCase()+'$')})});
    assert.match(await pendingStatus.textContent(),/Spremno/);
    if(l==='bs') {
      await page.getByRole('button',{name:'Osvježi pregled',exact:true}).click();
      await page.frameLocator('iframe').getByRole('heading',{name:'Independent BS',exact:true}).waitFor();
      assert.equal(await page.frameLocator('iframe').locator('article img').count(),0);
    }
    assert.equal(await page.getByRole('button',{name:'OBJAVI '+l.toUpperCase(),exact:true}).isEnabled(),true);
    for(const other of ['bs','sq','en'].filter(x=>x!==l)) assert.equal(await page.getByRole('button',{name:'OBJAVI '+other.toUpperCase(),exact:true}).isEnabled(),false);
    assert.equal(await page.getByRole('button',{name:'OBJAVI SVE SPREMNE JEZIKE',exact:true}).count(),0);
    for(const width of [360,390,412,430]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'locale publication overflow '+width);
      await page.getByRole('button',{name:'OBJAVI '+l.toUpperCase(),exact:true}).click();
      const box=await page.getByRole('dialog').boundingBox(); assert.ok(box.x>=0&&box.x+box.width<=width+1);
      await page.getByRole('button',{name:'Odustani',exact:true}).click();
    }
    await page.getByRole('button',{name:'OBJAVI '+l.toUpperCase(),exact:true}).click();
    await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
    await page.getByText('Objavljeno: '+l.toUpperCase()+'. Javni website još koristi postojeći izvor.',{exact:true}).waitFor();
    const rows=await localeRows();
    if(preservedBs) assert.deepEqual(rows.find(r=>r.locale==='bs'),preservedBs,'later translation must preserve BS');
    if(preservedEn) assert.deepEqual(rows.find(r=>r.locale==='en'),preservedEn,'SQ update must preserve EN');
    if(l==='bs') {
      preservedBs=rows[0]; assert.equal(rows.length,1); assert.equal(rows[0].snapshot.photos.length,0);
      assert.deepEqual(rows[0].snapshot.sq,{title:'',slug:'',body:''}); assert.deepEqual(rows[0].snapshot.en,{title:'',slug:'',body:''});
    }
    // Public pages require no Admin session and use only published locale rows.
    const bases={bs:'/vijesti',sq:'/sq/lajme',en:'/en/news'};
    const publicArchive=await publicPage.goto(origin+bases[l]); assert.equal(publicArchive.status(),200);
    await publicPage.getByRole('heading',{name:'Independent '+l.toUpperCase()+(update?' updated':''),exact:true}).waitFor();
    const publicArticle=await publicPage.goto(origin+bases[l]+'/independent-'+l); assert.equal(publicArticle.status(),200);
    await publicPage.getByRole('heading',{name:'Independent '+l.toUpperCase()+(update?' updated':''),exact:true}).waitFor();
    assert.equal(await publicPage.locator('.news-body').textContent(),'Independent body '+l.toUpperCase()+(update?' updated':''));
    assert.ok(!(await publicArticle.text()).includes('explicit-browser-fixture-no-real-key'));
    if(l==='bs') {
      await publicPage.goto(origin+'/');
      assert.deepEqual(await publicPage.locator('section[aria-labelledby="news-title"] a[href^="/vijesti/"]').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),['/vijesti/independent-bs',...articles.slice(0,2).map(a=>'/vijesti/'+a.bs.slug)]);
      for(const hidden of ['sq','en']) {
        const archive=await publicContext.request.get(origin+bases[hidden]); assert.equal(archive.status(),200); assert.ok(!(await archive.text()).includes('PRIVATE'));
        assert.equal((await publicContext.request.get(origin+bases[hidden]+'/private-'+hidden+'-draft')).status(),404);
        assert.equal((await publicContext.request.get(origin+bases[hidden]+'/independent-bs')).status(),404);
      }
      assert.equal(await publicPage.locator('link[rel="alternate"][hreflang="sq"]').count(),1); // homepage alternates are unchanged
      await publicPage.goto(origin+'/vijesti/independent-bs'); assert.equal(await publicPage.locator('link[rel="alternate"][hreflang="sq"]').count(),0);
    }
    if(l==='en') preservedEn=rows.find(r=>r.locale==='en');
    await page.reload();
    const states=page.getByRole('list',{name:'Status jezika',exact:true}).getByRole('listitem');
    for(const item of rows) assert.match(await states.filter({has:page.locator('b',{hasText:new RegExp('^'+item.locale.toUpperCase()+'$')})}).textContent(),/Objavljeno/);
    if(l==='bs') for(const other of ['SQ','EN']) assert.match(await states.filter({has:page.locator('b',{hasText:new RegExp('^'+other+'$')})}).textContent(),/Nacrt/);
  }
  // Direct /nova has no stored record: create, save review against its canonical
  // server ID/revision, then publish BS without a separate Save click.
  await page.goto(origin+'/admin/vijesti/nova');
  await page.getByLabel('Datum objave',{exact:true}).fill('2026-10-08');
  await page.getByRole('button',{name:'＋ Tekst',exact:true}).click();
  await page.getByLabel('Naslov · BS',{exact:true}).fill('Direct BS-only publication');
  await page.getByLabel('URL slug · BS',{exact:true}).fill('direct-bs-only-publication');
  await page.getByLabel('Tekst 1 · BS',{exact:true}).fill('BS-only direct creation body');
  await page.getByRole('button',{name:'Potvrdi ljudski pregled · BS',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'OBJAVI BS',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'OBJAVI BS',exact:true}).click();
  await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.waitForURL(/\/admin\/vijesti\/[a-f0-9-]+$/);
  const directId=page.url().split('/').pop();
  const directRows=(await db.query('select * from medresa_admin_locale_publication_state where article_id=$1',[directId])).rows;
  assert.equal(directRows.length,1); assert.equal(directRows[0].locale,'bs'); assert.equal(directRows[0].snapshot.photos.length,0);
  await page.reload();
  const directStates=page.getByRole('list',{name:'Status jezika',exact:true}).getByRole('listitem');
  assert.match(await directStates.nth(0).textContent(),/BSObjavljeno/);
  assert.match(await directStates.nth(1).textContent(),/SQNacrt/); assert.match(await directStates.nth(2).textContent(),/ENNacrt/);
  const frozenDirect=directRows[0];
  await page.getByLabel('Naslov · BS',{exact:true}).fill('Direct BS changed');
  await page.getByRole('button',{name:'Potvrdi ljudski pregled · BS',exact:true}).click();
  // A failed automatic save must not invoke the publication action or overwrite history.
  let blockedPublish=0;
  await page.route('**/api/admin/news/'+directId, async route=>{
    const body=route.request().postDataJSON();
    if(body?.action==='save') return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Explicit local save conflict fixture'})});
    if(body?.action==='publish') blockedPublish++;
    return route.continue();
  });
  await page.getByRole('button',{name:'OBJAVI BS',exact:true}).click(); await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Explicit local save conflict fixture',{exact:true}).waitFor();
  assert.equal(blockedPublish,0);
  assert.deepEqual((await db.query('select * from medresa_admin_locale_publication_state where article_id=$1',[directId])).rows,[frozenDirect]);
  assert.equal(await page.getByLabel('Naslov · BS',{exact:true}).inputValue(),'Direct BS changed');
  await page.unroute('**/api/admin/news/'+directId);
  // Saving can succeed while publishing fails. Preserve the saved draft and show
  // no publication success; retry uses that saved revision, not the old one.
  await page.route('**/api/admin/news/'+directId, async route=>{
    const body=route.request().postDataJSON();
    if(body?.action==='publish') return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Explicit local publication conflict fixture'})});
    return route.continue();
  });
  await page.getByRole('button',{name:'OBJAVI BS',exact:true}).click(); await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Explicit local publication conflict fixture',{exact:true}).waitFor();
  assert.deepEqual((await db.query('select * from medresa_admin_locale_publication_state where article_id=$1',[directId])).rows,[frozenDirect]);
  assert.equal((await db.query('select document from medresa_admin_articles where id=$1',[directId])).rows[0].document.title.bs,'Direct BS changed');
  assert.equal(await page.getByRole('button',{name:'Sačuvaj nacrt',exact:true}).isEnabled(),false);
  await page.unroute('**/api/admin/news/'+directId);
  await page.getByRole('button',{name:'OBJAVI BS',exact:true}).click(); await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Objavljeno: BS. Javni website još koristi postojeći izvor.',{exact:true}).waitFor();
  await page.reload(); assert.match(await page.getByRole('list',{name:'Status jezika',exact:true}).getByRole('listitem').nth(0).textContent(),/BSObjavljeno/);
  // Existing editor and actual renderer: unsaved content, languages, reorder and gallery.
  await page.goto(origin+'/admin/vijesti/2026-05-03-kurban');
  await page.getByLabel('Naslov · BS',{exact:true}).fill('Nespremljeni naslov');
  await page.getByRole('button',{name:'Osvježi pregled',exact:true}).click();
  await page.frameLocator('iframe').getByRole('heading',{name:'Nespremljeni naslov',exact:true}).waitFor();
  await page.getByLabel('Jezik pregleda',{exact:true}).getByRole('button',{name:'EN',exact:true}).click();
  await page.frameLocator('iframe').getByRole('heading',{name:/Donate a kurban/i}).waitFor();
  await page.getByRole('button',{name:'Odaberi iz biblioteke',exact:false}).first().click();
  assert.ok(await page.getByRole('button',{name:/^Odaberi:/}).count()>0);
  // Create a real draft using actual service/RPCs against in-memory PostgreSQL fixture.
  await page.goto(origin+'/admin/vijesti/nova');
  await page.getByLabel('Datum objave',{exact:true}).fill('2026-10-07');
  await page.getByRole('button',{name:'＋ Tekst',exact:true}).click();
  const jpeg=await sharp({create:{width:96,height:64,channels:3,background:{r:23,g:62,b:43}}}).jpeg().toBuffer();
  const chooserPromise=page.waitForEvent('filechooser'); await page.getByRole('button',{name:'Odaberi sliku',exact:true}).click();
  const chooser=await chooserPromise; await chooser.setFiles({name:'phone-gallery-test.jpg',mimeType:'image/jpeg',buffer:jpeg});
  await page.getByText('Slika je spremljena u zajedničku biblioteku.',{exact:true}).waitFor();
  assert.equal(objects.size,2);
  for(const l of ['bs','sq','en']) {
    await page.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).click();
    await page.getByLabel('Naslov · '+l.toUpperCase(),{exact:true}).fill('Browser draft '+l.toUpperCase());
    await page.getByLabel('URL slug · '+l.toUpperCase(),{exact:true}).fill('browser-draft-'+l);
    await page.getByLabel('Tekst 1 · '+l.toUpperCase(),{exact:true}).fill('Browser body '+l.toUpperCase());
    await page.getByLabel('Opis naslovne slike · '+l.toUpperCase(),{exact:true}).fill('Browser image '+l.toUpperCase());
  }
  await page.getByRole('button',{name:'Osvježi pregled',exact:true}).click();
  await page.frameLocator('iframe').getByRole('heading',{name:'Browser draft BS',exact:true}).waitFor();
  assert.equal(await page.frameLocator('iframe').locator('article img').first().evaluate(img=>img.naturalWidth),96);
  // Add an image block sharing the existing upload without a second upload.
  await page.getByRole('button',{name:'＋ Slika',exact:true}).click();
  await page.getByRole('button',{name:'Odaberi iz biblioteke',exact:false}).nth(1).click();
  await page.getByRole('region',{name:'Biblioteka · Slika bloka 2',exact:true}).getByRole('button',{name:/^Odaberi:/}).first().click();
  assert.equal(objects.size,2);
  await page.getByRole('button',{name:'Pomjeri blok 2 gore',exact:true}).click();
  assert.equal(await page.getByLabel('Tekst 2 · EN',{exact:true}).count(),1);
  await page.setViewportSize({width:1280,height:1200});
  await page.getByRole('list',{name:'Blokovi članka',exact:true}).scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Povuci blok 2',exact:true}).dragTo(page.getByRole('button',{name:'Povuci blok 1',exact:true}));
  await page.getByLabel('Tekst 1 · EN',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Kreiraj i sačuvaj nacrt',exact:true}).click();
  await page.getByText('Nacrt je spremljen u bazu.',{exact:true}).waitFor();
  await page.waitForURL(/\/admin\/vijesti\/[a-f0-9-]+\?saved=1$/);
  const savedUrl=page.url().split('?')[0]; assert.match(savedUrl,/\/admin\/vijesti\/[a-f0-9-]+$/);
  await page.getByRole('link',{name:'← Sve vijesti',exact:true}).click();
  await page.waitForURL(origin+'/admin/vijesti');
  await page.goBack(); await page.waitForURL(savedUrl+'?saved=1');
  assert.equal(await page.getByLabel('Naslov · BS',{exact:true}).inputValue(),'Browser draft BS');
  await page.reload(); assert.equal(await page.getByLabel('Naslov · BS',{exact:true}).inputValue(),'Browser draft BS');
  for(const l of ['bs','sq','en']) {
    await page.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).click();
    await page.getByRole('button',{name:'Potvrdi ljudski pregled · '+l.toUpperCase(),exact:true}).click();
  }
  // The ready-language batch also auto-saves reviews before publishing.
  assert.equal(await page.getByRole('button',{name:'OBJAVI SVE SPREMNE JEZIKE',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'OBJAVI SVE SPREMNE JEZIKE',exact:true}).click();
  assert.equal(await page.getByRole('dialog').count(),1); await page.getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Objavljeno: BS, SQ, EN. Javni website još koristi postojeći izvor.',{exact:true}).waitFor();
  const id=savedUrl.split('/').pop(); const published=(await db.query('select * from medresa_admin_articles where id=$1',[id])).rows[0]; assert.equal(published.status,'published');
  const uploadedId=published.document.images[0].id;
  const publicImage=await publicContext.request.get(origin+'/api/news/media/'+uploadedId); assert.equal(publicImage.status(),200); assert.equal(publicImage.headers()['content-type'],'image/webp');
  assert.equal((await publicContext.request.get(origin+'/api/admin/media/'+uploadedId)).status(),401);
  const unreferenced=await db.query("select id from medresa_admin_assets where origin='upload' and id<>$1",[uploadedId]);
  for(const unused of unreferenced.rows) assert.equal((await publicContext.request.get(origin+'/api/news/media/'+unused.id)).status(),404);
  // Every original URL still opens with the existing Article renderer.
  for(const locale of ['bs','sq','en']) for(const legacy of articles) {
    const base={bs:'/vijesti',sq:'/sq/lajme',en:'/en/news'}[locale]; const response=await publicContext.request.get(origin+base+'/'+legacy[locale].slug);
    assert.equal(response.status(),200); assert.ok((await response.text()).includes(legacy[locale].title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
  }
  // All requested mobile widths including native input attributes, thumbnails and preview controls.
  for(const width of [360,390,412,430]) {
    await page.setViewportSize({width,height:900});
    for(const path of ['/admin/vijesti', '/admin/vijesti/nova','/admin/vijesti/'+id,'/admin/vijesti/2026-05-03-kurban']) {
      await page.goto(origin+path); const size=await page.evaluate(()=>({view:document.documentElement.clientWidth,content:document.documentElement.scrollWidth})); if(size.content>size.view+1) { console.log('OVERFLOW',path,width,size,await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,text:e.textContent.slice(0,70)})).filter(e=>e.right>document.documentElement.clientWidth+1).slice(0,15)));  } assert.ok(size.content<=size.view+1,path+' overflow at '+width);
    }
    const input=page.getByLabel('Datoteka · Naslovna slika',{exact:true}); assert.equal(await input.getAttribute('type'),'file'); assert.match(await input.getAttribute('accept'),/image\/jpeg.*image\/png.*image\/webp/);
    await page.getByRole('button',{name:'Odaberi iz biblioteke',exact:false}).first().click();
    const size=await page.evaluate(()=>({view:document.documentElement.clientWidth,content:document.documentElement.scrollWidth})); assert.ok(size.content<=size.view+1,'gallery overflow '+width);
  }
  // Archive, cancel/confirm trash, restore, and dialog geometry at every width.
  for(const width of [360,390,412,430]) {
    await page.setViewportSize({width,height:900}); await page.goto(origin+'/admin/vijesti');
    const row=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Browser draft BS',exact:true})});
    await row.getByRole('button',{name:'Obriši',exact:true}).click();
    const bounds=await page.getByRole('dialog').boundingBox(); assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1); await page.getByRole('button',{name:'Odustani',exact:true}).click();
  }
  let row=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Browser draft BS',exact:true})});
  await row.getByRole('button',{name:'Arhiviraj',exact:true}).click(); await page.getByRole('dialog').getByRole('button',{name:'Arhiviraj',exact:true}).click();
  await page.getByText('Vijest je arhivirana u bazi. Javni izvor još nije povezan.',{exact:true}).waitFor();
  await page.getByLabel('Status',{exact:true}).selectOption('archive'); assert.equal(await page.getByRole('article').count(),1); await page.getByRole('button',{name:'Vrati',exact:true}).click();
  await page.getByText('Vijest je vraćena.',{exact:true}).waitFor(); await page.getByLabel('Status',{exact:true}).selectOption('active');
  row=page.getByRole('article').filter({has:page.getByRole('heading',{name:'Browser draft BS',exact:true})});
  await row.getByRole('button',{name:'Obriši',exact:true}).click(); await page.getByRole('button',{name:'Premjesti u smeće',exact:true}).click();
  await page.getByText('Vijest je premještena u smeće. Možete je vratiti; slike su sačuvane.',{exact:true}).waitFor();
  await page.getByLabel('Status',{exact:true}).selectOption('trash'); assert.equal(await page.getByRole('article').count(),1); await page.getByRole('button',{name:'Vrati',exact:true}).click();
  await page.getByText('Vijest je vraćena.',{exact:true}).waitFor(); assert.equal(objects.size,2);
  // Translation through the real authenticated endpoint, atomic save RPC and locked
  // Article iframe. OpenAI itself is an explicit isolated provider fixture above.
  const { newDraft, localeContent } = load('src/admin/model.ts');
  const { archiveAssets } = load('src/server/admin/news.ts');
  const source = newDraft('translation-browser-source');
  source.title.bs='Posjeta Medresi Mehmed Fatih'; source.slug.bs='translation-browser-bs'; source.date='2026-10-08';
  source.images=[{...archiveAssets()[0],alt:{bs:'Učenici ispred Medrese',sq:'',en:''}}]; source.coverImageId=source.images[0].id;
  const bsText=value=>({bs:value,sq:'',en:''});
  source.blocks=[{id:'first',type:'text',text:bsText('Učenici su posjetili Medresu.')},{id:'photo-one',type:'image',assetId:source.images[0].id},{id:'second',type:'text',text:bsText('Nastavak naše vijesti.')},{id:'photo-two',type:'image',assetId:source.images[0].id},{id:'quote',type:'quote',text:bsText('Znanje nas povezuje.')},{id:'heading',type:'subheading',text:bsText('Naša škola')},{id:'last',type:'text',text:bsText('Zajedništvo učenika i nastavnika.')}];
  const createdTranslation=await context.request.post(origin+'/api/admin/news',{headers:{Origin:origin},data:{draft:source}}); assert.equal(createdTranslation.status(),201);
  const translationId=(await createdTranslation.json()).article.draft.id;
  await page.goto(origin+'/admin/vijesti/'+translationId);
  await page.getByRole('button',{name:'Potvrdi ljudski pregled · BS',exact:true}).click();
  await page.getByRole('button',{name:'OBJAVI BS',exact:true}).click(); await page.getByRole('dialog').getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Objavljeno: BS. Javni website još koristi postojeći izvor.',{exact:true}).waitFor();
  const beforeTranslation=(await db.query('select document from medresa_admin_articles where id=$1',[translationId])).rows[0].document;
  const beforePublications=(await db.query('select * from medresa_admin_locale_publication_state where article_id=$1',[translationId])).rows;
  await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).click();
  await page.getByRole('button',{name:'Prevodim SQ i EN…',exact:true}).waitFor(); assert.equal(await page.getByRole('button',{name:'Prevodim SQ i EN…',exact:true}).isEnabled(),false);
  await page.getByText('SQ i EN nacrti su pripremljeni.',{exact:true}).waitFor(); assert.equal(translationRequests,1);
  const afterTranslation=(await db.query('select document from medresa_admin_articles where id=$1',[translationId])).rows[0].document;
  assert.equal(localeContent(afterTranslation,'bs'),localeContent(beforeTranslation,'bs'));
  assert.deepEqual(afterTranslation.blocks.map(b=>[b.id,b.type,b.assetId]),source.blocks.map(b=>[b.id,b.type,b.assetId]));
  assert.deepEqual((await db.query('select * from medresa_admin_locale_publication_state where article_id=$1',[translationId])).rows,beforePublications);
  for(const l of ['bs','sq','en']) {
    await page.getByLabel('Jezik pregleda',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).click();
    await page.frameLocator('iframe').getByRole('heading',{name:afterTranslation.title[l],exact:true}).waitFor();
    assert.deepEqual(await page.frameLocator('iframe').locator('.news-body').evaluate(e=>Array.from(e.children).map(c=>c.tagName)),['P','FIGURE','P','FIGURE','BLOCKQUOTE','H2','P']);
  }
  for(const l of ['SQ','EN']) { const status=page.getByRole('list',{name:'Status jezika',exact:true}).getByRole('listitem').filter({has:page.locator('b',{hasText:new RegExp('^'+l+'$')})}); assert.match(await status.textContent(),/Nacrt/); assert.equal(await page.getByRole('button',{name:'OBJAVI '+l,exact:true}).isEnabled(),false); }
  await page.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:'SQ',exact:true}).click(); await page.getByLabel('Naslov · SQ',{exact:true}).fill('Titull i redaktuar');
  await page.getByRole('button',{name:'Sačuvaj nacrt',exact:true}).click(); await page.getByText('Nacrt je spremljen u bazu.',{exact:true}).waitFor();
  const preservedTranslation=JSON.stringify((await db.query('select document from medresa_admin_articles where id=$1',[translationId])).rows[0].document);
  await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).click(); await page.getByRole('dialog').waitFor(); assert.equal(translationRequests,1);
  await page.getByRole('button',{name:'Odustani',exact:true}).click(); assert.equal(await page.getByLabel('Naslov · SQ',{exact:true}).inputValue(),'Titull i redaktuar');
  for(const mode of ['failure','invalid']) {
    translationMode=mode; await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).click(); await page.getByRole('button',{name:'Potvrdi zamjenu i prevedi',exact:true}).click();
    await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).waitFor(); await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(JSON.stringify((await db.query('select document from medresa_admin_articles where id=$1',[translationId])).rows[0].document),preservedTranslation); assert.equal(await page.getByLabel('Naslov · SQ',{exact:true}).inputValue(),'Titull i redaktuar');
  }
  translationMode='success';
  await page.getByRole('button',{name:'Potvrdi ljudski pregled · SQ',exact:true}).click(); await page.getByRole('button',{name:'OBJAVI SQ',exact:true}).click(); await page.getByRole('dialog').getByRole('button',{name:'Objavi u bazi',exact:true}).click();
  await page.getByText('Objavljeno: SQ. Javni website još koristi postojeći izvor.',{exact:true}).waitFor();
  await page.reload(); assert.equal(await page.getByLabel('Naslov · BS',{exact:true}).inputValue(),source.title.bs);
  const translationPublications=(await db.query('select * from medresa_admin_locale_publication_state where article_id=$1 order by locale',[translationId])).rows;
  assert.deepEqual(translationPublications.map(r=>r.locale),['bs','sq']); assert.deepEqual(translationPublications[0],beforePublications[0]);
  assert.equal((await publicContext.request.get(origin+'/en/news/'+afterTranslation.slug.en)).status(),404);
  const restoreKey=process.env.OPENAI_API_KEY; delete process.env.OPENAI_API_KEY;
  await page.reload(); assert.equal(await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).isEnabled(),false); const absent=await context.request.get(origin+'/api/admin/diagnostics?connectivity=1'); assert.equal((await absent.json()).translation.checks.openAiKeyPresent,false); process.env.OPENAI_API_KEY=restoreKey; const present=await context.request.get(origin+'/api/admin/diagnostics?connectivity=1'); assert.equal((await present.json()).translation.available,true); await page.reload(); assert.equal(await page.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).isEnabled(),true);
  // Real touch events, every mobile width: reachable menu and a complete multi-image draft without dragging.
  const touchContext=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:360,height:900},storageState:await context.storageState()});
  const phone=await touchContext.newPage(); phone.on('pageerror',error=>errors.push(error.message)); phone.on('dialog',dialog=>dialog.accept());
  const sections=[['Pregled','/admin'],['Vijesti','/admin/vijesti'],['Akcije','/admin/akcije'],['Rezultati','/admin/rezultati'],['Analitika','/admin/analitika']];
  const assertFits=async () => assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'phone page overflow at '+(await phone.viewportSize()).width);
  for(const width of [360,390,412,430]) {
    await phone.setViewportSize({width,height:900}); await phone.goto(origin+'/admin');
    for(const [label,path] of sections) {
      const menu=phone.getByRole('button',{name:'Administracijski meni',exact:true});
      assert.equal(await menu.getAttribute('aria-expanded'),'false');
      await menu.tap();
      const nav=phone.getByRole('navigation',{name:'Administracija',exact:true});
      assert.equal(await nav.getByRole('link').count(),5);
      assert.equal(await nav.evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);
      for(const [item] of sections) {
        const link=nav.getByRole('link',{name:item,exact:true}); const box=await link.boundingBox();
        assert.ok(box && box.x>=0 && box.x+box.width<=width && box.height>=44,item+' menu bounds');
      }
      await assertFits();
      if(process.env.MEDRESA_TEST_SCREENSHOT_DIR && width===390 && label==='Pregled') await phone.screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'menu-390.png')});
      await nav.getByRole('link',{name:label,exact:true}).tap(); await phone.waitForURL(origin+path);
      assert.equal(await phone.getByRole('button',{name:'Administracijski meni',exact:true}).getAttribute('aria-expanded'),'false'); await assertFits();
    }
    await phone.goto(origin+'/admin/vijesti/'+translationId);
    await phone.getByRole('button',{name:'Prevedi na SQ i EN',exact:true}).tap();
    const translationDialog=await phone.getByRole('dialog').boundingBox(); assert.ok(translationDialog.x>=0&&translationDialog.x+translationDialog.width<=width+1); await assertFits();
    if(width===360) {
      await phone.getByRole('button',{name:'Potvrdi zamjenu i prevedi',exact:true}).tap(); await phone.getByText('SQ i EN nacrti su pripremljeni.',{exact:true}).waitFor();
      assert.deepEqual((await db.query('select * from medresa_admin_locale_publication_state where article_id=$1 order by locale',[translationId])).rows,translationPublications);
      await phone.getByLabel('Jezik pregleda',{exact:true}).getByRole('button',{name:'EN',exact:true}).tap(); await phone.frameLocator('iframe').getByRole('heading',{name:afterTranslation.title.en,exact:true}).waitFor();
    } else await phone.getByRole('button',{name:'Odustani',exact:true}).tap();
    await phone.goto(origin+'/admin/vijesti/nova');
    await phone.getByLabel('Datum objave',{exact:true}).fill('2026-10-08');
    const choose=phone.waitForEvent('filechooser'); await phone.getByRole('button',{name:'Odaberi sliku',exact:true}).tap();
    await (await choose).setFiles({name:'phone-cover.jpg',mimeType:'image/jpeg',buffer:jpeg});
    await phone.getByText('Slika je spremljena u zajedničku biblioteku.',{exact:true}).waitFor();
    assert.equal(await phone.getByRole('button',{name:'Zamijeni',exact:true}).count(),1);
    const replacement=phone.waitForEvent('filechooser'); await phone.getByRole('button',{name:'Zamijeni',exact:true}).tap(); await (await replacement).setFiles([]);
    for(const type of ['Tekst','Slika','Tekst','Slika','Slika','Podnaslov','Tekst','Citat','Slika']) await phone.getByRole('button',{name:'＋ '+type,exact:true}).tap();
    const blocks=phone.getByRole('list',{name:'Blokovi članka',exact:true}).getByRole('listitem');
    assert.equal(await blocks.count(),9); assert.equal(await phone.getByRole('button',{name:/^Povuci blok/}).count(),0);
    for(const index of [1,3,4,8]) {
      const block=blocks.nth(index); const picker=phone.waitForEvent('filechooser'); await block.getByRole('button',{name:'Odaberi sliku',exact:true}).tap();
      await (await picker).setFiles({name:'phone-block-'+index+'.jpg',mimeType:'image/jpeg',buffer:jpeg});
      await block.getByText('Slika je spremljena u zajedničku biblioteku.',{exact:true}).waitFor();
      assert.equal(await block.getByRole('img').count(),1);
      assert.equal(await block.getByRole('button',{name:'Odaberi iz biblioteke',exact:false}).getAttribute('aria-expanded'),'false');
    }
    await blocks.nth(1).getByRole('button',{name:'Postavi kao naslovnu',exact:true}).tap();
    for(const l of ['bs','sq','en']) {
      await phone.getByLabel('Jezik uređivanja',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).tap();
      await phone.getByLabel('Naslov · '+l.toUpperCase(),{exact:true}).fill('Phone '+width+' '+l.toUpperCase());
      await phone.getByLabel('URL slug · '+l.toUpperCase(),{exact:true}).fill('phone-'+width+'-'+l);
      for(const [label,index] of [['Tekst',1],['Tekst',3],['Podnaslov',6],['Tekst',7],['Citat',8]]) await phone.getByLabel(label+' '+index+' · '+l.toUpperCase(),{exact:true}).fill(label+' '+index+' '+l);
    }
    for(const name of ['Pomjeri blok 2 dolje','Pomjeri blok 3 gore']) {
      const button=phone.getByRole('button',{name,exact:true}); const box=await button.boundingBox(); assert.ok(box.width>=44 && box.height>=44);
      await button.tap();
    }
    assert.equal(await phone.getByLabel('Tekst 3 · EN',{exact:true}).inputValue(),'Tekst 3 en');
    await phone.getByRole('button',{name:'Osvježi pregled',exact:true}).tap();
    const frame=phone.frameLocator('iframe');
    for(const l of ['bs','sq','en']) {
      await phone.getByLabel('Jezik pregleda',{exact:true}).getByRole('button',{name:l.toUpperCase(),exact:true}).tap();
      await frame.getByRole('heading',{name:'Phone '+width+' '+l.toUpperCase(),exact:true}).waitFor();
      assert.deepEqual(await frame.locator('.news-body').evaluate(e=>Array.from(e.children).map(c=>c.tagName)),['P','FIGURE','P','FIGURE','FIGURE','H2','P','BLOCKQUOTE','FIGURE']);
    }
    assert.ok(await phone.locator('iframe').evaluate(e=>e.getBoundingClientRect().width<=e.parentElement.clientWidth));
    await phone.getByLabel('Veličina pregleda',{exact:true}).getByRole('button',{name:'Desktop',exact:true}).tap();
    assert.equal(await phone.locator('iframe').evaluate(e=>Math.round(e.getBoundingClientRect().width)),1200); await assertFits();
    await phone.getByLabel('Veličina pregleda',{exact:true}).getByRole('button',{name:'Mobile',exact:true}).tap();
    const previewTop=await phone.getByRole('region',{name:'Pregled nacrta',exact:true}).evaluate(e=>e.getBoundingClientRect().top+window.scrollY);
    const publishTop=await phone.getByRole('button',{name:'OBJAVI BS',exact:true}).evaluate(e=>e.getBoundingClientRect().top+window.scrollY);
    assert.ok(publishTop>previewTop,'preview before publication');
    await phone.getByRole('button',{name:'Kreiraj i sačuvaj nacrt',exact:true}).tap(); await phone.waitForURL(/\/admin\/vijesti\/[a-f0-9-]+\?saved=1$/);
    const phoneId=phone.url().split('?')[0].split('/').pop(); const saved=(await db.query('select document from medresa_admin_articles where id=$1',[phoneId])).rows[0].document;
    assert.deepEqual(saved.blocks.map(b=>b.type),['text','image','text','image','image','subheading','text','quote','image']); assert.equal(saved.images.length,4);
    await phone.reload(); assert.equal(await phone.getByRole('list',{name:'Blokovi članka',exact:true}).getByRole('listitem').count(),9); await assertFits();
    if(process.env.MEDRESA_TEST_SCREENSHOT_DIR) await phone.screenshot({path:resolve(process.env.MEDRESA_TEST_SCREENSHOT_DIR,'editor-'+width+'.png'),fullPage:true});
  }
  // Keyboard closure and the preserved tablet/desktop navigation.
  await phone.goto(origin+'/admin'); await phone.getByRole('button',{name:'Administracijski meni',exact:true}).tap();
  await phone.getByRole('navigation',{name:'Administracija',exact:true}).getByRole('link',{name:'Pregled',exact:true}).focus(); await phone.keyboard.press('Escape');
  assert.equal(await phone.getByRole('button',{name:'Administracijski meni',exact:true}).getAttribute('aria-expanded'),'false');
  for(const width of [768,1024,1440]) {
    await page.setViewportSize({width,height:900}); await page.goto(origin+'/admin');
    if(width<=900) await page.getByRole('button',{name:'Administracijski meni',exact:true}).click();
    assert.equal(await page.getByRole('navigation',{name:'Administracija',exact:true}).getByRole('link').count(),5);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true);
  }
  // Safe cleanup of disposable published fixtures: trash hides them from the
  // public locale feed while retaining immutable publication history and slugs.
  for(const disposableId of [newId,directId,translationId]) {
    const row=(await db.query('select revision from medresa_admin_articles where id=$1',[disposableId])).rows[0];
    const cleanup=await context.request.post(origin+'/api/admin/news/'+disposableId,{headers:{Origin:origin},data:{action:'trash',expectedRevision:row.revision,confirmedId:disposableId}});
    assert.equal(cleanup.status(),200);
    assert.equal((await db.query('select * from medresa_admin_public_locale_feed where article_id=$1',[disposableId])).rows.length,0);
    assert.ok((await db.query('select * from medresa_admin_locale_publications where article_id=$1',[disposableId])).rows.length>0);
  }
  assert.equal((await publicContext.request.get(origin+'/vijesti/independent-bs')).status(),404);
  await publicContext.close();
  await touchContext.close();
  assert.equal((await context.request.post(origin+'/api/admin/logout',{headers:{Origin:origin},maxRedirects:0})).status(),303);
  await page.goto(origin+'/admin'); assert.match(page.url(),/\/admin\/login$/);
  assert.deepEqual(errors,[]);
  console.log('PASS: OpenAI translation API fixtures; BS/master and ordered images unchanged; atomic draft persistence; human review/independent SQ publication; manual overwrite confirmation/cancel; provider/invalid-output failure recovery; automatic locked Article preview; missing-key disabled action; translation dialogs at 360/390/412/430; public BS archive/article/homepage latest three; unpublished SQ/EN hidden; all 51 original locale URLs; public published-image access with unreferenced/draft images blocked; authenticated routes; 17 legacy items; existing/unsaved renderer preview; native filechooser/replacement; shared multi-image uploads; persisted drafts/reload; unsaved-ready BS auto-save/publication; direct new BS publication; failed save/publication recovery; safe disposable trash cleanup; later SQ/EN, independent SQ update; ready-language batch publication; desktop DND; touch-only nine-block articles; archive/trash/restore; logout; all five mobile menu destinations; 360/390/412/430 px without page/menu overflow; tablet/desktop navigation. Supabase is an in-memory PostgreSQL/Storage test fixture, not an external connection.');
  await browser.close(); await db.close(); server.close(); await app.close(); process.exit(0);
})().catch(error=>{console.error((error.stack ?? error.message).split('Call log:')[0]);console.error((error.stack ?? '').split('\n').filter(line=>line.includes('at ')&&line.includes('tests/admin-browser.mjs')).join('\n'));process.exit(1);});
