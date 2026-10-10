# Global admissions OPEN/CLOSED — Preview only

Manually apply only `supabase/migrations/202610100005_admissions_status.sql` to **medresa-me-preview**. It is additive and creates one singleton table, RLS and one service-role-only, invoker status RPC. It does not alter PDF/News/Campaign/Analytics tables, assets, publication heads or existing migrations. No new bucket, credential or environment variable.

The table `public.medresa_admissions_status` stores `is_open`, its own optimistic `revision`, and editor/timestamp metadata. Default OPEN preserves the current admission state. There is one global switch, independent of BS/SQ/EN PDFs. Admin → Rezultati → STATUS UPISA offers OPEN / CLOSED; selection saves immediately through the authenticated, same-origin Preview endpoint. Failed or stale saves leave the stored state unchanged.

All three existing public admission routes read the state server-side at request time using no-store requests. Static translations are injected into the existing introductory status line and large animated status word, preserving their renderer, classes, sizes and animation parameters. The status phrases are exactly:

| Locale | OPEN | CLOSED |
| --- | --- | --- |
| BS | UPIS JE OTVOREN | UPIS JE ZATVOREN |
| SQ | REGJISTRIMI ËSHTË I HAPUR | REGJISTRIMI ËSHTË I MBYLLUR |
| EN | ADMISSIONS ARE OPEN | ADMISSIONS ARE CLOSED |

The existing PDF module is byte-equivalent apart from its already established data-source integration; locale PDF publication remains unchanged. A status edit requires only a page refresh, not a code change or deployment. Missing migration/backend retains the original public status content and disables the Admin control with a concise migration message. No visitor-facing credentials or metadata are exposed.

Tests use local disposable PostgreSQL/Storage fixtures only; no remote status was changed. Browser checks toggle both states and reload all three public routes without rebuilding, plus the full independent PDF upload/publication/replacement regression.
