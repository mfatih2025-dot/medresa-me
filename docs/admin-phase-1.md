# Medresa administration — Phase 1

Starting point: `99addfb6c8b8518ec3589a5e303ca58f967b62a2`. All work belongs to
`codex/admin-panel`. No deployment, production service connection, migration or
public-content write is part of this phase.

## Isolation

Public pages keep their existing App Router layouts, renderer source, global
styles, localized routes and assets. Administration uses the Pages Router in
the same Next.js application. This is deliberate: an App Router admin page
would inherit the existing public root layout, or require restructuring that
locked layout. The Pages Router has its own `_app`, `_document` and scoped CSS
module. It does not load public globals or mount the public header, footer or
language gateway.

The only existing source change is a private-route early return in `proxy.ts`.
It recognizes exactly `/admin`, `/admin/*` and `/admin-preview/*`; the existing
public locale logic and matcher remain intact. Admin API endpoints were already
excluded by the public matcher. These prefixes become reserved private routes.

Routes:

- `/admin/login`: sign-in or fail-closed setup state.
- `/admin`: overview of the real static public archive.
- `/admin/vijesti`: searchable read-only archive and actual-renderer preview.
- `/admin/vijesti/nova`: temporary multilingual block-editor workspace.
- `/admin/akcije`: campaign integration state.
- `/admin/rezultati`: existing document reference and upload integration state.
- `/admin/analitika`: disconnected sources, period selection and daily-preview state.
- `/admin-preview/[id]?locale=bs|sq|en`: authenticated dynamic App Router preview.
- `/api/admin/login`, `/api/admin/logout`: server authentication endpoints.

## Authentication

No credentials are provided, generated for users, or configured in environment
files. Access fails closed if any bootstrap setting is missing/malformed.
`.env.admin.example` documents four server-only settings; Next does not load
that example file automatically.

- `MEDRESA_ADMIN_USER`: the authorized operator's chosen identifier.
- `MEDRESA_ADMIN_PASSWORD_HASH`: `scrypt$<32 hex salt characters>$<128 hex key
  characters>`, using 0–9 and a–f. Derive 64 bytes using Node scrypt's defaults and the salt's
  hex string as the salt input. Generate this outside the repository from the
  operator's chosen password; never store the plaintext password.
- `MEDRESA_ADMIN_SESSION_SECRET`: independently generated high-entropy secret
  of at least 32 characters, configured only in the server environment.
- `MEDRESA_ADMIN_ORIGIN`: exact origin, no trailing slash/path. HTTPS is required
  except for `http://localhost` or `http://127.0.0.1` development origins.

Sessions are HMAC authenticated, expire after eight hours, and use HttpOnly,
SameSite=Strict cookies. HTTPS uses a Secure `__Host-` cookie. Cookies use `/`
so both admin API calls and the separate preview route can authenticate.
Changing the secret invalidates all sessions; logout clears the browser cookie.
Protected pages, previews and future write endpoints must authorize independently.
Private pages send no-store and noindex headers. Login/logout require the exact
configured Origin; login uses bounded body sizes, constant-time comparisons and
bounded in-process attempt throttling.

This is a single-operator foundation, not a connected identity service. Before
hosting for real users, choose managed identities/MFA, roles, durable rate
limiting, account recovery and server-side session revocation. In-process
throttling cannot coordinate multiple workers or survive restarts. Clearing a
cookie alone cannot revoke an already stolen bearer token. Authentication
modules are imported only from server entry points, never client components.

## Editorial model and public compatibility

`NewsDraft` is one entity with localized title/slug/lead, one shared ordered block
array, shared image assets, cover reference, topic, date, revision and human
review approvals. Statuses are `draft` (Nacrt), `ready` (Spremno), and `published`
(Objavljeno). Text, subheading and quote blocks contain BS/SQ/EN strings. Image
blocks contain one shared asset ID. There is no block limit or styling field.

The editor supports drag ordering and explicit move buttons for touch/keyboard.
All ordering changes apply across languages. Edits invalidate all prior review
approvals and return the draft to Nacrt. Local Spremno means the current revision
passes the checklist, not that anything has been saved or published.

The existing 17 article modules are read, not migrated or rewritten. Current
photos are reusable references, not newly uploaded assets. New drafts exist
only in component memory and can be downloaded as JSON. Reload/navigation
discards the workspace. No localStorage, write API or persistence is implied.

`toPublicArticle` is an isolated compatibility adapter: it maps typed blocks to
the current Markdown subset and photos to the current `NewsArticle` contract.
It selects cover first, then referenced assets in first-use block order; unused
library assets are omitted. Repeated image blocks reference the same uploaded
asset. Public photos, crops, blur data and localized alt text retain their
existing semantics. The adapter does not write to the static article store.

