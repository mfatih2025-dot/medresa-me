import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { moduleLoader } from '../scripts/lib/load-typescript.mjs';

// Every database and import in this file is disposable/local. No remote client.
const load = moduleLoader();
const { newDraft, revise } = load('src/admin/model.ts');
const { publicationChecklist, toLocalePublicArticle, localeStatus } = load('src/admin/publication.ts');
const { articles } = load('src/content/vijesti');
const { importArticle } = load('src/admin/import.ts');
const { canonicalJson } = load('src/admin/contracts.ts');
const migration = readFileSync('supabase/migrations/202610080003_locale_publication.sql', 'utf8');
const locales = ['bs', 'sq', 'en'];

async function database(corrected = true) {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  await db.exec(readFileSync('supabase/migrations/202610070001_admin_news.sql', 'utf8'));
  await db.exec(readFileSync('supabase/migrations/202610080002_publication_integrity.sql', 'utf8'));
  if (corrected) await db.exec(migration);
  return db;
}
async function call(db, name, args) {
  const values = args.map((a, i) => name === 'medresa_admin_publish_locales' && i === 2 ? a : typeof a === 'object' ? JSON.stringify(a) : a);
  return (await db.query(`select to_jsonb(public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')})) as result`, values)).rows[0].result;
}
const save = (db, d, expected) => call(db, 'medresa_admin_save', [d, expected, 'local-locale-test']);
const publish = (db, d, selected) => call(db, 'medresa_admin_publish_locales', [d.id, d.revision, selected, Object.fromEntries(selected.map(l => [l, toLocalePublicArticle(d, l)])), 'local-locale-test']);
async function addLocale(db, d, locale, patch = {}) {
  const next = revise(d, {
    date: d.date || '2026-10-07',
    title: { ...d.title, [locale]: `Title ${locale}` }, slug: { ...d.slug, [locale]: `${d.id}-${locale}` },
    blocks: d.blocks.length ? d.blocks.map(b => b.type === 'image' ? b : { ...b, text: { ...b.text, [locale]: `Body ${locale}` } }) : [{ id: 'text-one', type: 'text', text: { bs: '', sq: '', en: '', [locale]: `Body ${locale}` } }], ...patch,
  });
  next.review[locale] = { approved: true, reviewedRevision: next.revision }; next.status = 'ready';
  await save(db, next, d.revision); return next;
}
async function initial(db, id) { const d = newDraft(id); await save(db, d, -1); return d; }
async function state(db) {
  const result = {};
  for (const table of ['articles', 'revisions', 'localizations', 'slug_reservations', 'locale_publications', 'locale_heads']) result[table] = (await db.query(`select to_jsonb(t) as row from medresa_admin_${table} t order by to_jsonb(t)::text`)).rows;
  return result;
}
async function legacyState(db) {
  const result = {};
  for (const table of ['articles', 'assets', 'blocks', 'block_text', 'article_images', 'localizations', 'revisions', 'publications', 'publication_metadata', 'slug_reservations']) result[table] = (await db.query(`select to_jsonb(t) as row from medresa_admin_${table} t order by to_jsonb(t)::text`)).rows;
  result.bucket = (await db.query('select * from storage.buckets')).rows;
  result.functions = (await db.query("select proname,prosrc,proconfig,proacl::text from pg_proc where proname like 'medresa_admin_%' order by proname")).rows;
  return result;
}
function importPlan() { return articles.map((a, i) => ({ document: importArticle(a).draft, snapshot: a, fingerprint: `local-locale-import-${i}`, source_order: i })); }

