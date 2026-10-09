import { reasonNames, type ProviderState, type Range, type Reason } from "./model";
import { validDay } from "./period";

export const instagramRequests = ["pages", "page_link", "permissions", "account_type", "followers", "insights", "media", "media_insights"] as const;
export const instagramMetrics = ["views", "total_interactions", "reach", "profile_links_taps", "follows_and_unfollows"] as const;
export const instagramHints = ["token", "permission", "professional_account", "account", "fields", "metric", "metric_type", "period", "breakdown", "date_range", "account_threshold", "api_version", "rate_limit", "instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement", "business_management", "ads_read", "ads_management"] as const;
export const instagramAccountTypes = ["BUSINESS", "MEDIA_CREATOR", "CREATOR", "PERSONAL"] as const;
export const instagramAccessStates = ["verified", "denied", "partially_verified", "unverified"] as const;
export const instagramPermissionStates = ["granted", "declined", "expired", "not_returned", "unverified"] as const;
export const instagramPermissionNames = ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement", "business_management", "ads_read", "ads_management"] as const;
export const instagramPageTasks = ["ANALYZE", "ADVERTISE", "MESSAGING", "MODERATE", "CREATE_CONTENT", "MANAGE", "MANAGE_LEADS", "PROFILE_PLUS_ANALYZE", "PROFILE_PLUS_FULL_CONTROL"] as const;
export const instagramLookupStates = ["not_checked", "success", "empty", "failed"] as const;
export type InstagramPermissionStatus = typeof instagramPermissionStates[number];
export type InstagramRequestResult = {
  request: typeof instagramRequests[number]; metric: typeof instagramMetrics[number] | null;
  credential: "user" | "page";
  metricType: "total_value" | "time_series" | null; period: "day" | null; range: Range | null;
  httpStatus: number | null; reason: Reason | null; code: number | null; subcode: number | null;
  errorType: "OAuthException" | "GraphMethodException" | "IGApiException" | "InstagramApiException" | "Exception" | null;
  hints: typeof instagramHints[number][];
};
export type InstagramDiagnostic = {
  tokenPresent: boolean; pageDiscovered: boolean; pageId: string | null;
  pageTokenObtained: boolean; pageTasks: typeof instagramPageTasks[number][] | null;
  userTokenLookup: typeof instagramLookupStates[number]; pageTokenLookup: typeof instagramLookupStates[number];
  userTokenAccountId: string | null; pageTokenAccountId: string | null;
  selectedCredential: "user" | "page" | null;
  permissions: Record<typeof instagramPermissionNames[number], InstagramPermissionStatus>;
  pageLinkStatus: "not_checked" | "not_exposed" | "linked";
  accountDiscovered: boolean; accountId: string | null; differsFromOldLoginId: boolean | null;
  username: string | null;
  expectedAccountMatches: boolean | null;
  accountIdSource: "instagram_business_account" | null; accountType: typeof instagramAccountTypes[number] | null;
  insightsPermission: typeof instagramPermissionStates[number]; basicPermission: typeof instagramPermissionStates[number];
  insightsAccess: typeof instagramAccessStates[number]; requests: InstagramRequestResult[];
};
export type InstagramTestResult = {
  message: string; httpStatus: number; state: ProviderState | null; reason: Reason | null;
  range: Range | null; stored: boolean; diagnostic: InstagramDiagnostic | null;
};
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const numericCode = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 2147483647 ? v : null;
const rangeOf = (v: unknown): Range | null => { const r = record(v); return validDay(r.start) && validDay(r.end) && r.start <= r.end ? { start: r.start, end: r.end } : null; };

