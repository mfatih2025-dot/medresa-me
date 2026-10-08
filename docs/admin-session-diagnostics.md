# Preview API session investigation

A fresh `/admin` navigation succeeding while `/api/admin/news` returns 401 does
not establish a cookie or credential fix. Both routes use the same verifier.
The production build currently passes a local browser login followed by a
same-origin API fetch and direct API navigation.

To obtain deployed evidence, rejected `GET /api/admin/news` requests emit one
server-only `medresa.admin.auth_rejected` event. Logging is restricted to
`VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF=codex/admin-panel`.
The HTTP response remains the existing generic 401. No diagnostic is exposed
through an unauthenticated API, and no Supabase request runs after auth failure.

The event contains a fixed failure code and booleans only:

- `authConfigured`: the API runtime accepts its authentication configuration.
- `expectsSecureCookie`: it expects the HTTPS host cookie.
- `parsedCookiePresent`: Next.js exposed that cookie to the handler.
- `headerContainsExpectedCookie`: the incoming Cookie header contains its name.
- `originMatchesRequestHost`: configured origin and request host match.

Cookie values, signatures, session payloads, account names, headers, URLs,
passwords, hashes, secret fingerprints and environment values are never logged.
The failure code distinguishes missing configuration/cookie, malformed tokens,
signature/identity errors, invalid payloads, future issuance, expiry and duration.
No authentication checks, origin checks, cookie attributes or expiry rules are
relaxed. Credentials and deployment configuration remain unchanged.

Use Vercel Preview runtime logs to inspect this single event after reproducing
the rejected news GET. Never share raw request headers, cookies or unrelated
log entries. Remove this narrow instrumentation after the root cause is resolved.

Validation uses generated disposable local credentials and read-only mock
Supabase responses. It does not authenticate to the real Preview on its own.
