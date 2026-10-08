import { createRequire } from 'node:module';
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';

async function main() {
// Production-build browser regression with HTTPS origins emulated by interception.
// All requests go to localhost or fixtures. Credentials are generated in memory.
process.env.NODE_ENV = 'production';
const require = createRequire(resolve('package.json'));
const next = require('next');
const { chromium } = require('playwright');
const origin = 'https://preview.example.test';
// A different registrable domain is required to exercise SameSite=Strict.
const external = 'https://external.other.test';
const local = 'http://127.0.0.1:3213';
const provider = 'https://abcdefghijklmnopqrst.supabase.co';
const password = randomBytes(24).toString('base64url');
const salt = randomBytes(16).toString('hex');
Object.assign(process.env, {
  NEXT_TELEMETRY_DISABLED: '1', VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/admin-panel',
  MEDRESA_ADMIN_USER: 'browser-fixture', MEDRESA_ADMIN_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`,
  MEDRESA_ADMIN_SESSION_SECRET: randomBytes(48).toString('base64url'), MEDRESA_ADMIN_ORIGIN: origin,
  SUPABASE_URL: provider, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_explicit_local_fixture',
  MEDRESA_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst', MEDRESA_SUPABASE_WRITE_ENABLED: 'true',
});
const realFetch = globalThis.fetch;
let reads = 0;
globalThis.fetch = async (input, init = {}) => {
  const address = String(input);
  if (address.startsWith(provider + '/')) {
    assert.equal(init.method ?? 'GET', 'GET', 'No provider writes permitted');
    assert.equal(new URL(address).pathname, '/rest/v1/medresa_admin_articles');
    reads++;
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }
  assert.ok(address.startsWith(local + '/'), 'Only localhost bridge calls permitted');
  return realFetch(input, init);
};
const app = next({ dev: false, dir: process.cwd(), hostname: '127.0.0.1', port: 3213 });
await app.prepare();
const server = http.createServer(app.getRequestHandler());
await new Promise((done, reject) => { server.once('error', reject); server.listen(3213, '127.0.0.1', done); });
const browser = await chromium.launch({ executablePath: process.env.MEDRESA_TEST_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === external) return route.fulfill({ contentType: 'text/html', body: `<a href="${origin}/api/admin/diagnostics?connectivity=1">Open diagnostic</a>` });
    if (url.origin !== origin) return route.abort();
    const headers = await request.allHeaders(); headers.host = url.host; delete headers['accept-encoding'];
    const response = await realFetch(local + url.pathname + url.search, { method: request.method(), headers, body: request.postDataBuffer() ?? undefined, redirect: 'manual' });
    const responseHeaders = Object.fromEntries(response.headers);
    for (const name of ['content-encoding', 'content-length', 'transfer-encoding']) delete responseHeaders[name];
    await route.fulfill({ status: response.status, headers: responseHeaders, body: Buffer.from(await response.arrayBuffer()) });
  });
  const page = await context.newPage();
  const locked = await page.goto(origin + '/api/admin/diagnostics?connectivity=1');
  assert.equal(locked.status(), 401); assert.equal(reads, 0);
  await page.goto(origin + '/admin/login');
  await page.getByLabel('Korisničko ime', { exact: true }).fill('browser-fixture');
  await page.getByLabel('Lozinka', { exact: true }).fill(password);
  const loginResponse = page.waitForResponse(r => r.url() === origin + '/api/admin/login');
  await page.getByRole('button', { name: 'Uđi u administraciju →', exact: true }).click();
  assert.equal((await loginResponse).status(), 200); await page.waitForURL(origin + '/admin');
  const cookie = (await context.cookies()).find(c => c.name === '__Host-medresa-admin');
  assert.ok(cookie); assert.equal(cookie.path, '/'); assert.equal(cookie.domain, 'preview.example.test');
  assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true); assert.equal(cookie.sameSite, 'Strict');

  await page.goto(external + '/');
  const crossSiteRequest = page.waitForRequest(r => r.url() === origin + '/api/admin/diagnostics?connectivity=1');
  const crossSiteResponse = page.waitForResponse(r => r.url() === origin + '/api/admin/diagnostics?connectivity=1');
  const beforeExternal = reads;
  await page.getByRole('link', { name: 'Open diagnostic', exact: true }).click();
  assert.equal(Boolean((await (await crossSiteRequest).allHeaders()).cookie), false);
  assert.equal((await crossSiteResponse).status(), 401); assert.equal(reads, beforeExternal);

  // The existing session remains valid. The in-Admin action uses same-origin fetch.
  await page.goto(origin + '/admin'); assert.equal(page.url(), origin + '/admin');
  const beforeCheck = reads;
  const probeRequest = page.waitForRequest(r => r.url() === origin + '/api/admin/diagnostics?connectivity=1');
  await page.getByRole('button', { name: 'Provjeri Preview vezu', exact: true }).click();
  const request = await probeRequest; assert.equal(request.method(), 'GET'); assert.ok((await request.allHeaders()).cookie);
  const result = page.getByLabel('Rezultat Preview dijagnostike', { exact: true }); await result.waitFor();
  assert.deepEqual(JSON.parse(await result.textContent()), {
    runtime: { supabaseHostname: 'abcdefghijklmnopqrst.supabase.co', projectRef: 'abcdefghijklmnopqrst' },
    connectivity: { state: 'connected', httpStatus: 200 },
  });
  assert.equal(reads, beforeCheck + 1);
  for (const width of [360, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
    const box = await page.getByRole('button', { name: 'Provjeri Preview vezu', exact: true }).boundingBox();
    assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
  }
  await page.evaluate(() => fetch('/api/admin/logout', { method: 'POST', redirect: 'manual' }));
  const beforeLogoutCheck = reads;
  const loggedOut = await page.goto(origin + '/api/admin/diagnostics?connectivity=1');
  assert.equal(loggedOut.status(), 401); assert.equal(reads, beforeLogoutCheck);
  // Redirect follow-ups escape browser route interception for virtual HTTPS hosts.
  // Verify the real protected-page response through the localhost bridge instead.
  const loggedOutPage = await realFetch(local + '/admin', { redirect: 'manual', headers: { Host: 'preview.example.test' } });
  assert.ok([302, 307].includes(loggedOutPage.status)); assert.equal(loggedOutPage.headers.get('location'), '/admin/login');
  console.log('PASS: cross-site Strict cookie omission reproduced; same-origin in-Admin diagnostic accepts the existing Secure/HttpOnly session; read-only probe; 360/390/412/430 px; unauthenticated and logged-out requests remain blocked. Local fixtures only.');
} finally {
  await browser.close(); await new Promise(done => server.close(done)); await app.close(); globalThis.fetch = realFetch;
}
}
main().catch(error => { console.error(error); process.exit(1); });