The locked Article always renders photo 1 above the body. If an editor also
places that cover asset in a body image block, it appears there too. A later
editor may label or prevent that duplication, but cannot move/remove the fixed
public lead image without a separate design decision. Unreferenced non-cover
assets do not silently become article content.

The publication checklist checks three-language completeness, cover, valid
date, valid nonnumeric slugs, asset references/metadata, unique IDs and human
review of the current revision. Optional standfirst is allowed to be empty.
The future server must additionally validate payload shape, block grammar,
allowed link protocols, upload provenance, media bounds, slug uniqueness against
the store and legacy aliases, authorization and revision conflicts.

Publishing must atomically persist one approved three-language snapshot and an
audit event. Never expose incomplete locale versions. Browser checklist results
are advisory; the server reruns validation against the saved revision.

## Backend and storage decision

No database/provider has been provisioned or connected. No dependency is added.
`ports.ts` defines server repository, storage, translation and analytics
interfaces. A transactional PostgreSQL adapter (Supabase is an option) is a
good next step, but the provider choice is intentionally deferred.

Suggested schema: article identity/revision/status, localized versions,
ordered blocks keyed by stable IDs, localized block text, shared media assets,
review events, immutable publication snapshots and audit events. Database
constraints enforce `(article, position)` and `(locale, slug)` uniqueness.
Optimistic locking uses `expectedRevision`. Authenticated storage writes and
published media reads need distinct policies. Never use service-role credentials
in the browser. Validate actual image/PDF bytes server-side and retain asset
dimensions, preview, localized descriptions, MIME and checksum. Upload once,
reference many times. Avoid deleting assets referenced by published snapshots.

## Translation

The future server action “Prevedi na SQ i EN” calls `TranslationProvider` with
the BS master and a terminology glossary. OpenAI can implement the port later.
No AI client, API call or API key exists in this phase.

The provider returns only SQ/EN textual drafts keyed to the original block IDs.
`applyTranslationDraft` rejects structural changes, preserves BS and all image
references/order, clears approvals and cannot publish. Even unexpected runtime
BS fields cannot overwrite the master. Validate API output server-side; maintain
a glossary for school names, people, places and institutional terms. A human
must edit/review SQ/EN and explicitly approve the current revision.

## Actual-renderer preview

The private iframe preview renders the existing `Article` component unchanged,
including its body renderer, photographs, lightbox and shared motion. The public
App Router layout/styles provide the real visual environment. The iframe width
is 390px (Mobile) or 1200px (Desktop); narrow admin screens can scroll the desktop
preview without changing the iframe's media-query viewport. BS/SQ/EN selects
actual translated content.

Phase 1 previews existing archived articles only. Draft preview later fetches a
saved private revision, authorizes the request and passes `toPublicArticle`
output to the same component. The existing `pageOf`/`neighbours` helpers rely
on public archive object identity. A future draft outside that store needs a
small approved data-boundary solution for back/neighbor navigation; do not
replace or approximate Article to work around it. The preview currently has
the public site's header/footer; only the Article language is selected by the
private query parameter.

## Exam results, campaigns and analytics

`ExamPublication` contains a shared PDF asset, school year, localized document
labels and hero labels. `examPublicData` demonstrates the existing input shapes:
hero keeps its localized admissions-page destination; the admissions document
receives the published PDF URL. No public caller is wired to it now. Current
status copy and null PDF URL are untouched. Later loading must change only data
boundaries, including metadata, while preserving Hero/Upis DOM and motion.

Campaigns have localized content, status and an explicit start/end interval.
No campaigns are seeded or activated. Public placement, dismissal/frequency,
priority and interaction with the gateway require an approved specification.

Analytics supports Website/Instagram/Facebook/YouTube and 7/30/60/90-day windows,
website totals and daily comparison. No numbers are invented. Model states
include not-connected/loading/empty/error/ready. Resolve metric definitions,
permissions, retention, school timezone and complete-day comparisons before
connecting providers. Existing public social feed tokens do not establish
analytics permissions. Daily comparisons remain unavailable unless both days
have real data.

## Public integration follow-up

Do not replace public renderers or perform broad refactors. Future published
reads need coordinated server data loading for news pages, homepage projections,
root-layout search data, metadata and sitemap. Preserve IDs, localized slugs,
legacy redirects, sort/pagination semantics and fallback images. Choose
revalidation and publish/unpublish behavior before connecting writes. The
existing preferred-language redirect behavior for unprefixed article URLs is
unchanged and remains a separate question from this admin phase.

## Validation

Run existing `npm run typecheck`, `npm run lint`, `npm run build`.
Run the added isolated contract/security regressions with
`node --test --test-isolation=none tests/admin-foundation.test.mjs` (Node 24,
no extra packages; the in-process runner also works in restricted environments).
All created/changed sources stay on `codex/admin-panel`; no main merge, PR,
push or production deployment is authorized by Phase 1.
