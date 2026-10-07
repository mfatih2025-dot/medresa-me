import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";
const load = moduleLoader();
const { articles } = load("src/content/vijesti");
const { importArticle } = load("src/admin/import.ts");
const { canonicalJson } = load("src/admin/contracts.ts");
const { newDraft, revise } = load("src/admin/model.ts");
const { toPublicArticle } = load("src/admin/publication.ts");
const plan = articles.map((a, i) => ({ document: importArticle(a).draft, snapshot: a, fingerprint: createHash("sha256").update(canonicalJson(a)).digest("hex"), source_order: i }));
async function database() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
  await db.exec(readFileSync("supabase/migrations/202610070001_admin_news.sql", "utf8"));
  return db;
}
async function call(db, name, args) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(",");
  const values = args.map(a => typeof a === "object" ? JSON.stringify(a) : a);
  return (await db.query(`select to_jsonb(public.${name}(${placeholders})) as result`, values)).rows[0].result;
}
test("additive SQL executes; verified import is atomic, insert-only, idempotent and preserves all 17 snapshots", async () => {
  const db = await database();
  try {
    assert.deepEqual(await call(db, "medresa_admin_import", [plan, "test-fixture"]), { inserted: 17, skipped: 0 });
    assert.deepEqual(await call(db, "medresa_admin_import", [plan, "test-fixture"]), { inserted: 0, skipped: 17 });
    const rows = (await db.query("select snapshot from public.medresa_admin_public_feed order by publication_date desc,id desc")).rows;
    assert.deepEqual(rows.map(r => r.snapshot), articles);
    assert.equal((await db.query("select count(*)::int as n from medresa_admin_localizations")).rows[0].n, 51);
    const conflict = structuredClone(plan); conflict[8].fingerprint = "different";
    await assert.rejects(call(db, "medresa_admin_import", [conflict, "test-fixture"]));
    assert.equal((await db.query("select count(*)::int as n from medresa_admin_articles")).rows[0].n, 17);
    assert.equal((await db.query("select public from storage.buckets")).rows[0].public, false);
  } finally { await db.close(); }
});
test("persistent drafts, optimistic conflicts, publication validation, snapshots, archive/trash/restore and retained images", async () => {
  const db = await database();
  try {
    const legacy = plan.find(p => p.document.images.length);
    await call(db, "medresa_admin_import", [plan, "test-fixture"]);
    const initial = newDraft("database-test-article");
    await call(db, "medresa_admin_save", [initial, -1, "test-fixture"]);
    const original = legacy.document.images[0];
    const d = revise(initial, { title: { bs: "Test", sq: "Test", en: "Test" }, slug: { bs: "test-news", sq: "test-news", en: "test-news" }, date: "2026-10-07", coverImageId: original.id, images: [original], blocks: [{ id: "t1", type: "text", text: { bs: "Text", sq: "Text", en: "Text" } }] });
    await call(db, "medresa_admin_save", [d, 0, "test-fixture"]);
    await assert.rejects(call(db, "medresa_admin_save", [d, 0, "test-fixture"]));
    await assert.rejects(call(db, "medresa_admin_publish", [d.id, d.revision, toPublicArticle(d), "test-fixture"]));
    const approved = { ...d, revision: 2, status: "ready", review: Object.fromEntries(["bs", "sq", "en"].map(l => [l, { approved: true, reviewedRevision: 2 }])) };
    await call(db, "medresa_admin_save", [approved, 1, "test-fixture"]);
    const published = await call(db, "medresa_admin_publish", [d.id, 2, toPublicArticle(approved), "test-fixture"]);
    assert.equal(published.status, "published"); assert.equal(published.revision, 3); assert.equal(published.published_revision, 3);
    const newer = revise(published.document, { title: { ...published.document.title, bs: "Unpublished edit" } });
    await call(db, "medresa_admin_save", [newer, 3, "test-fixture"]);
    assert.equal((await db.query("select snapshot from medresa_admin_public_feed where id=$1", [d.id])).rows[0].snapshot.bs.title, "Test");
    const archived = await call(db, "medresa_admin_transition", [d.id, newer.revision, "archive", "test-fixture"]);
    assert.ok(archived.archived_at); assert.equal((await db.query("select * from medresa_admin_public_feed where id=$1", [d.id])).rows.length, 0);
    const trashed = await call(db, "medresa_admin_transition", [d.id, archived.revision, "trash", "test-fixture"]);
    assert.ok(trashed.deleted_at);
    const restored = await call(db, "medresa_admin_transition", [d.id, trashed.revision, "restore", "test-fixture"]);
    assert.equal(restored.deleted_at, null); assert.ok(restored.archived_at);
    const active = await call(db, "medresa_admin_transition", [d.id, restored.revision, "restore", "test-fixture"]);
    assert.equal(active.archived_at, null);
    assert.equal((await db.query("select snapshot from medresa_admin_public_feed where id=$1", [d.id])).rows.length, 1);
    assert.equal((await db.query("select id from medresa_admin_assets where id=$1", [original.id])).rows.length, 1);
    const duplicate = revise(newDraft("duplicate-slug"), { slug: { ...approved.slug } });
    await call(db, "medresa_admin_save", [newDraft(duplicate.id), -1, "test-fixture"]);
    await assert.rejects(call(db, "medresa_admin_save", [duplicate, 0, "test-fixture"]));
    const saved = (await db.query("select document from medresa_admin_articles where id=$1", [duplicate.id])).rows[0].document;
    assert.equal(saved.slug.bs, ""); // failed transaction preserved the earlier draft
  } finally { await db.close(); }
});
test("anonymous and authenticated browser roles cannot read tables or execute editorial RPCs", async () => {
  const db = await database();
  try {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await assert.rejects(db.query("select * from public.medresa_admin_articles"));
        await assert.rejects(db.query("select public.medresa_admin_transition('any',0,'trash','attacker')"));
        await assert.rejects(db.query("select * from public.medresa_admin_public_feed"));
      } finally { await db.exec("reset role"); }
    }
    const rls = (await db.query("select relrowsecurity from pg_class where relname like 'medresa_admin_%' and relkind='r'")).rows;
    assert.equal(rls.length, 8); assert.ok(rls.every(r => r.relrowsecurity));
  } finally { await db.close(); }
});
