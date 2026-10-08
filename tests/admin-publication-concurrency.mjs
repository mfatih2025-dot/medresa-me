import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { moduleLoader } from "../scripts/lib/load-typescript.mjs";

// Optional real PostgreSQL multi-session test. Requires a cached postgres:17-bookworm
// image and the local Docker socket. No host ports, provider credentials, remote
// connections, persistent volume, image pull or application environment changes.
const dockerEnv = { ...process.env };
for (const key of ["DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete dockerEnv[key];
const dockerArgs = ["--host=unix:///var/run/docker.sock"];
const name = `medresa-integrity-test-${randomUUID()}`;
const sync = args => execFileSync("docker", [...dockerArgs, ...args], { env: dockerEnv, encoding: "utf8", timeout: 30000 });
const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const json = value => `${literal(JSON.stringify(value))}::jsonb`;
function sql(statement) {
  return new Promise(resolve => {
    const child = execFile("docker", [...dockerArgs, "exec", "-i", name, "psql", "-X", "-q", "-t", "-A", "-U", "postgres", "-d", "medresa_integrity_test", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"], { env: dockerEnv, timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => resolve({ success: !error, stdout: stdout.trim(), stderr }));
    child.stdin.end(statement);
  });
}
async function checked(statement) {
  const result = await sql(statement);
  assert.ok(result.success, result.stderr);
  return result.stdout;
}
async function until(statement) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if ((await sql(statement)).stdout === "t") return;
    await pause(30);
  }
  throw new Error("Local PostgreSQL concurrency synchronization timed out");
}
const load = moduleLoader();
const { newDraft, revise } = load("src/admin/model.ts");
const { toPublicArticle } = load("src/admin/publication.ts");
const localized = value => ({ bs: `${value}-bs`, sq: `${value}-sq`, en: `${value}-en` });
const saveSql = (d, expected) => `select to_jsonb(medresa_admin_save(${json(d)},${expected},'local-concurrency-test'));`;
async function initial(id) {
  const d = newDraft(id);
  await checked(saveSql(d, -1));
  return d;
}
async function competingTransactions(label, ownerStatements, contenderStatements, ownerEnd = "commit", contenderSucceeds = false) {
  const ownerName = `${label}-owner`;
  const contenderName = `${label}-contender`;
  const owner = sql(`set application_name=${literal(ownerName)}; begin; set local role service_role; ${ownerStatements} select pg_sleep(2); ${ownerEnd};`);
  // Establish the exact interleaving: the first session has claimed its slug,
  // but its transaction is uncommitted before the second session starts.
  await until(`select exists(select 1 from pg_stat_activity where application_name=${literal(ownerName)} and wait_event='PgSleep');`);
  const contender = sql(`set application_name=${literal(contenderName)}; set role service_role; ${contenderStatements}`);
  await until(`select exists(select 1 from pg_stat_activity where application_name=${literal(contenderName)} and wait_event_type='Lock');`);
  const [first, second] = await Promise.all([owner, contender]);
  assert.ok(first.success, first.stderr);
  assert.equal(second.success, contenderSucceeds, second.stderr);
  if (!contenderSucceeds) assert.match(second.stderr, /23505/);
}

sync(["image", "inspect", "postgres:17-bookworm", "--format", "{{.Id}}"]);
let running = false;
try {
  sync(["run", "--detach", "--rm", "--network", "none", "--tmpfs", "/var/lib/postgresql/data", "--name", name, "-e", "POSTGRES_DB=medresa_integrity_test", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:17-bookworm"]);
  running = true;
  await until("select true;");
  await checked("create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
  await checked(readFileSync("supabase/migrations/202610070001_admin_news.sql", "utf8"));
  await checked(readFileSync("supabase/migrations/202610080002_publication_integrity.sql", "utf8"));

  const a = await initial("race-draft-a");
  const b = await initial("race-draft-b");
  await competingTransactions("draft-race", saveSql(revise(a, { slug: localized("contested-draft") }), 0), saveSql(revise(b, { slug: localized("contested-draft") }), 0));
  assert.equal(await checked("select count(*) from medresa_admin_slug_reservations where article_id='race-draft-a';"), "3");
  assert.equal(await checked("select count(*) from medresa_admin_slug_reservations where article_id='race-draft-b';"), "0");
  console.log("PASS: concurrent draft claims have exactly one owner; the losing save rolls back.");

  const c = await initial("race-published-owner");
  const other = await initial("race-published-contender");
  const asset = { id: "archive-concurrency-fixture", src: "/images/local-fixture.jpg", width: 1200, height: 800, alt: localized("Image") };
  const ready = revise(c, { title: localized("Title"), slug: localized("retained-published-slug"), date: "2026-10-07", images: [asset], coverImageId: asset.id, blocks: [{ id: "text-1", type: "text", text: localized("Text") }] });
  ready.status = "ready";
  ready.review = Object.fromEntries(["bs", "sq", "en"].map(l => [l, { approved: true, reviewedRevision: ready.revision }]));
  await checked(saveSql(ready, 0));
  const snapshot = toPublicArticle(ready);
  const edit = revise({ ...ready, revision: 2, status: "published" }, { slug: localized("new-unpublished-slug"), date: "2026-12-01" });
  await competingTransactions("publication-race", `select to_jsonb(medresa_admin_publish(${literal(c.id)},1,${json(snapshot)},'local-concurrency-test')); ${saveSql(edit, 2)}`, saveSql(revise(other, { slug: ready.slug }), 0));
  assert.equal(await checked(`select publication_date from medresa_admin_public_feed where id=${literal(c.id)};`), "2026-10-07");
  assert.equal(await checked(`select count(*) from medresa_admin_slug_reservations where article_id=${literal(c.id)} and published;`), "3");
  console.log("PASS: publication plus draft-slug change cannot allow a concurrent article to take the published URLs.");

  const rollbackOwner = await initial("rollback-owner");
  const rollbackContender = await initial("rollback-contender");
  await competingTransactions("rollback-race", saveSql(revise(rollbackOwner, { slug: localized("released-on-rollback") }), 0), saveSql(revise(rollbackContender, { slug: localized("released-on-rollback") }), 0), "rollback", true);
  assert.equal(await checked("select count(*) from medresa_admin_slug_reservations where article_id='rollback-owner';"), "0");
  assert.equal(await checked("select count(*) from medresa_admin_slug_reservations where article_id='rollback-contender';"), "3");
  console.log("PASS: rolling back a concurrent claim leaves no reservations or partial save.");
} finally {
  if (running) sync(["stop", "--time", "1", name]);
}
