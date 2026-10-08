# Read-only Preview transport diagnostic

The existing news adapter returns `Veza s uredničkom bazom nije dostupna.` only
when `fetch()` throws before receiving an HTTP response. DNS, TLS and transport
timeouts are deliberately hidden behind that generic message. `writable:false`
in an error response is a fallback, not evidence that the write flag is false.

An authenticated GET to `/api/admin/diagnostics?connectivity=1` now opts into a
single read-only request for `medresa_admin_articles?select=id&limit=1`.
Default diagnostics continue to make no provider request. Production and any
branch other than `codex/admin-panel` are blocked from the connectivity probe.

The `connectivity` object reports `connected`, `blocked`, `http-error`,
`invalid-response` or `transport-error`. Transport failures return only fixed
categories and recognized Node error codes. HTTP failures return only a status.
No provider response bodies, rows, IDs, error messages, stacks, headers, keys,
hashes, session values or secret fingerprints are exposed or logged.

The probe has a 20-second deadline, refuses redirects and never performs a POST,
RPC, migration, import or Storage operation. It neither changes nor depends on
the write flag. Existing news reads/writes and public rendering are unchanged.

Run the check from Admin → Pregled using **Provjeri Preview vezu**. The control
is available only on the dedicated Admin Preview branch and is behind the
existing page authentication. It sends a relative, same-origin GET, so the
browser includes the existing HttpOnly `SameSite=Strict` session cookie.
Do not send administrators cross-site links directly to the JSON endpoint:
the browser can omit a Strict cookie on that initial navigation even while the
administrator remains signed in on the destination site. No cookie policy,
session verification or API guard is relaxed to accommodate external links.

The in-Admin result also displays `configuration.accepted`, required connection
check booleans and `configuration.failedChecks`. A whitelist prevents reflecting
additional fields or values. Write opt-in is excluded from connection failures
because it does not block reads. A parsed matching hostname alone cannot reveal
raw-URL whitespace, paths, credentials, normalization, HTTPS or key availability.

For a `configuration-unavailable` result, share `configuration.failedChecks` and
`configuration.checks`; never share the server key or raw credential values.
The existing `writeFlagIsFalse:false` check is expected when Preview writes have
been explicitly enabled; it is not a connection error.
