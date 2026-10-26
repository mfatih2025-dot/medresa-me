import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';
import { database, restFixture, fixtureEnvironment } from './fixtures/analytics.mjs';
const before = { ...process.env }, originalFetch = globalThis.fetch;
afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key];
  Object.assign(process.env, before); globalThis.fetch = originalFetch;
});
const load = moduleLoader();
const { publicAnalyticsUrl } = load('src/admin/analytics/publicTraffic');
test('only canonical HTTPS public URLs are collected; apex, aliases, locale-prefixed admin and APIs are excluded', () => {
  for (const path of ['/', '/upis', '/sq/regjistrimi', '/en/history', '/vijesti/clanak?x=1#y']) assert.equal(publicAnalyticsUrl('https://www.medresa.me' + path), true, path);
  for (const value of ['https://medresa.me/upis', 'http://www.medresa.me/', 'https://preview.vercel.app/', 'https://www.medresa.me.evil.test/', 'https://www.medresa.me:8443/', 'https://user@www.medresa.me/', '/upis', 'invalid']) assert.equal(publicAnalyticsUrl(value), false, value);
  for (const path of ['/ulaz7', '/ulaz7/login', '/admin', '/admin-preview/article', '/api/admin/analytics', '/en/ulaz7', '/sq/admin-preview/article', '/bs/%61dmin', '/en/%2fadmin', '/%zz']) assert.equal(publicAnalyticsUrl('https://www.medresa.me' + path), false, path);
});
test('public shell enables a single tracker only for Vercel Production; it does not depend on database configuration', () => {
  let trackers = 0;
  const component = () => null;
  const shellLoad = moduleLoader({
    'next/font/google': { Kanit: () => ({ variable: 'test-font' }) }, '../globals.css': {},
    '@/components/analytics/PublicAnalytics': { PublicAnalytics: () => { trackers++; return null; } },
    '@/components/campaigns/CampaignPopup': { CampaignPopup: component },
    '@/components/layout/Footer': { Footer: component }, '@/components/layout/Header': { Header: component },
    '@/components/i18n/Gateway': { Gateway: component }, '@/components/i18n/SkipLink': { SkipLink: component },
  });
  const { Shell } = shellLoad('src/app/_shell/Shell');
  for (const environment of ['preview', 'development', undefined]) {
    if (environment) process.env.VERCEL_ENV = environment; else delete process.env.VERCEL_ENV;
    renderToStaticMarkup(React.createElement(Shell, { locale: 'bs' }, 'content')); assert.equal(trackers, 0);
  }
  process.env.VERCEL_ENV = 'production';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  renderToStaticMarkup(React.createElement(Shell, { locale: 'bs' }, 'content')); assert.equal(trackers, 1);
});
test('canonical Website requires a verified cutover and never silently falls back to project-wide history', async () => {
  Object.assign(process.env, fixtureEnvironment, { VERCEL_ANALYTICS_TOKEN: 'local-scope-fixture' });
  const { collectProvider } = load('src/server/admin/analytics/providers');
  let calls = 0; globalThis.fetch = async () => { calls++; throw Error('Network forbidden'); };
  for (const since of [undefined, 'invalid', '2026-02-31T00:00:00Z', '2099-01-01T00:00:00Z']) {
    if (since) process.env.MEDRESA_ANALYTICS_WEB_TRACKING_SINCE = since; else delete process.env.MEDRESA_ANALYTICS_WEB_TRACKING_SINCE;
    const r = await collectProvider('website', '7', new Date('2026-10-26T12:00:00Z'), new AbortController().signal);
    assert.equal(r.reason, 'tracking_unavailable'); assert.equal(r.fetchedAt, null); assert.deepEqual(r.totals, {});
  }
  assert.equal(calls, 0);
});
test('every Website query starts after canonical cutover; comparisons before collection are unavailable, not fake zeros', async () => {
  Object.assign(process.env, fixtureEnvironment, { VERCEL_ANALYTICS_TOKEN: 'local-scope-fixture', MEDRESA_ANALYTICS_WEB_TRACKING_SINCE: '2026-10-26T10:23:45Z', MEDRESA_ANALYTICS_WEB_TRACKING_START: '2026-01-01' });
  const requests = [];
  globalThis.fetch = async input => {
    const u = new URL(input); requests.push(u);
    assert.equal(u.hostname, 'api.vercel.com');
    if (u.pathname.startsWith('/v9/projects/')) return Response.json({ id: 'prj_local', name: 'medresa-me' });
    assert.ok(Date.parse(u.searchParams.get('since')) >= Date.parse(process.env.MEDRESA_ANALYTICS_WEB_TRACKING_SINCE));
    assert.ok(!u.searchParams.get('filter').includes('requestHostname'), 'Unsupported dimensions must not break the API');
    return Response.json({ data: u.searchParams.get('by') === 'environment' ? [{ pageviews: 3, visitors: 2 }] : [] });
  };
  const r = await load('src/server/admin/analytics/providers').collectProvider('website', 'today', new Date('2026-10-26T12:00:00Z'), new AbortController().signal);
  assert.deepEqual(r.totals, { pageviews: 3, visitors: 2 }); assert.deepEqual(r.previousTotals, {}); assert.deepEqual(r.yesterday.metrics, {});
  assert.equal(r.source, 'Vercel Web Analytics · www.medresa.me'); assert.ok(requests.length > 3);
});

