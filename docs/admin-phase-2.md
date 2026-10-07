# Phase 2 · Preview content management

Branch: `codex/admin-panel`. Starting commit: `3212a4701aa094bf3b46411f61292f54d1f19cfa`.
No public renderer, static article, public route, root layout, image or stylesheet is modified.
Existing Preview authentication is retained without changes.

## Connection boundary

No Supabase project credentials are available in this workspace. No remote migration,
storage operation, import, environment change or deployment has been performed.
Persistence/upload/archive/trash/publication code is implemented and tested locally.
It cannot be called functional against real Supabase until connection verification passes.

Use a **separate Supabase Preview project**, not the production database. In Vercel,
scope these server-only variables to **Preview → Git branch `codex/admin-panel`**:

| Variable | Required configuration |
| --- | --- |
| `SUPABASE_URL` | `https://<preview-project-ref>.supabase.co`, without trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview project's server-side service-role/secret key |
| `MEDRESA_SUPABASE_PROJECT_REF` | Same Preview project ref; server rejects a different URL |
| `MEDRESA_SUPABASE_WRITE_ENABLED` | Initially `false`; enable `true` after schema/project review |

Keep the existing four `MEDRESA_ADMIN_*` authentication variables unchanged.
No Supabase anon key, browser Supabase client, or `NEXT_PUBLIC_` key is needed.
The backend refuses all Supabase access when `VERCEL_ENV=production` and on other
Preview branches. Vercel's system `VERCEL_GIT_COMMIT_REF` must identify `codex/admin-panel`.
The adapter supports legacy service-role JWTs and current `sb_secret_` keys; opaque
secret keys use only the `apikey` header, following [Supabase's API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).
Network access to `<preview-project-ref>.supabase.co` is also needed in any environment
used for the import/verification commands. Supply credentials through secure runtime
bindings or a local secret manager, never source files, command-line arguments or Git.

Review and manually apply `supabase/migrations/202610070001_admin_news.sql` to the
confirmed Preview project only. This is an additive, transactional migration, not an
automatic deployment hook. It creates new prefixed tables, RPCs and a private bucket.
It deliberately fails on an existing/conflicting schema/bucket instead of replacing it.
No remote schema reset, destructive migration or permanent deletion is implemented.

## Data and publication

- `medresa_admin_articles`: current editor document/revision, date, status, cover,
  archive/trash timestamps, created/updated/published times and immutable import provenance.
- `medresa_admin_localizations`: BS/SQ/EN title, slug, lead, human review and reviewed revision.
- `medresa_admin_blocks` and `medresa_admin_block_text`: one shared ordered structure,
  three localized textual values. Blank image placeholders remain in the draft JSON;
  assigned image blocks are normalized. No font, color, margin or alignment fields.
- `medresa_admin_assets` and `medresa_admin_article_images`: shared asset identity,
  immutable source metadata, per-article localized alt text and image association.
- `medresa_admin_revisions`: saved document history, revision, action, actor and time.
- `medresa_admin_publications`: immutable atomic three-language publication snapshots.
- `medresa_admin_public_feed`: future read boundary for published snapshots, excluding
  archived/trashed records. Editing a published story keeps its previous published
  snapshot until another successful publication. No public route reads this view yet.

All tables use RLS without browser policies. `anon`/`authenticated` cannot read or
mutate these tables or call RPCs. The existing private admin session authorizes each
server API; mutation requests must match the configured Origin. Keys remain server-side.
All private responses are no-store/noindex. IDs and input structure are validated,
client image metadata is replaced by canonical metadata, provider errors are redacted.

Saves use an expected revision and a row lock. Stale updates return 409 rather than
overwriting another editor. Each saved revision is retained. Content edits invalidate
reviews; publication requires complete BS/SQ/EN, a cover with localized alt descriptions,
a real date, valid/unique slugs, filled blocks and human review for the current revision.
The server checks these again and the database validates/commits the publication,
published pointer and audit history in one transaction.

Archive and trash are timestamp transitions; neither deletes article data or assets.
Trash requires a confirmation dialog and the target ID in the request. Restoring a
trashed archived item first restores it to archive; a second restore returns it to active.
No permanent article/image deletion endpoint exists.

## Safe import of the 17 articles

The library merges database records with static articles that have not been imported;
database archive/trash states take precedence over the static fallback. `Uredi` opens
the shared block editor for every legacy article. Static items cannot be saved, archived
or trashed until explicitly imported. There is no hidden import on an edit/save request.

When connected, the primary `Nova vijest` action explicitly creates a real persisted
draft by POST and opens its editor. Direct `/admin/vijesti/nova` work is atomically
created with its content on the first save. Neither SSR navigation nor preview writes data.

`node scripts/import-news.mjs --dry-run` converts and verifies every article before any
write. Raw Markdown, paragraph/list/heading/quote structures, all three slugs, dates,
topic, photographs, blur, focus, graphic flags, source URLs and ordering are preserved.
Immutable compatibility provenance keeps unedited legacy content byte-for-byte while
the editor exposes individual blocks. Ambiguous language alignment stops the import.

After configuration/migration review, the authorized operator may run:

```sh
node scripts/import-news.mjs --apply --confirm-project=<preview-project-ref>
node scripts/verify-news-import.mjs
```

The import sends all 17 verified records through one insert-only transaction. Repeating
it skips matching imports; a conflicting identity/fingerprint rolls back without
overwriting an edited record. It leaves the original 17 TypeScript files and all public
image files intact. Existing articles without a cover remain exactly as published during
import; subsequent admin publication must satisfy the new mandatory cover checklist.
Legacy source data contains a date, not an exact publication time. Static fallback clock
timestamps remain unknown; imported DB timestamps record the actual import/publication
event. The original public date is retained independently, without inventing a historical time.

The read-only verification checks the active original snapshots, import fingerprints,
source order, three-language data and existing image files. Any edit/archive/trash of
an original snapshot requires explicit review before a public cutover.

## Phone images and real preview

`Odaberi sliku` opens a native image file input accepting JPG/JPEG, PNG and WebP.
Client and server enforce 10 MB. Sharp verifies actual decoded format, rejects damaged,
animated/oversized images (40 megapixels), applies EXIF orientation, removes metadata
and creates a lossless WebP derivative without resizing. The original is retained privately.
Two private objects belong to **one shared asset**; all languages/blocks reuse its ID.
Interrupted uploads leave recoverable orphan objects; nothing is automatically deleted.
The secondary library is a searchable, paginated thumbnail grid, never a native long list.

Bucket: `medresa-news-preview`, private, 10 MB limit and image-only MIME restrictions.
Authenticated `/api/admin/media/[id]` serves derivatives with no-store/nosniff headers.
Public archive images retain their existing local paths; import does not copy/recompress them.

`Osvježi pregled` sends the current unsaved document to an authenticated server boundary.
That boundary canonicalizes assets and returns the existing `NewsArticle` contract.
An authenticated iframe renders the **actual unchanged production `Article` component**.
BS/SQ/EN and Mobile/Desktop controls are available. Private uploaded images are embedded
as data URLs only in the authorized preview, avoiding public bucket access or changes to
public Next image configuration. Total embedded preview media is limited to 30 MB.
The snapshot is refreshed explicitly; unsaved changes never become public or persist
merely by previewing. Existing template navigation still uses the static archive; a
future public-store cutover must preserve navigation identity and archive pagination.

## Translation and untouched sections

OpenAI remains disconnected; the translation button is disabled. A protected server action
and text-only provider contract are prepared. A future structured-output provider must
preserve BS, block IDs/order, images, names and institutional terminology, return editable
SQ/EN drafts, reset review and never publish. A server-only `OPENAI_API_KEY` and a reviewed
provider implementation will be required later; setting a key alone does not activate it.
Analytics remain disconnected with no invented numbers. Campaigns and entrance-exam
publishing stay at their Phase 1 boundaries; Phase 3 has not begun.

## Before a public News data-source switch

1. Connect the confirmed separate Preview database; apply reviewed migration and enable writes.
2. Execute/import-verify all 17; test actual Supabase Storage, RLS and runtime credentials.
3. Confirm editor persistence across sessions, concurrent saves, publication, archive/trash/restore
   and real phone uploads against Preview, including all languages and preview viewports.
4. Provide a public read boundary for **published media only**. Current uploaded image URLs
   are authenticated admin URLs and must not be exposed directly in the public feed.
   A local published-media proxy could retain the current renderer and Next image config.
5. Plan a small static-store data-boundary change with deterministic date/ID ordering,
   archived/trash exclusion, previous published snapshots while editing, localized slug lookup,
   sitemap/localization alternates, neighbours and archive pagination. Public components stay locked.
6. Compare all public routes/renderer DOM, computed styles, animation/responsiveness,
   crops and URLs against the current static baseline in Preview. Require explicit approval
   before any public cutover; retain the static source for rollback.

## Validation commands

```sh
npm run typecheck
npm run lint
node --test --test-isolation=none tests/admin-foundation.test.mjs tests/admin-phase2.test.mjs tests/admin-database.test.mjs
node scripts/import-news.mjs --dry-run
npm run build -- --webpack
npm run test:admin:browser
```

PGlite is a development-only in-memory PostgreSQL engine used to execute the actual SQL,
verify transactional import/save/publish/archive/trash/restore, conflicts and role denials.
It does not replace Supabase or store application content. Sharp is declared directly at
the existing installed version for deterministic server image decoding/optimization.
Mobile browser checks use 360/390/412/430 px. A real Samsung/Android Gallery check remains
necessary on the connected Preview; desktop automation cannot verify the physical OS picker.

## Completed local validation

- TypeScript and ESLint passed.
- All 18 foundation, contract, security and PostgreSQL tests passed.
- The optimized production build passed with `--webpack`; build configuration is unchanged.
- Browser integration passed authenticated routing/logout, 17 legacy rows, persisted draft
  creation/reload/back navigation, actual renderer previews, filechooser/upload/shared images,
  drag/move ordering, human review/publication, archive/trash/cancel/restore, and layouts/dialogs
  at 360, 390, 412 and 430 px. Its database and Storage are explicitly local test fixtures.
- Import dry run verified all 17 without writing anything.
- All 96 generated public HTML routes retained identical main/header/footer markup against
  the Phase 1 baseline; both public stylesheets were byte-identical. Public source, assets,
  routing and existing authentication files are unchanged.
- Remote main remained `99addfb6c8b8518ec3589a5e303ca58f967b62a2`.
  No Phase 2 push, deployment, remote migration or external environment change was made.

## File inventory

31 created files:

```text
.env.admin-backend.example
docs/admin-phase-2.md
scripts/import-news.mjs
scripts/lib/load-typescript.mjs
scripts/verify-news-import.mjs
src/admin/ConfirmDialog.tsx
src/admin/ImagePicker.tsx
src/admin/LivePreview.tsx
src/admin/NewArticleAction.tsx
src/admin/PreviewReceiver.tsx
src/admin/client.ts
src/admin/contracts.ts
src/admin/import.ts
src/admin/list.ts
src/pages/admin/vijesti/[id].tsx
src/pages/api/admin/media/[id].ts
src/pages/api/admin/media/index.ts
src/pages/api/admin/news/[id].ts
src/pages/api/admin/news/index.ts
src/pages/api/admin/preview.ts
src/pages/api/admin/translation.ts
src/server/admin/editor.ts
src/server/admin/http.ts
src/server/admin/media.ts
src/server/admin/news.ts
src/server/admin/supabase.ts
src/server/admin/translation.ts
supabase/migrations/202610070001_admin_news.sql
tests/admin-browser.mjs
tests/admin-database.test.mjs
tests/admin-phase2.test.mjs
```

14 existing files modified:

```text
package.json
package-lock.json
src/admin/DraftEditor.tsx
src/admin/NewsLibrary.tsx
src/admin/Overview.tsx
src/admin/Shell.tsx
src/admin/admin.module.css
src/admin/model.ts
src/admin/ports.ts
src/admin/publication.ts
src/app/admin-preview/[id]/page.tsx
src/pages/admin/[section].tsx
src/pages/admin/index.tsx
src/pages/admin/vijesti/nova.tsx
```