test('BS alone publishes without a cover or SQ/EN drafts/reviews; date, content and BS review remain mandatory', async () => {
  const db = await database();
  try {
    const d = await addLocale(db, await initial(db, 'bs-only'), 'bs');
    assert.ok(publicationChecklist(d, 'bs').every(c => c.complete));
    assert.ok(publicationChecklist(d, 'sq').some(c => !c.complete));
    const row = await publish(db, d, ['bs']);
    const published = (await db.query('select * from medresa_admin_public_locale_feed')).rows;
    assert.equal(published.length, 1); assert.equal(published[0].locale, 'bs');
    assert.equal(published[0].snapshot.bs.title, d.title.bs); assert.deepEqual(published[0].snapshot.photos, []);
    assert.deepEqual(published[0].snapshot.sq, { title: '', slug: '', body: '' });
    assert.equal(row.document.review.sq.approved, false); assert.equal(row.document.review.en.approved, false);
    assert.equal(localeStatus(row.document, { bs: { snapshot: published[0].snapshot } }, 'bs'), 'published');
    assert.equal(localeStatus(row.document, {}, 'sq'), 'draft');
    const before = await state(db); await assert.rejects(publish(db, row.document, ['sq'])); assert.deepEqual(await state(db), before);
    for (const patch of [{ date: '' }, { date: '2026-02-31' }, { slug: { ...row.document.slug, bs: '2' } }, { title: { ...row.document.title, bs: '' } }]) {
      const candidate = revise(row.document, patch); assert.ok(publicationChecklist(candidate, 'bs').some(c => !c.complete));
    }
    const unreviewed = revise(row.document, { title: { ...row.document.title, bs: 'Changed BS' } });
    await save(db, unreviewed, row.revision); await assert.rejects(publish(db, unreviewed, ['bs']));
  } finally { await db.close(); }
});

test('SQ and EN publish later; SQ updates never change the BS/EN snapshot, date, photos or head', async () => {
  const db = await database();
  try {
    let d = await addLocale(db, await initial(db, 'later-locales'), 'bs');
    let row = await publish(db, d, ['bs']);
    const bs = (await db.query("select * from medresa_admin_public_locale_feed where locale='bs'")).rows[0];
    d = await addLocale(db, row.document, 'sq'); assert.equal(d.review.bs.approved, true);
    row = await publish(db, d, ['sq']);
    assert.deepEqual((await db.query("select * from medresa_admin_public_locale_feed where locale='bs'")).rows[0], bs);
    d = await addLocale(db, row.document, 'en'); row = await publish(db, d, ['en']);
    const en = (await db.query("select * from medresa_admin_public_locale_feed where locale='en'")).rows[0];
    const image = { id: 'archive-locale-extra', src: '/images/local-extra.jpg', width: 1200, height: 800, alt: { bs: '', sq: 'SQ image', en: '' } };
    d = await addLocale(db, row.document, 'sq', { date: '2026-12-01', title: { ...row.document.title, sq: 'Updated SQ' }, images: [image], coverImageId: image.id });
    row = await publish(db, d, ['sq']);
    assert.deepEqual((await db.query("select * from medresa_admin_public_locale_feed where locale='bs'")).rows[0], bs);
    assert.deepEqual((await db.query("select * from medresa_admin_public_locale_feed where locale='en'")).rows[0], en);
    const sq = (await db.query("select * from medresa_admin_public_locale_feed where locale='sq'")).rows[0];
    assert.equal(sq.snapshot.date, '2026-12-01'); assert.equal(sq.snapshot.sq.title, 'Updated SQ'); assert.equal(sq.snapshot.photos.length, 1);
    assert.equal((await db.query('select count(*)::int as n from medresa_admin_locale_publications')).rows[0].n, 4);
    const archived = await call(db, 'medresa_admin_transition', [d.id, row.revision, 'archive', 'local-locale-test']);
    assert.equal((await db.query('select * from medresa_admin_public_locale_feed')).rows.length, 0);
    assert.equal((await db.query('select * from medresa_admin_locale_publication_state')).rows.length, 3);
    const trash = await call(db, 'medresa_admin_transition', [d.id, archived.revision, 'trash', 'local-locale-test']);
    const restore = await call(db, 'medresa_admin_transition', [d.id, trash.revision, 'restore', 'local-locale-test']);
    await call(db, 'medresa_admin_transition', [d.id, restore.revision, 'restore', 'local-locale-test']);
    assert.deepEqual((await db.query("select * from medresa_admin_public_locale_feed where locale='bs'")).rows[0], bs);
  } finally { await db.close(); }
});

