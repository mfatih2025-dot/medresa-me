import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { moduleLoader } from '../../scripts/lib/load-typescript.mjs';
export const load = moduleLoader();
export const now = new Date('2026-10-08T18:00:00Z');
export const previewRef = 'safsijrhxbefgcahvsvm';
export const providerHost = `https://${previewRef}.supabase.co`;
export const fixtureEnvironment = {
  VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/admin-panel', SUPABASE_URL: providerHost,
  MEDRESA_SUPABASE_PROJECT_REF: previewRef, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_local-analytics-fixture', MEDRESA_SUPABASE_WRITE_ENABLED: 'true',
};
export function reports(period = '7', date = now) {
  const { blank, success } = load('src/server/admin/analytics/common');
  return ['website','instagram','facebook','youtube'].map(p => {
    const r = success(blank(p, period, date, ['facebook','youtube'].includes(p) ? 'America/Los_Angeles' : 'UTC', true), date);
    const key = p === 'website' ? 'pageviews' : 'views';
    r.totals = { [key]: 70 }; r.previousTotals = { [key]: 35 };
    r.daily = load('src/admin/analytics/period').days(r.range).map(day => ({ date: day, metrics: { [key]: 10 }, complete: true }));
    return r;
  });
}
export async function database({ providerSync = true } = {}) {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  for (const migration of ['202610070001_admin_news','202610080002_publication_integrity','202610080003_locale_publication','202610080004_analytics_history']) await db.exec(readFileSync(`supabase/migrations/${migration}.sql`, 'utf8'));
  if (providerSync) await db.exec(readFileSync('supabase/migrations/202610090001_analytics_provider_sync.sql', 'utf8'));
  return db;
}
export async function call(db, name, args) {
  const values = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a);
  return (await db.query(`select to_jsonb(${name}(${values.map((_,i) => '$' + (i+1)).join(',')})) as result`, values)).rows[0].result;
}
export const begin = (db,id,period='7',provider) => call(db,'medresa_analytics_begin_sync',[id,period,...(provider === undefined ? [] : [provider])]);
export const finish = (db,id,r) => call(db,'medresa_analytics_complete_sync',[id,r]);
export async function releaseCooldown(db) { await db.exec("update medresa_analytics_sync_lock set last_started_at=now()-interval '3 minutes'"); }
// In-memory adapter: no request is sent to Supabase. Only Analytics tables/RPCs allowed.
export function restFixture(db) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.origin !== providerHost) throw new Error('External request forbidden by local fixture');
    const json = (b, status=200) => new Response(JSON.stringify(b),{status,headers:{'Content-Type':'application/json'}});
    try {
      const name = url.pathname.split('/').pop();
      if (url.pathname.startsWith('/rest/v1/rpc/')) {
        const b = JSON.parse(init.body);
        if (name === 'medresa_analytics_begin_sync') return json(await begin(db,b.p_id,b.p_period,b.p_provider));
        if (name === 'medresa_analytics_complete_sync') {await finish(db,b.p_id,b.p_reports);return new Response(null,{status:204});}
        throw new Error('Unapproved local RPC');
      }
      if (!/^medresa_analytics_(daily|reports|provider_state|sync_runs|sync_lock)$/.test(name)) throw new Error('Unapproved local table');
      if (init.method && init.method !== 'GET') throw new Error('Direct table writes forbidden');
      const args=[],clauses=[];
      for (const [k,v] of url.searchParams) {
        if (['provider','start_date','end_date','timezone','day'].includes(k)) {
          const op = v.startsWith('eq.') ? '=' : v.startsWith('gte.') ? '>=' : null;
          if (op) { args.push(v.slice(v.indexOf('.')+1)); clauses.push(`${k}${op}$${args.length}`); }
        }
        if (k === 'and' && /^\(day\.lte\.\d{4}-\d{2}-\d{2}\)$/.test(v)) { args.push(v.slice(9,-1)); clauses.push(`day<=$${args.length}`); }
      }
      const selected = url.searchParams.get('select') || '*';
      if (!/^[a-z_,*]+$/.test(selected)) throw new Error('Invalid columns');
      const order=url.searchParams.get('order');
      const orderSql=order==='day.asc'?' order by day asc':order==='started_at.desc'?' order by started_at desc':'';
      const rows=(await db.query(`select ${selected} from ${name}${clauses.length?' where '+clauses.join(' and '):''}${orderSql}`,args)).rows;
      // PGlite returns SQL DATE as Date; PostgREST delivers YYYY-MM-DD strings.
      return json(rows.slice(0,Number(url.searchParams.get('limit') || rows.length)).map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,['day','start_date','end_date'].includes(key)&&value instanceof Date?value.toISOString().slice(0,10):value]))));
    } catch (e) { return json({ code: e.code || 'local-fixture-error' },500); }
  };
}
