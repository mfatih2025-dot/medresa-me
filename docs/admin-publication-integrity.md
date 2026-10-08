# Preview publication integrity correction

Prepared on `codex/admin-panel`. Remote execution is **not approved or performed**.
Keep `MEDRESA_SUPABASE_WRITE_ENABLED=false`. No real article import or public
data-source cutover is included. Committing/pushing this SQL does not execute it.

## Verified inventory

The operator supplied a read-only SQL Editor inventory from `medresa-me-preview`:

- All eight original Admin tables and their columns/constraints exist.
- All eight tables have RLS enabled; no Admin or Storage policies are present.
- Twelve original indexes and the `security_invoker=true` public-feed view exist.
- Five original RPC signatures exist, use invoker security and the controlled
  `public, pg_temp` search path, and deny browser execution.
- Both browser roles have no reported table/view permissions. The service role
  has full original table/view privileges, including Supabase default grants.
- No user-defined Admin triggers exist.
- `medresa-news-preview` exists, is private, permits JPEG/PNG/WebP, has a 10 MiB
  limit, and contains zero Storage objects. Article row counts were not queried.
- RPC body fingerprints differ from the repository's original SQL; a fingerprint
  cannot establish whether the difference is formatting or behavior. **None of
  those five functions is replaced.** Compatibility tests use the repository RPC
  implementation against a representation of the supplied table/security schema;
  they are not a claim to have executed the deployed RPC bodies locally.

No original migration object is missing. The original migration must **not** be
rerun against this installed schema.

## Confirmed defects

`medresa_admin_reserved_slug` protects only the current localization projection.
Changing a published article's draft slug releases its old published URL.
`medresa_admin_public_feed` reads `articles.publication_date` and `source_order`;
an unpublished date change can reorder an unchanged public snapshot.

## Additive follow-up

Apply only `supabase/migrations/202610080002_publication_integrity.sql`, after
explicit approval, in the SQL Editor for **medresa-me-preview**, project reference
`safsjirhxbefgcahvsvm`. SQL affects the database selected by the operator; it
cannot independently prove the Supabase dashboard/project identity. The script
does not contact any other project, Storage endpoint, Vercel or Git service.

The transaction creates:

1. `medresa_admin_slug_reservations`: one locale/slug ownership registry covering
   current drafts and every historical publication. Its primary key atomically
   arbitrates concurrent claims. Draft-only reservations can be released when the
   draft changes; published ownership cannot be reassigned, deleted or demoted.
   Archived/trashed articles retain ownership, and the same article can reuse its
   old slug. All three languages are protected independently.
2. `medresa_admin_publication_metadata`: immutable per-publication `source_order`,
   keyed to the existing publication row. Existing history is backfilled using
   the current import provenance order, which the original Admin RPCs never edit.
   Separate metadata preserves original composite types and positional inserts.
3. Two primary-key indexes and two foreign keys for the new tables.
4. Four invoker-security trigger functions, with browser/PUBLIC execution revoked:
   `medresa_admin_reserve_draft_slug`, `medresa_admin_capture_publication`,
   `medresa_admin_protect_slug_reservation`, `medresa_admin_protect_publication`.
5. Eight triggers: draft claim/release; publication capture; row and truncate
   protection on publications, publication metadata and slug reservations.

Both new tables have RLS enabled and no browser policies/grants. Explicit revokes
remove inherited Supabase grants. The service role receives only the new-table
privileges needed by the invoker triggers: registry SELECT/INSERT/UPDATE/DELETE;
publication metadata SELECT/INSERT. Existing permissions are retained.

The existing view is replaced in place, preserving its four-column contract,
grants and invoker security. It reads the ID/date/content/photos/slugs from the
immutable active snapshot, and source ordering from publication metadata. Only
current archive/trash flags and the active publication pointer control visibility.
The public website still uses its existing static source.

No existing article, localization, block, asset, revision, publication snapshot,
RPC body, bucket, policy or Storage object is overwritten or deleted. Existing
rows are read to populate only the two new tables. New history guards reject
future snapshot/ordering updates, deletions and truncation. All existing
create/save/publish/archive/trash/restore adapter contracts remain unchanged.

## Fail-closed execution

The script checks the full base table column contracts, RLS/browser security,
RPC signatures/security, and the view contract before creating anything. It
rejects partial installations, unexpected existing triggers/policies or correction
objects. It does not use `IF NOT EXISTS` to hide an inconsistent installation.

Existing publication identities, dates and localized slugs are validated. Any
conflict between historical owners, or between history and a different article's
current draft, aborts the transaction. No conflict winner is selected and no data
is repaired automatically. Do not remove rows or rerun the original migration to
work around a failure; inspect and obtain separate approval for any data repair.

The three affected original tables are locked while checking and backfilling.
Lock contention times out after five seconds; total statement timeout is sixty
seconds. Any failure rolls back the complete transaction. If SQL Editor reports
an error and the session remains in an aborted transaction, end that transaction
before investigating; do not assume the correction applied.

## Local validation

- `npm run test:admin`: contracts, auth/security, public routing baseline, existing
  SQL adapters, and eight new publication-integrity tests. Local fixtures cover
  populated backfill with byte-for-byte preservation of original rows/functions,
  all three localized historical slug reservations, republication, draft release,
  retained assets/repeated image blocks, archive/trash/restore, immutable feed
  date/source order/presentation, rollback, conflicts, partial schemas, malformed
  history, rejected reapplication, RLS and service-role compatibility.
- `node tests/admin-publication-concurrency.mjs`: disposable PostgreSQL 17 with
  no network/host ports or persistent volume. Three synchronized multi-session
  scenarios verify conflicting draft claims, publication followed by a draft
  slug change against a competing article, and complete reservation rollback.
  Requires Docker's local socket and a cached `postgres:17-bookworm` image.
- TypeScript, lint, optimized build and Admin browser/public-route regression
  tests. The browser's in-memory database applies both migrations; real Supabase
  is never used by these fixtures. Existing 17-article tests import into disposable
  local databases only, never the connected Preview project.

## Execution boundary

The correction is prepared for the reported installed schema and is safe to
submit to that Preview project **after approval**, subject to its fail-closed
data checks. The inventory does not disclose existing article rows, so conflicts
are checked transactionally at execution instead of assuming an empty database.
Applying it does not enable application writes, import articles, or activate the
public feed. Those remain separate approval boundaries. Keep the write flag false
through schema/security verification and an authenticated read-only Preview check.
