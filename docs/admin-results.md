# Admission Results — Preview data integration

Branch `codex/admin-panel`, project `medresa-me-preview` (`safsijrhxbefgcahvsvm`). Runtime guards require the exact Preview branch/project and existing write flag for mutations. No new credentials/environment variables. No Production changes. No real PDFs or result publications are seeded.

## Manual prerequisite

Apply only `supabase/migrations/202610100003_admission_results.sql` in **medresa-me-preview** SQL Editor. It creates four additive tables (`medresa_results_assets`, `medresa_results_uploads`, `medresa_results_state`, `medresa_results_publications`), an empty control row, invoker mutation/integrity functions, RLS and the private `medresa-results-preview` bucket. Earlier migrations remain untouched. No News/Campaign/Analytics rows are changed. The migration has been executed locally against PostgreSQL, not remotely: this workspace has no Preview Supabase service credentials. Until applied, Admin is safely unavailable and the original public document module stays in its existing unlinked state.

## One release, three PDFs

Admin → Rezultati has BS/SQ/EN tabs. Upload/replacement prepares only that locale, preserving other drafts. Removal unlinks only the draft reference. Each original immutable asset records UUID, locale, original filename, byte size, page count, SHA-256, private path and timestamps/editor. None of those paths/editor details are public.

`OBJAVI REZULTATE` requires and server-validates all three originals immediately before publishing. The revision-checked RPC locks the singleton draft/head, inserts one complete immutable publication and atomically changes the published pointer. A concurrent edit, missing file, invalid PDF or Storage failure leaves the previous publication active. Published assets/metadata cannot be updated/deleted/truncated. Removing a prepared PDF never deletes a currently published/historical PDF. Publication UUID supports idempotent retry. No file is committed to Git.

## 5 MB on Vercel

The exact limit is 5 × 1024 × 1024 bytes per PDF. Native file picker accepts PDFs; server assembles 1 MB authenticated, same-origin chunks in private Storage, so requests stay below Vercel's 4.5 MB request body limit. Session ownership, one-hour expiry, expected revision, chunk count and exact sizes are checked. Actual PDF bytes are parsed with `pdf-lib`, requiring a valid header, EOF, page tree and unencrypted content; executable/embedded payloads are rejected. Originals remain byte-equivalent. Final documents use `application/pdf`. Bucket octet-stream support is for private transport chunks only, never published files. Invalid/incomplete transport objects never become drafts/public documents. Completed transport chunks are removed; failed/private or orphan transport objects may remain for future explicit retention maintenance. No broad cleanup is performed.

Public/private PDF downloads use a streamed response instead of a buffered 5 MB Vercel response. Original size/hash are checked before streaming. Attachment, no-store, nosniff and sandbox headers are used.

## Locked public renderer

Only the first existing `UpisDocument.href` is injected. All original module DOM, title/action text, CSS classes, icons, spacing and motion are unchanged. Existing routes stay `/upis`, `/sq/regjistrimi`, `/en/admissions`; downloads are relative `/api/results/bs|sq|en`. No Preview domain or signed/private Storage URL is hardcoded or exposed. Public endpoints resolve the current published pointer at request time and never accept an asset ID or release version, preventing draft/historical downloads. SSR reads use no-store and automatically reflect new publication; replacement requires no code edit, commit or deployment. Public labels remain the already-approved content; PDF replacement does not rewrite admission-page wording.

## Verification

`npm run test:admin` includes Results parsing, exact 5 MB, invalid-content, RLS/RPC, locale integrity, atomic publication, history, optimistic conflicts, public access and locked-renderer tests. `npm run test:results:browser` uses production Next with explicit local PostgreSQL/Storage fixtures and generated structural PDF files at 360/390/412/430/tablet/desktop. It verifies all three real route handlers, 5 MB original downloads, no-redeploy replacement, draft isolation, picker, errors, history and secret isolation. No live Preview publication is claimed before the manual migration and administrator-uploaded real PDFs.
