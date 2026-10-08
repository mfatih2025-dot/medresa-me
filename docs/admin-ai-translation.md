# Preview Admin translation

The existing “Prevedi na SQ i EN” action uses the server-side OpenAI Responses API
(`gpt-4.1`, strict JSON schema, no tools, `store: false`). There is no mock, browser
AI or alternative-provider path in deployed code. Test responses are explicit
isolated fixtures and do not establish live translation quality.

The action is available only on Vercel Preview → `codex/admin-panel`, with the
existing validated Supabase configuration, write opt-in and `OPENAI_API_KEY`.
Only an availability boolean is sent in editor props. No key is sent to the editor,
logged, reflected in errors or read from a NEXT_PUBLIC variable. Pages Router API
and getServerSideProps dependencies are excluded from the browser bundle.

If unavailable because the API key is absent, add `OPENAI_API_KEY` in Vercel with
Environment **Preview**, Git Branch **codex/admin-panel**, then redeploy that
Preview. Enter the key only in Vercel's secret environment-variable field, never
in chat. No other variable, Supabase credential or migration is required. The key
must have access/billing for the Responses API and `gpt-4.1`.

To verify the deployed runtime without exposing a key, use Admin → Pregled →
“Provjeri Preview vezu”. Its authenticated, read-only `translation` report contains
only guard booleans, failed-check names and the validated deployed commit SHA.
`checks.openAiKeyPresent: true` confirms that the running server sees a non-empty
key; `available: true` confirms all translation configuration guards pass. It does
not contact OpenAI, validate API billing or perform a translation/save. A new
Preview deployment is necessary after changing Vercel environment variables;
existing deployments retain their original environment snapshot. Do not change
other variables based on the editor's generic unavailable message.

A stored article identity is required (the normal “Nova vijest” action already
creates it). Direct unsaved `/admin/vijesti/nova` drafts must first be saved. The
translation request can include unsaved edits; both generated locales and those
edits are persisted together only after complete generation/validation. A failure
before saving preserves the stored article and every local editor input.

Only BS title, optional lead, textual blocks and image alt descriptions are sent.
The model echoes IDs/types for validation; it cannot select images, change
identity/date/topic, move blocks or return a publication instruction. The
central glossary is `src/server/admin/translationGlossary.ts`. URL/email, numeric
facts, uppercase identifiers/accounts and the institutional proper name are masked
per field and restored by the server. Model omissions, duplicated tokens, invented
numbers/URLs, added renderer directives or changed line structure are rejected.
Proper personal names and factual meaning additionally require human review.
Localized slugs are generated on the server from translated titles. Existing slug
reservations remain enforced; a collision rejects the whole save with no partial
draft update.

Any non-empty SQ/EN title, slug, lead, block or alt text triggers the existing
confirmation dialog. The server checks both persisted and submitted content, so
removing local text cannot bypass the confirmation. Cancellation makes no request.
All replacements, including repeated AI translations, require confirmation.

One existing `medresa_admin_save` RPC atomically persists the validated SQ/EN
drafts, relational projections and revision history. BS content, shared image
metadata/order and published snapshots/heads are preserved. Generated SQ/EN
approvals are always cleared, even for identical text; their current editor state
is Draft until human review. Previously published versions remain public and
retained. BS review is carried forward only if its content is unchanged. SQ and EN
can then be manually edited, reviewed and published independently through the
existing publication API. Translation never calls a publication RPC.

The UI locks editing and publication while translation is running, shows
“Prevodim SQ i EN…”, prevents duplicate submissions and reports a restrained
success/error. A server worker also rejects in-flight duplicates; across workers
the existing expected-revision/row-lock protection permits only one save. OpenAI
is bounded to 45 seconds, 14,000 output tokens, 32,000 source JSON characters,
80 blocks and 40 images; malformed, refused or truncated output is not saved.
The API function has a 120-second maximum duration for generation plus DB reads/save.

After success, the existing authenticated Article iframe refreshes automatically
with the persisted drafts. Its BS/SQ/EN controls reuse the locked Article renderer.
Public Article/Archive/Homepage/renderers, styling, routing, the static 17 articles,
Supabase schema/security and per-language migrations are unchanged.

Tests cover provider contract/secret isolation; BS equivalence; all ordered block
types and shared images; atomic persistence; review and independent SQ publishing;
manual overwrite/cancellation; missing configuration; transport/invalid/refused/
truncated output; concurrent edits/duplicates; slug conflicts; automatic real
Article preview; mobile widths 360/390/412/430 and existing public News regressions.
Database/Storage/OpenAI responses in integration tests are isolated local fixtures.