test('missing canonical migration blocks sync before provider requests or writes', async () => {
  Object.assign(process.env, fixtureEnvironment, { VERCEL_ANALYTICS_TOKEN: 'local-scope-fixture' });
  const db = await database();
  try {
    await db.exec('drop function medresa_analytics_canonical_ready()');
    const adapter = restFixture(db); let providerCalls = 0;
    globalThis.fetch = async (input, init) => {
      if (new URL(input).hostname.endsWith('.supabase.co')) return adapter(input, init);
      providerCalls++; throw Error('Provider must not be contacted');
    };
    const { synchronize } = load('src/server/admin/analytics/service');
    await assert.rejects(synchronize('7', '00000000-0000-4000-8000-000000000001', 'website'), /202610260001/);
    assert.equal(providerCalls, 0);
    assert.equal((await db.query('select count(*)::int n from medresa_analytics_sync_runs')).rows[0].n, 0);
  } finally { await db.close(); }
});

test('daily grouping cannot round the cutover back into another hostname history on the partial first day', async () => {
  Object.assign(process.env, fixtureEnvironment, { VERCEL_ANALYTICS_TOKEN: 'local-scope-fixture', MEDRESA_ANALYTICS_WEB_TRACKING_SINCE: '2026-10-25T10:23:45Z' });
  let dailySince, yesterdaySince;
  globalThis.fetch = async input => {
    const u=new URL(input);
    if(u.pathname.startsWith('/v9/')) return Response.json({id:'prj_local',name:'medresa-me'});
    if(u.searchParams.get('by')==='day') dailySince=u.searchParams.get('since');
    if(u.searchParams.get('until')==='2026-10-25T23:59:59.999Z'&&u.searchParams.get('by')==='environment') yesterdaySince=u.searchParams.get('since');
    return Response.json({data:u.searchParams.get('by')==='environment'?[{pageviews:3,visitors:2}]:[]});
  };
  const r=await load('src/server/admin/analytics/providers').collectProvider('website','today',new Date('2026-10-26T12:00:00Z'),new AbortController().signal);
  assert.equal(dailySince,'2026-10-26T00:00:00Z');
  assert.equal(yesterdaySince,'2026-10-25T10:23:45.000Z');
  assert.equal(r.yesterday.complete,false,'The first partial day is never labelled complete');
  assert.deepEqual(r.yesterday.metrics,{pageviews:3,visitors:2});
});
