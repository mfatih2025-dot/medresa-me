# Temporary Results PDF management suspension

Server-only feature flag: `MEDRESA_RESULTS_PDF_MANAGEMENT_ENABLED`.
Only the exact value `true` enables management. An absent value, `false`, or
any other value suspends it. There is no automatic date-based reactivation.

The suspension blocks upload creation, chunk upload, finalization (including
replacement), draft removal and publication. After existing authentication and
origin checks, mutation requests return HTTP 423 with the message:

> Upravljanje PDF rezultatima je privremeno obustavljeno. Objavljeni PDF dokumenti ostaju dostupni.

Guards run before database or Storage access; the chunk route also checks before
reading the request stream. Results library metadata disables the existing PDF
buttons and native file input, using existing notice styling. No public UI or
translation is changed. OPEN/CLOSED admissions status remains independent.

Public BS/SQ/EN results pages, relative download URLs, published PDF bytes,
authenticated previews, existing drafts and immutable publication history stay
available. There are no SQL, schema, grant, record or Storage changes. Revision
checks are unchanged. Failed removals are never automatically retried.

## Approval and release

This branch must not be merged or deployed without explicit approval. It has no
effect on the current production incident until an approved deployment serves it.
Before that deployment, inspect the existing environment value without changing
other values: `true` would opt out of the suspension. Use `false` (or leave absent)
for suspension. Server ENV changes require a new deployment to take effect.

To reverse next year, set only this server-side flag to `true` and deploy the
approved code with the new environment. Existing backend/write-permission and
schema guards still apply. No data recovery or database migration is necessary.

## Incident scope and evidence

The known application path is POST `/api/admin/results` with `action: "remove"`,
then `removeDraft()`, then RPC `medresa_results_remove_draft(p_locale,p_expected)`.
The reviewed client and server wrappers do not retry. A conflict retains the old
client revision, but no timer invokes removal. The RPC's existing stale-revision
guard raises 40001 before updating state.

After deployment with management disabled, even an old admin client or repeating
script using this application's guarded API receives 423 without a database call.
This prevents that path from generating further RPC errors. It does not stop a
direct Supabase caller, another deployed version, or an external database job.
Do not bypass revision checks or automatically replay a removal with a new revision.

Supabase and Vercel production log access were unavailable during this work.
Neither the caller's identity nor the reported 92% CPU attribution is confirmed.
Compare fresh Supabase API logs for `/rest/v1/rpc/medresa_results_remove_draft`
with Vercel POST `/api/admin/results` by timestamp, status, deployment and available
request metadata. Inspect Preview and older deployments as well. Review query
duration/waits and CPU for the same UTC window. No credentials or request secrets
should be copied into application logs. If errors persist after this code serves
Production, identify the bypassing caller before proposing any further change.

Local tests use disposable PostgreSQL/Storage fixtures and intercepted network
requests. They cover default suspension, authenticated direct requests, repeated
stale removal requests, no automatic retries, published download hashes and
Storage preservation, flag reactivation, unrelated admission controls, and admin
widths 360/390/412/430/768/1440. They do not verify production CPU improvement.
