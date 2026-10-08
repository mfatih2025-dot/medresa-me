import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

// Disposable local databases only. No provider client, env credentials or remote SQL.
const load = moduleLoader();
const { newDraft, revise } = load("src/admin/model.ts");
const { toPublicArticle } = load("src/admin/publication.ts");
const locales = ["bs", "sq", "en"];
const localized = value => Object.fromEntries(locales.map(l => [l, `${value}-${l}`]));
const correction = readFileSync("supabase/migrations/202610080002_publication_integrity.sql", "utf8");
const base = readFileSync("supabase/migrations/202610070001_admin_news.sql", "utf8");
const image = { id: "archive-integrity-fixture", src: "/images/local-fixture.jpg", width: 1200, height: 800, alt: localized("Image") };
const originalTables = ["assets", "articles", "localizations", "blocks", "block_text", "article_images", "revisions", "publications"];

async function database(corrected = true) {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
  await db.exec(base);
  // Represent the supplied Preview inventory, including Supabase's broader
  // service-role default privileges. Browser grants/policies remain absent.
  await db.exec(`grant all on ${originalTables.map(t => `public.medresa_admin_${t}`).join(",")},public.medresa_admin_public_feed to service_role`);
  await db.exec("alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;");
  if (corrected) await db.exec(correction);
  return db;
}
async function call(db, name, args) {
  return (await db.query(`select to_jsonb(public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")})) as result`, args.map(a => typeof a === "object" ? JSON.stringify(a) : a))).rows[0].result;
}
const save = (db, d, expected) => call(db, "medresa_admin_save", [d, expected, "local-integrity-test"]);
const publish = (db, d, snapshot = toPublicArticle(d)) => call(db, "medresa_admin_publish", [d.id, d.revision, snapshot, "local-integrity-test"]);
const transition = (db, row, action) => call(db, "medresa_admin_transition", [row.id, row.revision, action, "local-integrity-test"]);
async function ready(db, id, slug = id, date = "2026-10-07") {
  const initial = newDraft(id);
  await save(db, initial, -1);
  const d = revise(initial, {
    title: localized("Title"), slug: localized(slug), lead: localized("Lead"), date,
    images: [image], coverImageId: image.id,
    blocks: [
      { id: "text-1", type: "text", text: localized("Text") },
      { id: "image-1", type: "image", assetId: image.id },
      { id: "quote-1", type: "quote", text: localized("Quote") },
      { id: "image-2", type: "image", assetId: image.id },
      { id: "subheading-1", type: "subheading", text: localized("Subheading") },
    ],
  });
  d.status = "ready";
  d.review = Object.fromEntries(locales.map(l => [l, { approved: true, reviewedRevision: d.revision }]));
  await save(db, d, 0);
  return d;
}
async function preservedState(db) {
  const result = {};
  for (const table of originalTables) {
    result[table] = (await db.query(`select to_jsonb(t) as value from public.medresa_admin_${table} t order by to_jsonb(t)::text`)).rows;
  }
  result.storage = (await db.query("select * from storage.buckets order by id")).rows;
  result.functions = (await db.query("select proname,prosrc,proconfig,prosecdef,proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname in ('medresa_admin_project','medresa_admin_save','medresa_admin_publish','medresa_admin_transition','medresa_admin_import') order by proname")).rows;
  return result;
}
async function applyFailure(db, pattern) {
  const before = await preservedState(db);
  await assert.rejects(db.exec(correction), pattern);
  await db.exec("rollback");
  assert.deepEqual(await preservedState(db), before);
  assert.equal((await db.query("select to_regclass('public.medresa_admin_slug_reservations') as relation")).rows[0].relation, null);
  assert.equal((await db.query("select to_regclass('public.medresa_admin_publication_metadata') as relation")).rows[0].relation, null);
}

