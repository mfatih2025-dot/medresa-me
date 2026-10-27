# AI news translation quality fix

The incident came from local preprocessing, not a production fallback translator.
The old ASCII uppercase regex hid ordinary BS words and parts of words containing
Č/Ć/Š/Ž/Đ as immutable KEEP tokens. OpenAI could not translate those hidden words;
the server restored them into SQ/EN output afterward. No word-replacement or
test-fixture translator is reachable from production code.

The pipeline sends only original BS title, lead, text/subheading/quote blocks and
image alt text to the Responses API. Both languages must complete successfully
before a single draft save. BS content, shared assets, IDs, order and paragraph
structure remain unchanged. URLs, factual numbers, account identifiers and the
institutional proper name remain protected; ordinary uppercase text does not.
Other proper names are preserved by the translation instructions and human review.

`OPENAI_TRANSLATION_MODEL` optionally selects the server-side model; the existing
`gpt-4.1` default is retained when absent. Keep `OPENAI_API_KEY` server-only. The
provider path has no local translation fallback and no automatic provider retry.
Missing configuration, 400/401/403/404/429/5xx responses, timeout, refusal,
incomplete output and parsing failures return a clear error without saving output.
Raw provider errors, credentials, article bodies and headers are not logged or
reflected. Complete Responses envelopes may include a reasoning item alongside
the single structured assistant message; unknown/tool output types are rejected.

Quality checks reject known incident fragments, clear Bosnian leakage, copied
longer prose, extreme omissions, missing fields/blocks and changed line structure.
These conservative checks do not certify fluency or semantic completeness. A
qualified Albanian/English editor still needs to review every generated draft.

Existing non-empty SQ/EN fields are never overwritten by this endpoint, even if
an older client sends an overwrite confirmation or clears its local copy. This
deliberately protects all existing translations, including older AI drafts whose
manual editing history cannot be established reliably. They remain editable by
hand. Concurrent saves retain the existing optimistic revision checks.

Generated SQ/EN review metadata has `aiGenerated: true`, `approved: false` and
`reviewedRevision: null`. The optional AI marker lives in the existing draft JSON;
no migration is required and existing records are not backfilled. The editor
shows AI draft, Reviewed and Approved as distinct states. Human review and approval
are separate explicit actions; publication remains a third confirmed action.
Green language indicators require approval, not merely non-empty content. BS
changes invalidate target review. Shared content edits also invalidate affected
review; unrelated target-language edits preserve unaffected locale approval.

Verification uses isolated provider/PostgreSQL fixtures, including the exact
incident title and malformed outputs, provider failure statuses, missing keys,
protected facts, optional model selection, editorial stages, concurrent saves and
manual-overwrite rejection. It does not use live credentials or alter articles.

Production Vercel ENV/model access and OpenAI request receipts were unavailable
during this task. No production authentication/model-access failure is claimed as
confirmed. After approval, use the normal authenticated translation action on a
new empty draft and inspect its safe error classification if needed. The existing
Preview diagnostic reports key presence and backend guard booleans only; presence
does not prove a valid key, quota or model permission. Never paste keys or tokens.

No public frontend, animation, SEO, SQL function or database permission is changed.
This branch must not be pushed to main or deployed without explicit approval.
