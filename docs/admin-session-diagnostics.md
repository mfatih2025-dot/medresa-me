# Preview Admin sessions and diagnostics

Admin pages and API routes use the same session verifier. Missing, tampered,
expired or invalid sessions are rejected before any Supabase request. API methods,
mutation origins, cookie attributes and session expiry rules remain enforced.
Rejected news requests return the existing generic 401 without temporary
session-investigation logging.

Use Admin → Pregled → **Provjeri Preview vezu** for the authenticated, read-only
Preview configuration and Supabase connectivity checks. The relative same-origin
request preserves the existing HttpOnly SameSite=Strict cookie. Translation health
retains the simple `openAiKeyPresent` boolean and its Preview/branch/write guards.
No credential values, cookie contents or raw provider errors are exposed.

Local unit and browser tests verify rejection of missing/tampered sessions,
foreign-origin mutations, successful authenticated API requests and secret
non-exposure. These tests do not authenticate to the remote Preview themselves.
