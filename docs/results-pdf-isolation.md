# Complete temporary PDF isolation

This supersedes the management-only suspension while the PDF module is disabled.
No migration, database change, Storage deletion or automatic cleanup is required.

Server-only flag `MEDRESA_RESULTS_PDF_MODULE_ENABLED` must be exactly `true` to
enable the PDF subsystem. Missing, false and other values isolate it. Full write
management additionally requires the existing
`MEDRESA_RESULTS_PDF_MANAGEMENT_ENABLED=true` and existing write permissions.
Reactivation requires an approved deployment loading the flags; no automatic date
or next-year timer is used. Preserve all other ENV values.

While isolated:

- The existing homepage admission card says `UPIS JE ZATVOREN` (SQ/EN reuse the
  existing institutional closed-status translations). Its composition and motion
  remain intact. The PDF/document icon is not rendered.
- Upis keeps its existing animated closed-status section and omits the complete
  document section, including empty download placeholders and PDF marks. No new
  public message or replacement section is introduced. It does not query PDF
  publications or admissions status from Supabase while isolated.
- Admin keeps the separate admissions OPEN/CLOSED control, but renders no PDF
  picker, tabs, draft, published-file links or publication controls. Listing the
  PDF library returns an empty local result without a maintenance notice or any
  database read.
- Protected PDF state/asset APIs and all upload/chunk/finalize/publish/remove
  operations reject with 404 before Supabase access. The existing maintenance
  error text is reused by protected APIs; it is not added to public pages.
- Public PDF downloads return the existing empty 404. Original URLs and code
  remain in place for reactivation; downloads are intentionally unavailable
  during isolation. This differs from the earlier management-only suspension.

All existing PDFs, drafts, publication history, tables, functions, grants, records
and Storage objects remain untouched. The separate admissions status API is not
a PDF API and remains functional. Other modules retain their own database use.

## Repeated removal RPC

The repository still has one production invocation site for
`medresa_results_remove_draft`, in the Results service behind both server flags.
The only application route to it is authenticated, origin-checked POST
`/api/admin/results` with `action: "remove"`. No Results mutation timer, retry,
cron, trigger invoking removal or arbitrary-RPC forwarding route was found.
Tests invoke it only through local database fixtures. Replacement calls finalize,
not removal. The SQL revision check is not changed or bypassed.

This application isolation takes effect only after an approved deployment. It
cannot disable direct PostgREST clients using valid database/API credentials,
older/Preview deployments with active PDF code, or external jobs. Supabase and
Vercel log access is unavailable here, so the actual once-per-second caller and
CPU attribution remain unconfirmed. Correlate exact RPC Gateway requests with
Vercel deployment requests in a fresh UTC window; preserve credentials and do not
reproduce a mutation to diagnose it.

Local verification uses disposable PGlite/Storage fixtures and intercepted HTTP.
It checks default isolation, zero PDF Supabase requests for public/admin reads
and mutations, all locales, unchanged stored bytes, flag reactivation and
360/390/412/430/768/1440px layouts. No production SQL is executed.
