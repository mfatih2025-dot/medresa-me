# Preview per-language News publication

The Admin publishes BS, SQ and EN independently. Only the chosen language's
content, slug, real publication date and human review are required. A cover is
optional: the existing public article renderer accepts no photos, and the News
archive already has its text fallback. Those renderers and public data remain
unchanged.

The existing article and shared block/image relationships remain intact. Editing
one translation preserves reviews for unchanged languages. Shared date, image or
block-order changes require renewed review for each affected language. Publishing
SQ or EN never replaces the active BS snapshot, including its date and photos.

The editor provides OBJAVI BS / SQ / EN and OBJAVI SVE SPREMNE JEZIKE. The batch
includes only ready languages with unpublished changes. Each locale shows Nacrt,
Spremno or Objavljeno; a changed draft also indicates that its previous published
version is retained. Draft saves, archive/trash and restore keep working.

## Required Preview database change

Apply **only** `supabase/migrations/202610080003_locale_publication.sql` to the
verified **medresa-me-preview** project. Both earlier migrations must already be
installed; do not rerun them. Keep remote Admin writes disabled during migration
and verification. No Vercel variables or credentials are changed by this release.

This migration was validated locally, not applied remotely from this workspace.
No authenticated Supabase connection is available here. Until the new view exists
and can be read, the deployed editor disables publication and the backend rejects
publication with 503. It never falls back to the old all-language publish RPC.

The transactional migration adds:

- `medresa_admin_locale_publications`: immutable locale snapshots, frozen dates,
  ordering and history, linked to the original revision history.
- `medresa_admin_locale_heads`: one active revision per article/language. Heads
  cannot be deleted, reassigned or rewound.
- `medresa_admin_publish_locales`: server-only, invoker RPC; row locking and the
  existing shared expected revision enforce optimistic concurrency. One failed
  locale rolls back the whole batch, including slug claims and revisions.
- Four private invoker functions and six trigger bindings, reusing the existing
  immutable-publication guard and published slug reservation registry.
- Two invoker views: private Admin publication state and the future per-locale
  public feed. Browser roles have no relation, column or function access. RLS is
  enabled; service-role permissions are restricted to the necessary operations.

Existing snapshots are copied exactly into the **new** history tables for all
three languages. Existing article rows, original publications, original RPC bodies,
slug ownership and Storage are not modified. An insert trigger maintains locale
compatibility with the original insert-only legacy import. No remote article import
is performed. Preflight rejects missing/unsafe prerequisites and existing new
objects instead of silently rerunning or replacing them.

The migration does not change the old global feed or public routes. Any future
public data-source cutover must query `medresa_admin_public_locale_feed` for the
requested locale and use that row's complete snapshot/date/photos. The original
global feed continues to expose legacy publications only.

## Local validation

- `npm run typecheck`, `npm run lint`, production webpack build.
- `npm run test:admin`: isolated PostgreSQL tests for BS-only/no-cover publication,
  later SQ and EN, independent SQ edits, atomic rollback, CAS conflicts, permanent
  published slugs, immutable dates/order/history, RLS and server-only grants.
- Fixture backfill and import tests verify compatibility with all 17 original
  articles without changing their data or original RPCs/Storage.
- `node tests/admin-publication-concurrency.mjs`: isolated PostgreSQL 17 sessions,
  including simultaneous BS/SQ publication, stale revision rejection and a fresh
  SQ retry that preserves the entire BS publication row.
- `npm run test:admin:browser`: real Admin API/editor against a local database
  fixture; BS-only publication, later translations, independent SQ updates,
  batch publication, authentication, persistence, native gallery/blocks and mobile
  layout/dialogs at 360 / 390 / 412 / 430 px.
- `node tests/admin-session-browser.mjs`: local HTTPS session/cookie regression.

These are local fixtures, not proof of a remote Preview write. The public website,
main, Production, Vercel environment variables and remote Storage are outside this
change.
