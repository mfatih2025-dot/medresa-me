# Initial Production backend configuration

Production/main and Preview/codex/admin-panel use the existing medresa-me-preview
project, ref `safsijrhxbefgcahvsvm`. Production is pinned to this ref. Other Preview
branches stay blocked. Existing database rows, migrations and the private buckets
`medresa-news-preview`, `medresa-campaigns-preview`, `medresa-results-preview`
are reused unchanged. No migrations, bucket creation or data operations are required
by this application-guard change. Both deployments share published data and history.

## Vercel project medresa-me → Environment Variables → Production

Enable the following existing variables for Production, keeping Preview scopes intact.
Do not prefix server credentials with NEXT_PUBLIC_. Never paste secrets into chat.

| Name | Purpose / required setting |
| --- | --- |
| SUPABASE_URL | `https://safsijrhxbefgcahvsvm.supabase.co` |
| SUPABASE_SERVICE_ROLE_KEY | Existing approved project's server-only service-role key |
| MEDRESA_SUPABASE_PROJECT_REF | `safsijrhxbefgcahvsvm` |
| MEDRESA_SUPABASE_WRITE_ENABLED | `true` for Admin mutations |
| MEDRESA_ADMIN_USER | Existing Admin identity |
| MEDRESA_ADMIN_PASSWORD_HASH | Existing scrypt password hash, not a plaintext password |
| MEDRESA_ADMIN_SESSION_SECRET | Existing session-signing secret |
| MEDRESA_ADMIN_ORIGIN | `https://www.medresa.me` (origin only, no path/trailing slash) |
| OPENAI_API_KEY | Existing verified translation key |
| INSTAGRAM_ACCESS_TOKEN | Existing verified Facebook Login token for Instagram feed/Insights |
| FACEBOOK_PAGE_ACCESS_TOKEN | Existing verified Facebook feed/Insights credential |
| VERCEL_ANALYTICS_TOKEN | Existing verified Vercel Web Analytics access token |
| YOUTUBE_OAUTH_CLIENT_ID | Existing verified YouTube OAuth client |
| YOUTUBE_OAUTH_CLIENT_SECRET | Existing verified YouTube OAuth client secret |
| YOUTUBE_REFRESH_TOKEN | Existing verified owner OAuth refresh token |

Optional existing settings:

- YOUTUBE_CHANNEL_ID: preserve if configured; validates the discovered owner channel.
- MEDRESA_ANALYTICS_WEB_TRACKING_START: preserve the actual tracking start date
  (YYYY-MM-DD), if configured. Never invent a date.
- SITE_URL: optional; defaults to https://www.medresa.me. If set, use that origin.
- GOOGLE_SITE_VERIFICATION: optional existing Search Console verification setting.

VERCEL_ENV, VERCEL_GIT_COMMIT_REF and VERCEL_GIT_COMMIT_SHA are supplied by Vercel;
do not create manual overrides. Production branch must be main. Attach
www.medresa.me and medresa.me to the existing Vercel project; existing apex redirect
sends medresa.me to www.medresa.me.

No new OAuth callback is introduced: YouTube continues to use the existing refresh
credential and Meta continues the already verified Page/account discovery flows.

## Website Analytics traffic scope

Both approved Admin deployments measure Production website traffic only. The Vercel
filter excludes `/admin*` and `/ulaz7*`. Apply
`202610110001_website_analytics_scope.sql` once before release: it separates new
Production snapshots from retained Preview history without deleting or changing metrics.
Other providers retain their existing storage and behavior. No live sync was run locally.

## Release gate

The current session cannot inspect private Vercel variable scopes: no Vercel management
connection/token is available. Production variable presence is unverified, not assumed
missing. Confirm these scopes/settings in Vercel before authorizing the main push.
No environment changes, database writes or Production deployment are performed here.