test("follow-up backfills historical ownership and ordering without changing any existing data, RPC, or Storage row", async () => {
  const db = await database(false);
  try {
    const d = await ready(db, "preserved-article", "published-original");
    await db.query("update medresa_admin_articles set source_order=7 where id=$1", [d.id]);
    const p = await publish(db, d);
    const edit = revise(p.document, { slug: localized("unpublished-edit"), date: "2026-12-01" });
    await save(db, edit, p.revision);
    const before = await preservedState(db);
    await db.exec(correction);
    assert.deepEqual(await preservedState(db), before);
    const owners = (await db.query("select * from medresa_admin_slug_reservations order by locale,slug")).rows;
    assert.equal(owners.length, 6);
    assert.equal(owners.filter(r => r.published).length, 3);
    assert.ok(owners.every(r => r.article_id === d.id));
    const feed = (await db.query("select * from medresa_admin_public_feed")).rows[0];
    assert.equal(feed.publication_date, d.date);
    assert.equal(feed.source_order, 7);
    assert.deepEqual(feed.snapshot, toPublicArticle(d));
    const reapplied = await preservedState(db);
    await assert.rejects(db.exec(correction), /Unexpected base security or triggers|Correction objects already exist/);
    await db.exec("rollback");
    assert.deepEqual(await preservedState(db), reapplied);
  } finally { await db.close(); }
});

test("published BS/SQ/EN slugs cannot be claimed after draft changes, republication, archive, trash or restore", async () => {
  const db = await database();
  try {
    const d = await ready(db, "slug-owner", "original-slug");
    let row = await publish(db, d);
    const edit = revise(row.document, { slug: localized("next-slug") });
    await save(db, edit, row.revision);
    for (const l of locales) {
      const other = newDraft(`other-${l}`);
      await save(db, other, -1);
      const candidate = revise(other, { slug: { ...localized(`other-${l}`), [l]: d.slug[l] } });
      const before = await preservedState(db);
      await assert.rejects(save(db, candidate, 0), error => error.code === "23505");
      assert.deepEqual(await preservedState(db), before);
      assert.equal((await db.query("select * from medresa_admin_slug_reservations where article_id=$1", [other.id])).rows.length, 0);
    }
    const approved = { ...edit, status: "ready", review: Object.fromEntries(locales.map(l => [l, { approved: true, reviewedRevision: edit.revision }])) };
    // A changed review is itself a new saved revision, as in the real editor.
    approved.revision++;
    for (const l of locales) approved.review[l].reviewedRevision = approved.revision;
    await save(db, approved, edit.revision);
    row = await publish(db, approved);
    const other = newDraft("lifecycle-collision");
    await save(db, other, -1);
    for (const action of ["archive", "trash", "restore", "restore"]) {
      row = await transition(db, row, action);
      await assert.rejects(save(db, revise(other, { slug: d.slug }), 0), error => error.code === "23505");
      await assert.rejects(save(db, revise(other, { slug: approved.slug }), 0), error => error.code === "23505");
    }
    // The same article can reuse its own old URL; ownership is never transferred.
    const ownOldSlug = revise(row.document, { slug: d.slug });
    await save(db, ownOldSlug, row.revision);
    const reserved = (await db.query("select * from medresa_admin_slug_reservations where article_id=$1", [d.id])).rows;
    assert.equal(reserved.length, 6);
    assert.ok(reserved.every(r => r.published));
  } finally { await db.close(); }
});

test("never-published draft slugs are released normally; repeated shared images and block order are preserved", async () => {
  const db = await database();
  try {
    const first = await ready(db, "draft-one", "draft-only");
    const changed = revise(first, { slug: localized("replacement-draft") });
    await save(db, changed, first.revision);
    const second = await ready(db, "draft-two", "draft-only");
    const p = await publish(db, second);
    assert.equal(p.document.images.length, 1);
    assert.equal(p.document.blocks.filter(b => b.type === "image").length, 2);
    const projected = (await db.query("select id,position,asset_id from medresa_admin_blocks where article_id=$1 order by position", [second.id])).rows;
    assert.deepEqual(projected.map(r => r.id), second.blocks.map(b => b.id));
    assert.ok(projected.filter(r => r.asset_id).every(r => r.asset_id === image.id));
    assert.equal((await db.query("select * from medresa_admin_assets")).rows.length, 1);
  } finally { await db.close(); }
});

