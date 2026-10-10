# Admin Akcije — Preview only

Branch: `codex/admin-panel`. Runtime guards require `VERCEL_ENV=preview`, this exact branch, the established project reference `safsijrhxbefgcahvsvm`, and `MEDRESA_SUPABASE_WRITE_ENABLED=true` for mutations. No additional credentials or environment changes are required. Main/Production are excluded. News, Analytics, provider auth, translation and public page components are unchanged.

## Deployment prerequisite

Apply **only** `supabase/migrations/202610100001_campaigns.sql` manually in **medresa-me-preview** SQL Editor. Do not repeat earlier migrations. This workspace has no remote Supabase credentials, so the migration was executed/tested only in local PostgreSQL, not remotely. The additive transaction creates two campaign tables, two indexes, one invoker save RPC and the new private `medresa-campaigns-preview` bucket. No real campaign or poster is seeded. Until applied, Admin writes are safely unavailable and the public overlay renders nothing.

The bucket accepts original JPG/PNG/WebP files, maximum **4 MB** (below Vercel's 4.5 MB request-body limit). No SVG/animated content. Server validates declared MIME against decoded format, dimensions, complete decode and 40-megapixel limit. Original bytes are stored/served unchanged; no rescale, EXIF removal, artwork generation, text overlay or derivative is persisted. EXIF orientation is reflected in display dimensions. Replacement creates a new immutable asset. Removal unlinks the asset from that campaign; it never deletes old objects or other campaign assets. Failed metadata insertion can leave a private recoverable upload, never an exposed public object.

## Data and security

`medresa_campaigns`: UUID, revision, internal name, poster reference, exact CTA text/link, active state, optional UTC start/end, creation/update/activation timestamps and editor identity. Names are not projected publicly. Multiple campaign rows survive indefinitely; use a new campaign for a new announcement. Existing campaigns can be edited/reused. Revision-checked save RPC locks the selected row and atomically saves or rejects conflicts. No hard-delete UI/API or DELETE/TRUNCATE grants.

`medresa_campaign_assets`: immutable UUID/object path, MIME, original byte size, oriented dimensions, creation timestamp/editor. Dedicated private bucket, no anon/authenticated table access or new Storage policies. Minimal service-role privileges; save is SECURITY INVOKER with controlled search_path. All Admin APIs reuse existing signed-session and same-origin checks before any storage operation. Public endpoints expose only the single currently eligible campaign and its original raster artwork, never drafts/inactive/expired assets, internal names, bucket paths, editor details or service credentials. Public poster requests recheck eligibility and revision on every request and send no-store/nosniff.

## Selection, schedules and dismissal

Manual inactive always wins over schedule. Active requires a poster. Start is inclusive; end exclusive. Missing times are unbounded. Among eligible campaigns, the most recently activated wins; UUID breaks ties. Editing an already active campaign does not reorder it. Deactivate/reactivate to reprioritize. A previous eligible campaign can become current again when the newer campaign expires; deactivate it if that fallback is not desired.

The public client refreshes the campaign projection on mount/visibility, every minute and at the nearest scheduled start/end. It waits for the existing language gateway to finish and is excluded from Admin/authenticated article previews. No active campaign or unavailable DB/Storage means no modal and usable public pages. Poster failure never writes a visitor dismissal.

Dismissals are stored as `medresa.campaign.dismissed.<id>.v<revision>` in browser localStorage. Close X, ESC, background click and CTA dismiss this campaign version. Later navigation/reload cannot re-open that version; a new ID or saved revision is independently eligible. If localStorage is blocked, in-memory state prevents repeated prompts during the current document session. No visitor identities or dismissal data are stored remotely.

## Overlay and QA

Only close X, original artwork and the exact administrator-configured CTA are visible. Isolated CSS module: cream/green/gold, restrained dark/blur backdrop, no animations, cards, decorative copy or artwork edits. The dialog stays closed until its original image has loaded, avoiding a blank overlay during slow or failed image delivery. Native dialog provides top-layer focus containment/background inertness; scrolling is locked and restored with scrollbar compensation/focus restoration. Poster is contained at its original aspect ratio, bounded by responsive width and viewport height; CTA and 44px close remain accessible. Extreme tall/narrow artwork stays contained in a minimum readable composition instead of being cropped.

`npm run test:admin` includes PostgreSQL campaign security/CRUD/concurrency/upload/projection tests. `npm run test:campaigns:browser` runs real production Next handlers against explicitly local PostgreSQL/storage fixtures at 360/390/412/430px, tablet and desktop. Its solid-pixel images are structural test fixtures only, never campaigns/artwork seeded to Preview. Existing public regression tests cover locked News/content/renderers. No live remote write verification is claimed before the migration and a real administrator-created campaign.
