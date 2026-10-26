# Production Website tracking

This change adds `@vercel/analytics/next` once, in the shared public shell. The
server renders its wrapper only when Vercel supplies `VERCEL_ENV=production`.
After hydration the wrapper allows only HTTPS `www.medresa.me`, excluding
`/ulaz7*`, `/admin*` (including `/admin-preview`), `/api*` and localized versions
of those routes. The same check runs in `beforeSend`, including for an SDK that
was loaded before client navigation. Pages Router Admin does not mount it.

The SDK owns initial pageviews and client navigation. There are no manual
`pageview`, `track` or second script integrations in the application. The SDK's
Next integration disables the script's automatic pageview counting, avoiding a
second event per navigation. The existing apex 301 redirect is unchanged:
`medresa.me` is not measured before redirect; the final www page is measured once.

## Domain scope and historical data

Vercel's [aggregate API reference](https://vercel.com/docs/rest-api/web-analytics/aggregates-page-views)
does **not** list `requestHostname` among supported filter dimensions. A hostname
field in a response, or a hostname filter in the Vercel dashboard, does not prove
that the API accepts that filter. We do not add a potentially rejected filter or
fall back to unfiltered data after an error.

Canonical collection plus a verified UTC cutover define the new Website scope.
Every aggregate query starts no earlier than
`MEDRESA_ANALYTICS_WEB_TRACKING_SINCE`. Periods before that instant return no
available data, not manufactured zeros. Previous-period comparisons remain
unavailable until measured history exists. Day-grouped API queries round their
start to a calendar boundary, so they omit the partial cutover day; exact
today/yesterday queries retain its measured part and mark it incomplete. Multi-day periods contain completed
UTC calendar days; on launch day use **Danas** to inspect newly collected traffic.

Apply `supabase/migrations/202610260001_canonical_website_analytics.sql` once in the
existing approved Supabase project, after `202610110001_website_analytics_scope.sql`.
It adds the `production_canonical` scope to existing constraints and completion
RPC, retaining every old `preview` and project-wide `production` row. Tables,
primary keys, RLS, existing grants and social-provider behavior are preserved.
A new service-only, read-only readiness probe blocks Website/full sync before
provider collection if the migration is missing. Nothing was applied remotely.

This restriction assumes this is the project's sole Web Analytics integration
and no independent tracker sends events from other domains after cutover. The
API cannot independently prove that assumption. Verify the existing Vercel
Hostname breakdown for the same reporting interval; do not claim arbitrary
project-wide historical data belongs only to www.medresa.me.

## Release steps requiring approval

No merge, deployment, Vercel environment edits or remote database changes were
performed by this task.

1. Confirm Web Analytics is Enabled for the existing `medresa-me` project in team
   `mmf16`. Keep existing domain, DNS and SEO configuration.
2. Apply only the new migration above to the approved existing Supabase project
   (`safsijrhxbefgcahvsvm`). Existing migrations must already be applied. It is
   additive and retains all existing data. Do not rerun historical migrations.
3. After code release approval, deploy this branch's reviewed changes. Collection
   does not require a client token; the read API does require its existing token.
4. Record the actual UTC instant when the canonical-only production deployment
   became ready. Set Production `MEDRESA_ANALYTICS_WEB_TRACKING_SINCE` to that
   instant in ISO UTC form (`YYYY-MM-DDTHH:mm:ss.sssZ`). Use the real deployment
   evidence, never a guessed launch date. Redeploy the approved code to load the
   new environment value. Before this value is valid, Website sync reports
   `tracking_unavailable` and does not fetch project-wide data. Collection itself
   can already run while reporting waits for this verified boundary.
5. Leave the cutover fixed. An optional existing
   `MEDRESA_ANALYTICS_WEB_TRACKING_START` is a real YYYY-MM-DD cumulative start;
   it is clamped to the canonical cutover, never used to recreate older history.

## Production environment checklist

- `VERCEL_ENV=production`: supplied by Vercel; do not override manually.
- `VERCEL_GIT_COMMIT_REF=main`: existing production backend guard; do not override.
- `VERCEL_ANALYTICS_TOKEN`: preserve the existing server-only token with access to
  the `medresa-me` project/team and Web Analytics aggregate API. Never NEXT_PUBLIC_.
- `MEDRESA_ANALYTICS_WEB_TRACKING_SINCE`: new verified cutover instant above.
- `SUPABASE_URL=https://safsijrhxbefgcahvsvm.supabase.co` and
  `MEDRESA_SUPABASE_PROJECT_REF=safsijrhxbefgcahvsvm`: existing approved project.
- `SUPABASE_SERVICE_ROLE_KEY`: existing server-only credential, unchanged.
- `MEDRESA_SUPABASE_WRITE_ENABLED=true`: existing permission for saving aggregates.
- Existing Admin authentication values are unchanged; no new user or password.
- `SITE_URL` is not an analytics credential. No SEO/environment change is needed
  for this feature. No new NEXT_PUBLIC_ variable is required.

## Confirm with organic traffic

Use existing natural traffic, not repeated test visits. A real user's normal
page navigation should load a single SDK script and produce one view intake per
initial page/client navigation. Intake can use `/_vercel/insights/*` or Vercel's
automatically configured resilient path. Do not manually POST events.

In Vercel Analytics, select Production and Hostname www.medresa.me for the same
UTC interval. Allow normal provider processing delay. Then refresh Admin
Analytics with **Osvježi podatke**, choose **Danas** on launch day, and compare
Website pageviews/visitors and its own **Osvježeno** time. The global refresh time
can belong to another provider. Admin reads saved aggregates; there is no new
scheduled sync or cron. A missing number stays unavailable, not zero. Retention
and API permissions can limit history independently of successful collection.

Local unit/PostgreSQL/browser tests use disposable fixtures and a fully
intercepted intake/script. No live analytics events or natural visitor records
are created or modified by verification. Live Production functionality and ENV
values still require the checks above after an approved release.