test("unpublished date, source order and presentation edits cannot alter public metadata or newest-first ordering", async () => {
  const db = await database();
  try {
    const a = await ready(db, "feed-a", "feed-a", "2026-10-07");
    const b = await ready(db, "feed-b", "feed-b", "2026-10-08");
    await db.query("update medresa_admin_articles set source_order=3 where id=$1", [a.id]);
    const published = await publish(db, a);
    await publish(db, b);
    const feed = () => db.query("select * from medresa_admin_public_feed order by publication_date desc,id desc");
    const before = (await feed()).rows;
    assert.deepEqual(before.map(r => r.id), [b.id, a.id]);
    const extra = { ...image, id: "archive-second-fixture", src: "/images/second-local-fixture.jpg" };
    const edited = revise(published.document, {
      date: "2026-12-01", title: localized("Unpublished title"), lead: localized("Unpublished lead"),
      slug: localized("unpublished-slug"), images: [image, extra], coverImageId: extra.id,
      blocks: [{ id: "different-text", type: "text", text: localized("Unpublished body") }], topic: "culture",
    });
    await save(db, edited, published.revision);
    await db.query("update medresa_admin_articles set source_order=999 where id=$1", [a.id]);
    assert.deepEqual((await feed()).rows, before);
    let row = (await db.query("select * from medresa_admin_articles where id=$1", [a.id])).rows[0];
    row = await transition(db, row, "archive");
    assert.deepEqual((await feed()).rows.map(r => r.id), [b.id]);
    await transition(db, row, "restore");
    assert.deepEqual((await feed()).rows, before);
  } finally { await db.close(); }
});

test("publication failures roll back snapshots, revision history, registry claims and publication metadata together", async () => {
  const db = await database();
  try {
    const d = await ready(db, "atomic-publication");
    const malformed = toPublicArticle(d);
    delete malformed.date; // The table guard must reject NULL as well as invalid dates.
    const before = await preservedState(db);
    const reservations = (await db.query("select * from medresa_admin_slug_reservations order by locale,slug")).rows;
    await assert.rejects(publish(db, d, malformed));
    assert.deepEqual(await preservedState(db), before);
    assert.deepEqual((await db.query("select * from medresa_admin_slug_reservations order by locale,slug")).rows, reservations);
    assert.equal((await db.query("select * from medresa_admin_publication_metadata")).rows.length, 0);
    const owner = await ready(db, "atomic-owner", "taken-slug");
    await publish(db, owner);
    const collision = toPublicArticle(d);
    collision.en.slug = owner.slug.en;
    // Exercise the DB boundary directly too, independent of RPC validation.
    await assert.rejects(db.query("insert into medresa_admin_publications values($1,50,$2,'local-test',now())", [d.id, JSON.stringify(collision)]), error => error.code === "23505");
    assert.equal((await db.query("select * from medresa_admin_publications where article_id=$1", [d.id])).rows.length, 0);
    assert.ok((await db.query("select * from medresa_admin_slug_reservations where article_id=$1", [d.id])).rows.every(r => !r.published));
    await publish(db, d);
    await assert.rejects(publish(db, d), error => error.code === "40001");
  } finally { await db.close(); }
});

test("conflicting historical publications or a different owner's current draft abort the entire follow-up", async () => {
  for (const secondPublished of [false, true]) {
    const db = await database(false);
    try {
      const a = await ready(db, "conflict-a", "conflict-slug");
      const p = await publish(db, a);
      await save(db, revise(p.document, { slug: localized("changed-conflict-slug") }), p.revision);
      const b = await ready(db, "conflict-b", "conflict-slug");
      if (secondPublished) await publish(db, b);
      await applyFailure(db, /Conflicting current\/historical slug owners/);
    } finally { await db.close(); }
  }
});