test('multi-locale publication is atomic, rejects stale/duplicate/unknown locales and preserves review boundaries', async () => {
  const db = await database();
  try {
    let d = await addLocale(db, await initial(db, 'atomic-locales'), 'bs');
    const before = await state(db); await assert.rejects(publish(db, d, ['bs', 'sq'])); assert.deepEqual(await state(db), before);
    for (const selected of [[], ['bs', 'bs'], ['de'], ['bs', null]]) { await assert.rejects(call(db, 'medresa_admin_publish_locales', [d.id, d.revision, selected, {}, 'local-locale-test'])); assert.deepEqual(await state(db), before); }
    d = await addLocale(db, d, 'sq'); d = await addLocale(db, d, 'en');
    const row = await publish(db, d, locales);
    assert.equal((await db.query('select * from medresa_admin_public_locale_feed')).rows.length, 3);
    const after = await state(db); await assert.rejects(publish(db, d, ['bs']), e => e.code === '40001'); assert.deepEqual(await state(db), after);
    // A raw snapshot cannot publish another locale's draft implicitly.
    const snapshots = { bs: { ...toLocalePublicArticle(row.document, 'bs'), sq: { title: 'Leaked draft', slug: 'leaked', body: 'Draft' } } };
    await assert.rejects(call(db, 'medresa_admin_publish_locales', [d.id, row.revision, ['bs'], snapshots, 'local-locale-test']));
    assert.deepEqual(await state(db), after);
  } finally { await db.close(); }
});

test('published localized slugs remain reserved after draft changes; history and heads cannot be deleted or rewound', async () => {
  const db = await database();
  try {
    const d = await addLocale(db, await initial(db, 'slug-owner-locale'), 'bs'); const p = await publish(db, d, ['bs']);
    const changed = revise(p.document, { slug: { ...p.document.slug, bs: 'unpublished-next-bs' } }); await save(db, changed, p.revision);
    const other = await initial(db, 'locale-contender');
    const before = await state(db); await assert.rejects(save(db, revise(other, { slug: { ...other.slug, bs: d.slug.bs } }), 0), e => e.code === '23505'); assert.deepEqual(await state(db), before);
    for (const sql of ["delete from medresa_admin_locale_publications", "update medresa_admin_locale_publications set source_order=99", "truncate medresa_admin_locale_publications cascade", "delete from medresa_admin_locale_heads", "update medresa_admin_locale_heads set revision=revision", "truncate medresa_admin_locale_heads", "delete from medresa_admin_slug_reservations where published"]) await assert.rejects(db.exec(sql), e => e.code === '55000');
    assert.deepEqual(await state(db), before);
    const feed = (await db.query('select * from medresa_admin_public_locale_feed')).rows[0]; assert.equal(feed.snapshot.bs.slug, d.slug.bs);
  } finally { await db.close(); }
});

test('follow-up preserves all 17 existing articles and original RPCs byte-for-byte; backfills only new history/heads', async () => {
  const db = await database(false);
  try {
    await call(db, 'medresa_admin_import', [importPlan(), 'local-locale-test']);
    const before = await legacyState(db); await db.exec(migration);
    const after = await legacyState(db); after.functions = after.functions.filter(f => before.functions.some(b => b.proname === f.proname));
    assert.deepEqual(after, before);
    assert.equal((await db.query('select * from medresa_admin_locale_heads')).rows.length, 51);
    const feed = (await db.query("select snapshot from medresa_admin_public_locale_feed where locale='bs' order by publication_date desc,article_id desc")).rows.map(r => r.snapshot);
    assert.equal(canonicalJson(feed), canonicalJson(articles));
    await assert.rejects(db.exec(migration), /already exist|triggers are missing or unexpected/); await db.exec('rollback');
    const still = await legacyState(db); still.functions = still.functions.filter(f => before.functions.some(b => b.proname === f.proname)); assert.deepEqual(still, before);
  } finally { await db.close(); }
});