/** Explicit safe projection; no raw API text, token, URL, headers or arbitrary keys. */
export function instagramTestResult(value: unknown, httpStatus: number): InstagramTestResult {
  const result: InstagramTestResult = { message: httpStatus === 401 ? "Sesija je istekla. Prijavite se ponovo." : httpStatus === 403 ? "Instagram test nije dozvoljen iz ovog administratorskog prostora." : "Instagram test nije završen. Sačuvani podaci ostaju dostupni.", httpStatus, state: null, reason: null, range: null, stored: false, diagnostic: null };
  if (httpStatus < 200 || httpStatus >= 300) return result;
  const body = record(value);
  if (body.acquired !== true) { result.message = body.outcome === "cooldown" ? "Sačekajte dvije minute između osvježavanja. Instagram test nije pokrenut." : "Osvježavanje je već u toku ili nije pokrenuto. Instagram test nije pokrenut."; return result; }
  const dashboard = record(body.dashboard), d = record(body.instagramDiagnostic);
  if (body.instagramDiagnostic) result.diagnostic = {
    tokenPresent: d.tokenPresent === true, accountDiscovered: d.accountDiscovered === true,
    pageDiscovered: d.pageDiscovered === true,
    pageId: d.pageDiscovered === true && typeof d.pageId === "string" && /^\d{1,32}$/.test(d.pageId) ? d.pageId : null,
    pageTokenObtained: d.pageTokenObtained === true,
    pageTasks: Array.isArray(d.pageTasks) ? instagramPageTasks.filter(t => (d.pageTasks as unknown[]).includes(t)) : null,
    userTokenLookup: instagramLookupStates.find(s => s === d.userTokenLookup) ?? "not_checked",
    pageTokenLookup: instagramLookupStates.find(s => s === d.pageTokenLookup) ?? "not_checked",
    userTokenAccountId: typeof d.userTokenAccountId === "string" && /^\d{1,32}$/.test(d.userTokenAccountId) ? d.userTokenAccountId : null,
    pageTokenAccountId: typeof d.pageTokenAccountId === "string" && /^\d{1,32}$/.test(d.pageTokenAccountId) ? d.pageTokenAccountId : null,
    selectedCredential: d.selectedCredential === "user" || d.selectedCredential === "page" ? d.selectedCredential : null,
    permissions: Object.fromEntries(instagramPermissionNames.map(p => [p, instagramPermissionStates.find(s => s === record(d.permissions)[p]) ?? "unverified"])) as InstagramDiagnostic["permissions"],
    pageLinkStatus: d.pageLinkStatus === "linked" || d.pageLinkStatus === "not_exposed" ? d.pageLinkStatus : "not_checked",
    differsFromOldLoginId: typeof d.differsFromOldLoginId === "boolean" ? d.differsFromOldLoginId : null,
    expectedAccountMatches: typeof d.expectedAccountMatches === "boolean" ? d.expectedAccountMatches : null,
    accountId: d.accountDiscovered === true && typeof d.accountId === "string" && /^\d{1,32}$/.test(d.accountId) ? d.accountId : null,
    accountIdSource: d.accountIdSource === "instagram_business_account" ? d.accountIdSource : null,
    accountType: instagramAccountTypes.find(t => t === d.accountType) ?? null,
    username: typeof d.username === "string" && /^[a-zA-Z0-9._]{1,30}$/.test(d.username) ? d.username : null,
    insightsPermission: instagramPermissionStates.find(t => t === d.insightsPermission) ?? "unverified",
    basicPermission: instagramPermissionStates.find(t => t === d.basicPermission) ?? "unverified",
    insightsAccess: instagramAccessStates.find(s => s === d.insightsAccess) ?? "unverified",
    requests: Array.isArray(d.requests) ? d.requests.slice(0, 160).flatMap(v => {
      const r = record(v), request = instagramRequests.find(n => n === r.request);
      if (!request) return [];
      return [{ request, credential: r.credential === "page" ? "page" : "user", metric: instagramMetrics.find(m => m === r.metric) ?? null, metricType: r.metricType === "total_value" || r.metricType === "time_series" ? r.metricType : null, period: r.period === "day" ? "day" : null, range: rangeOf(r.range), httpStatus: typeof r.httpStatus === "number" && Number.isInteger(r.httpStatus) && r.httpStatus >= 100 && r.httpStatus <= 599 ? r.httpStatus : null, reason: reasonNames.find(s => s === r.reason) ?? null, code: numericCode(r.code), subcode: numericCode(r.subcode), errorType: (["OAuthException", "GraphMethodException", "IGApiException", "InstagramApiException", "Exception"] as const).find(t => t === r.errorType) ?? null, hints: instagramHints.filter(h => Array.isArray(r.hints) && r.hints.includes(h)) }];
    }) : [],
  };
  const report = Array.isArray(dashboard.reports) ? record(dashboard.reports.find(r => record(r).provider === "instagram")) : {};
  result.state = (["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"] as const).find(s => s === report.state) ?? null;
  result.reason = reasonNames.find(r => r === report.reason) ?? null; result.range = rangeOf(report.range);
  const run = Array.isArray(dashboard.history) ? record(dashboard.history.find(r => record(r).id === body.runId)) : {};
  result.stored = dashboard.storage === "ready" && run.outcome === "success" && result.state === "connected" && typeof report.fetchedAt === "string" && Number.isFinite(Date.parse(report.fetchedAt));
  result.message = "Instagram test je završen.";
  return result;
}
export const instagramRequestLabels: Record<InstagramRequestResult["request"], string> = { pages: "Otkrivanje Page · /me/accounts", page_link: "Page → instagram_business_account", permissions: "Dozvole · /me/permissions", account_type: "Tip računa", followers: "Pratioci", insights: "Insights računa", media: "Objave računa", media_insights: "Insights objave" };
export const instagramAccessLabels: Record<InstagramDiagnostic["insightsAccess"], string> = { verified: "Potvrđen stvarnim Insights odgovorom", denied: "Odbijen od Meta API-ja", partially_verified: "Djelimično potvrđen; neke dozvole su odbijene", unverified: "Nije potvrđen" };
