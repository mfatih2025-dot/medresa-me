import { reasonNames, type ProviderState, type Reason, type Range } from "./model";
import { validDay } from "./period";

export const facebookPermissions = ["read_insights", "pages_read_engagement", "pages_show_list", "business_management"] as const;
export const facebookPermissionStates = ["granted", "declined", "expired", "not_returned", "unverified"] as const;
export const facebookTasks = ["ANALYZE", "ADVERTISE", "MESSAGING", "MODERATE", "CREATE_CONTENT", "MANAGE", "PROFILE_PLUS_ANALYZE", "PROFILE_PLUS_FULL_CONTROL"] as const;
export const facebookRequests = ["page", "permissions", "tasks", "followers", "insights", "posts", "post_insights"] as const;
export const facebookMetrics = ["page_media_view", "page_post_engagements", "page_total_media_view_unique", "page_daily_follows", "page_daily_unfollows", "post_media_view"] as const;
export const facebookAccessStates = ["unverified", "verified", "denied", "partially_verified"] as const;
export const facebookHints = ["token", "permission", "metric", "period", "date_range", "fields", "tasks", "read_insights", "pages_read_engagement", "pages_show_list", "business_management"] as const;
export type FacebookRequestResult = {
  request: typeof facebookRequests[number]; metric: typeof facebookMetrics[number] | null;
  httpStatus: number | null; reason: Reason | null; code: number | null; subcode: number | null;
  errorType: "OAuthException" | "GraphMethodException" | "Exception" | null; hints: typeof facebookHints[number][];
};
export type FacebookDiagnostic = {
  tokenPresent: boolean; pageDiscovered: boolean; pageId: string | null; derivedPageTokenObtained: boolean;
  permissions: Record<typeof facebookPermissions[number], typeof facebookPermissionStates[number]>;
  pageTasks: typeof facebookTasks[number][] | null; insightsAccess: typeof facebookAccessStates[number]; requests: FacebookRequestResult[];
};
export type FacebookTestResult = {
  message: string; httpStatus: number; state: ProviderState | null; reason: Reason | null;
  range: Range | null; stored: boolean; followers: number | null; views: number | null; interactions: number | null;
  diagnostic: FacebookDiagnostic | null;
};
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER ? v : null;
const code = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 2147483647 ? v : null;
/** Fixed projection, never raw API responses, token values, URLs or permission lists. */
export function facebookTestResult(value: unknown, httpStatus: number): FacebookTestResult {
  const result: FacebookTestResult = { message: httpStatus === 401 ? "Sesija je istekla. Prijavite se ponovo." : httpStatus === 403 ? "Facebook test nije dozvoljen iz ovog administratorskog prostora." : "Facebook test nije završen. Sačuvani podaci ostaju dostupni.", httpStatus, state: null, reason: null, range: null, stored: false, followers: null, views: null, interactions: null, diagnostic: null };
  if (httpStatus < 200 || httpStatus >= 300) return result;
  const b = record(value);
  if (b.acquired !== true) { result.message = b.outcome === "cooldown" ? "Sačekajte dvije minute između osvježavanja. Facebook test nije pokrenut." : "Facebook test nije pokrenut ili je osvježavanje već u toku."; return result; }
  const d = record(b.facebookDiagnostic), tasks = d.pageTasks;
  if (b.facebookDiagnostic) result.diagnostic = {
    tokenPresent: d.tokenPresent === true, pageDiscovered: d.pageDiscovered === true,
    pageId: d.pageDiscovered === true && typeof d.pageId === "string" && /^\d{1,32}$/.test(d.pageId) ? d.pageId : null,
    derivedPageTokenObtained: d.derivedPageTokenObtained === true,
    permissions: Object.fromEntries(facebookPermissions.map(p => [p, facebookPermissionStates.find(s => s === record(d.permissions)[p]) ?? "unverified"])) as FacebookDiagnostic["permissions"],
    pageTasks: Array.isArray(tasks) ? facebookTasks.filter(t => tasks.includes(t)) : null,
    insightsAccess: facebookAccessStates.find(s => s === d.insightsAccess) ?? "unverified",
    requests: Array.isArray(d.requests) ? d.requests.slice(0, 80).flatMap(v => {
      const r = record(v), request = facebookRequests.find(s => s === r.request);
      if (!request) return [];
      return [{ request, metric: facebookMetrics.find(s => s === r.metric) ?? null, httpStatus: typeof r.httpStatus === "number" && Number.isInteger(r.httpStatus) && r.httpStatus >= 100 && r.httpStatus <= 599 ? r.httpStatus : null, reason: reasonNames.find(s => s === r.reason) ?? null, code: code(r.code), subcode: code(r.subcode), errorType: (["OAuthException", "GraphMethodException", "Exception"] as const).find(t => t === r.errorType) ?? null, hints: facebookHints.filter(h => Array.isArray(r.hints) && r.hints.includes(h)) }];
    }) : [],
  };
  const dashboard = record(b.dashboard), r = Array.isArray(dashboard.reports) ? record(dashboard.reports.find(r => record(r).provider === "facebook")) : {};
  result.state = (["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"] as const).find(s => s === r.state) ?? null;
  result.reason = reasonNames.find(s => s === r.reason) ?? null;
  const range = record(r.range); if (validDay(range.start) && validDay(range.end) && range.start <= range.end) result.range = { start: range.start, end: range.end };
  const run = Array.isArray(dashboard.history) ? record(dashboard.history.find(r => record(r).id === b.runId)) : {};
  result.stored = dashboard.storage === "ready" && run.outcome === "success" && result.state === "connected" && typeof r.fetchedAt === "string" && Number.isFinite(Date.parse(r.fetchedAt));
  if (result.stored) { result.followers = number(record(r.current).followers); result.views = number(record(r.totals).views); result.interactions = number(record(r.totals).interactions); }
  result.message = "Facebook test je završen."; return result;
}
export const facebookRequestLabels: Record<FacebookRequestResult["request"], string> = { page: "Medresa Page", permissions: "Dozvole", tasks: "Page zadaci", followers: "Pratioci", insights: "Page Insights", posts: "Objave", post_insights: "Insights objave" };