test('future insert-only import remains compatible after the follow-up and publishes all three legacy snapshots', async () => {
  const db = await database();
  try {
    assert.deepEqual(await call(db, 'medresa_admin_import', [importPlan(), 'local-locale-test']), { inserted: 17, skipped: 0 });
    assert.deepEqual(await call(db, 'medresa_admin_import', [importPlan(), 'local-locale-test']), { inserted: 0, skipped: 17 });
    for (const l of locales) {
      const feed = (await db.query('select snapshot from medresa_admin_public_locale_feed where locale=$1 order by publication_date desc,article_id desc', [l])).rows.map(r => r.snapshot);
      assert.equal(canonicalJson(feed), canonicalJson(articles));
    }
    assert.equal((await db.query('select count(*)::int as n from medresa_admin_localizations')).rows[0].n, 51);
  } finally { await db.close(); }
});

test('new locale tables/views/RPCs deny browser access; invoker service role publishes with least privileges', async () => {
  const db = await database(false);
  try {
    await db.exec('alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;');
    await db.exec(migration);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      try {
        for (const table of ['locale_publications', 'locale_heads', 'locale_publication_state', 'public_locale_feed']) await assert.rejects(db.query(`select * from medresa_admin_${table}`));
        await assert.rejects(call(db, 'medresa_admin_publish_locales', ['any', 0, ['bs'], {}, 'attacker']));
      } finally { await db.exec('reset role'); }
    }
    const d = await addLocale(db, await initial(db, 'service-locale'), 'bs');
    await db.exec('set role service_role');
    try {
      await publish(db, d, ['bs']);
      await assert.rejects(db.exec('delete from medresa_admin_locale_publications'), e => e.code === '42501');
      await assert.rejects(db.exec('delete from medresa_admin_locale_heads'), e => e.code === '42501');
    } finally { await db.exec('reset role'); }
    assert.equal((await db.query("select count(*)::int as n from pg_class where relname like 'medresa_admin_%' and relkind='r' and relrowsecurity")).rows[0].n, 12);
  } finally { await db.close(); }
});

test('actual server service selects only requested locales, validates readiness and fails closed when new schema is unavailable', async () => {
  const db = await database();
  let available = true; let publicationCalls = 0;
  const provider = {
    supabaseConfiguration: () => ({ writable: true }),
    backendState: () => ({ state: 'connected', writable: true, message: 'Local fixture' }),
    supabaseRequest: async path => {
      const url = new URL(path, 'https://local.example.test');
      const table = url.pathname.split('/').pop();
      assert.ok(['medresa_admin_articles', 'medresa_admin_locale_publication_state'].includes(table));
      if (!available && table === 'medresa_admin_locale_publication_state') throw new Error('Local missing-schema fixture');
      const id = url.searchParams.get(table === 'medresa_admin_articles' ? 'id' : 'article_id')?.slice(3);
      const result = await db.query(`select * from ${table}${id ? ` where ${table === 'medresa_admin_articles' ? 'id' : 'article_id'}=$1` : ''}`, id ? [id] : []);
      return new Response(JSON.stringify(result.rows), { headers: { 'Content-Type': 'application/json' } });
    },
    rpc: async (name, body) => {
      assert.equal(name, 'medresa_admin_publish_locales'); publicationCalls++;
      return call(db, name, [body.p_id, body.p_expected, body.p_locales, body.p_snapshots, body.p_actor]);
    },
  };
  const server = moduleLoader({ './supabase': provider })('src/server/admin/news.ts');
  try {
    const d = await addLocale(db, await initial(db, 'server-only-bs'), 'bs');
    const published = await server.publishNews(d.id, d.revision, 'local-actor', ['bs']);
    assert.equal(publicationCalls, 1); assert.deepEqual(Object.keys(published.publications), ['bs']);
    assert.equal(published.localePublishingReady, true);
    await assert.rejects(server.publishNews(d.id, published.draft.revision, 'local-actor', ['sq']), e => e.status === 422);
    await assert.rejects(server.publishNews(d.id, published.draft.revision, 'local-actor', ['bs', 'bs']), e => e.status === 422);
    assert.equal(publicationCalls, 1);
    available = false;
    const disabled = await server.getNews(d.id); assert.equal(disabled.localePublishingReady, false);
    await assert.rejects(server.publishNews(d.id, published.draft.revision, 'local-actor', ['bs']), e => e.status === 503);
    assert.equal(publicationCalls, 1);
    assert.equal((await server.listNews()).backend.localePublishingReady, false);
  } finally { await db.close(); }
});
