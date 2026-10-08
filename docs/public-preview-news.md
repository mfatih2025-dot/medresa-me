# Published News on the public Preview

Only `VERCEL_ENV=preview` on `codex/admin-panel` reads the Supabase published locale
feed. Production, development and other branches keep their static News source.
No environment variables, migrations, data or Storage configuration are changed.

`src/server/public/news.ts` performs server-only GET requests against
`medresa_admin_public_locale_feed`. It never reads editorial documents or invokes
write RPCs. Existing validated Supabase credentials are used only on the server;
the write-enabled flag is irrelevant to these reads. Preview pages read at request
time, so newly published slugs do not depend on build-time static parameters or a
redeployment. React request caching shares reads between metadata and rendering.

The feed merges into the existing NewsArticle contract. The 17 static identities
always retain their exact content, original slugs and relative order. Imported
copies are deduplicated. Additional articles appear only in their published locale,
using that locale's immutable snapshot, photos, date, slug and frozen ordering.
Other locale text and alt descriptions are stripped from public payloads.

Homepage latest three, archive pages and article navigation use the same combined
source. Archive pagination still has 12 articles per page and uses the existing
Pagination markup. Article neighbours and archive-return links receive the combined
navigation data. Only these data inputs were added to Archive and Article; their
elements, classes, typography, spacing, image rendering and animations are unchanged.
The homepage News renderer is unchanged. CSS, header, footer, locale routing and
responsive components are unchanged.

Article hreflang links name published locales only. A wrong-language slug redirects
only when the requested locale has a published snapshot; an unpublished locale
returns 404. Existing fully translated archive URLs and redirects remain intact.

Uploaded snapshot image URLs are adapted to `/api/news/media/<id>`. This read-only
route checks the current active published feed before reading the specific private
bucket derivative. Draft/unreferenced images and original uploads cannot be read
through it. Admin media APIs remain authenticated and the bucket stays private.
The existing image optimizer, PhotoTile and lightbox renderers are reused.

HTTP failures, timeout, malformed data or missing configuration return the complete
static archive and its existing homepage items. Provider errors and credentials
are never included in public responses. New remote-only articles can be unavailable
during an outage; the original 17 remain usable.

Validation: typecheck, lint, Preview production build and 51 tests passed. Browser
integration uses the real pages, Admin APIs and an isolated PostgreSQL/Storage
fixture. It verifies new BS archive/article/homepage visibility; later SQ/EN;
unpublished locales and images staying private; all 51 original locale URLs;
published image delivery without Admin authentication; independent publication
history; and existing mobile Admin workflows. Renderer AST comparisons confirm
unchanged markup elements and styling/animation attributes.

Live page verification requires network access to the Preview hostname. The current
workspace proxy rejects that host with HTTP 403; fixture results are not a live
Supabase verification. Vercel deployment status is checked separately on GitHub.