test("invalid existing snapshots, partial schemas and unsafe browser grants fail without repairing or recreating anything", async () => {
  const invalid = await database(false);
  try {
    const d = await ready(invalid, "invalid-history");
    const snapshot = toPublicArticle(d); snapshot.date = "2026-02-30";
    await invalid.query("insert into medresa_admin_publications values($1,90,$2,'local-test',now())", [d.id, JSON.stringify(snapshot)]);
    await applyFailure(invalid, /date\/time field value out of range|Invalid existing publication date/);
  } finally { await invalid.close(); }
  const insecure = await database(false);
  try {
    await insecure.exec("grant select on medresa_admin_articles to anon");
    await applyFailure(insecure, /Unexpected base security or triggers/);
    assert.equal((await insecure.query("select has_table_privilege('anon','medresa_admin_articles','SELECT') as allowed")).rows[0].allowed, true);
  } finally { await insecure.close(); }
  const partial = new PGlite();
  try {
    await partial.exec("create role anon; create role authenticated; create role service_role; create table medresa_admin_articles(id text primary key); insert into medresa_admin_articles values('retained-local-fixture');");
    await assert.rejects(partial.exec(correction), /Missing base table or RLS/);
    await partial.exec("rollback");
    assert.deepEqual((await partial.query("select * from medresa_admin_articles")).rows, [{ id: "retained-local-fixture" }]);
    assert.equal((await partial.query("select to_regclass('medresa_admin_slug_reservations') as relation")).rows[0].relation, null);
  } finally { await partial.close(); }
});

test("RLS, server-only trigger permissions, immutable history and service-role RPC compatibility are retained", async () => {
  const db = await database();
  try {
    const rls = (await db.query("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relname like 'medresa_admin_%' and relkind='r'")).rows;
    assert.equal(rls.length, 10); assert.ok(rls.every(r => r.relrowsecurity));
    assert.equal((await db.query("select * from pg_policies where schemaname='public' and tablename like 'medresa_admin_%'")).rows.length, 0);
    assert.equal((await db.query("select has_table_privilege('service_role','medresa_admin_publication_metadata','UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as allowed")).rows[0].allowed, false);
    assert.equal((await db.query("select has_table_privilege('service_role','medresa_admin_slug_reservations','TRUNCATE,REFERENCES,TRIGGER') as allowed")).rows[0].allowed, false);
    for (const role of ["anon", "authenticated"]) {
      const funcs = (await db.query("select has_function_privilege($1,p.oid,'EXECUTE') as allowed,prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'medresa_admin_%'", [role])).rows;
      assert.equal(funcs.length, 9); assert.ok(funcs.every(r => !r.allowed && !r.prosecdef));
      await db.exec(`set role ${role}`);
      try {
        for (const table of ["medresa_admin_slug_reservations", "medresa_admin_publication_metadata", "medresa_admin_public_feed"]) {
          await assert.rejects(db.query(`select * from public.${table}`), error => error.code === "42501");
          assert.equal((await db.query("select has_table_privilege(current_user,$1,'DELETE') as allowed", [table])).rows[0].allowed, false);
          if (table !== "medresa_admin_public_feed") await assert.rejects(db.query(`delete from public.${table}`), error => error.code === "42501");
        }
      } finally { await db.exec("reset role"); }
    }
    await db.exec("set role service_role");
    let p;
    try { p = await publish(db, await ready(db, "service-compatible")); }
    finally { await db.exec("reset role"); }
    const before = await preservedState(db);
    for (const sql of [
      "update medresa_admin_publications set snapshot='{}'::jsonb",
      "delete from medresa_admin_publications",
      "truncate medresa_admin_publications cascade",
      "update medresa_admin_publication_metadata set source_order=55",
      "delete from medresa_admin_publication_metadata",
      "truncate medresa_admin_publication_metadata",
      "delete from medresa_admin_slug_reservations where published",
      "update medresa_admin_slug_reservations set published=false where published",
      "update medresa_admin_slug_reservations set article_id='different' where published",
      "truncate medresa_admin_slug_reservations",
    ]) {
      await assert.rejects(db.exec(sql), error => error.code === "55000");
    }
    assert.deepEqual(await preservedState(db), before);
    assert.deepEqual((await db.query("select snapshot from medresa_admin_public_feed where id=$1", [p.id])).rows[0].snapshot, toPublicArticle(p.document));
  } finally { await db.close(); }
});
