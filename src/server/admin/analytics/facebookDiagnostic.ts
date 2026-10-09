import type { FacebookDiagnostic, FacebookRequestResult } from "@/admin/analytics/facebookTest";
import { facebookHints, facebookMetrics, facebookPermissions, facebookTasks } from "@/admin/analytics/facebookTest";
import { ProviderFailure, providerJson } from "./common";

export function newFacebookDiagnostic(): FacebookDiagnostic { return { tokenPresent: false, pageDiscovered: false, pageId: null, derivedPageTokenObtained: false, permissions: Object.fromEntries(facebookPermissions.map(p => [p, "unverified"])) as FacebookDiagnostic["permissions"], pageTasks: null, insightsAccess: "unverified", requests: [] }; }
const numericCode = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 2147483647 ? v : null;
/** Existing fixed Graph host/requests; only allowlisted codes/topics reach diagnostics. */
export async function facebookGraph(token: string, path: string, params: Record<string, string>, signal: AbortSignal, diagnostic?: FacebookDiagnostic) {
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`); url.search = new URLSearchParams(params).toString();
  const request: FacebookRequestResult["request"] = path === "me/permissions" ? "permissions" : path === "me/accounts" ? "tasks" : params.fields === "id,access_token" ? "page" : params.fields === "followers_count" ? "followers" : path.endsWith("/published_posts") ? "posts" : path.endsWith("/insights") && params.period ? "insights" : "post_insights";
  const result: FacebookRequestResult = { request, metric: facebookMetrics.find(m => m === params.metric) ?? null, httpStatus: null, reason: null, code: null, subcode: null, errorType: null, hints: [] };
  let invalidMetric = false, permissionDenied = false;
  try {
    const body = await providerJson(url, { headers: { Authorization: `Bearer ${token}` } }, signal, (status, body) => {
      result.httpStatus = status;
      const error = body?.error && typeof body.error === "object" && !Array.isArray(body.error) ? body.error as Record<string, unknown> : {};
      result.code = numericCode(error.code); result.subcode = numericCode(error.error_subcode);
      result.errorType = (["OAuthException", "GraphMethodException", "Exception"] as const).find(t => t === error.type) ?? null;
      const message = typeof error.message === "string" ? error.message.slice(0, 4000) : "";
      const topics: Record<typeof facebookHints[number], RegExp> = {
        token: /\b(?:token|oauth|expired)\b/i, permission: /\b(?:permission|permissions|access denied|not authorized)\b/i,
        metric: /\bmetric\b/i, period: /\bperiod\b/i, date_range: /\b(?:since|until|date|timestamp|retention)\b/i,
        fields: /\b(?:field|fields)\b/i, tasks: /\b(?:tasks?|ANALYZE)\b/i,
        read_insights: /\bread_insights\b/i, pages_read_engagement: /\bpages_read_engagement\b/i, pages_show_list: /\bpages_show_list\b/i, business_management: /\bbusiness_management\b/i,
      };
      result.hints = facebookHints.filter(h => topics[h].test(message));
      invalidMetric = /\b(?:unsupported|invalid|deprecated)\b.{0,40}\bmetric\b|\bmetric\b.{0,60}\b(?:not supported|deprecated|must be one of)\b/i.test(message);
      permissionDenied = /\b(?:requires?|missing|denied|insufficient)\b.{0,100}(?:permission|read_insights|pages_read_engagement)/i.test(message);
    });
    if (request === "insights" && Array.isArray(body.data) && diagnostic) diagnostic.insightsAccess = diagnostic.insightsAccess === "denied" || diagnostic.insightsAccess === "partially_verified" ? "partially_verified" : "verified";
    if (Array.isArray(body.data) && body.data.length === 0) result.reason = "no_data";
    return body;
  } catch (error) {
    let failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response");
    if (result.httpStatus === 400 && failure.reason === "unsupported_metric") failure = permissionDenied ? new ProviderFailure("permission_required", "permission_required") : new ProviderFailure("error", invalidMetric ? "unsupported_metric" : "invalid_response");
    result.reason = failure.reason;
    if (request === "insights" && failure.reason === "permission_required" && diagnostic) diagnostic.insightsAccess = diagnostic.insightsAccess === "verified" || diagnostic.insightsAccess === "partially_verified" ? "partially_verified" : "denied";
    throw failure;
  } finally { if (diagnostic && diagnostic.requests.length < 80) diagnostic.requests.push(result); }
}
/** Test-only reads. Page tokens may not support user permission/task introspection.
 * Unavailable introspection never proves that permission/task is missing and cannot block Insights.
 */
export async function facebookAccessDiagnostic(original: string, pageId: string, signal: AbortSignal, diagnostic: FacebookDiagnostic) {
  try {
    const permissions = await facebookGraph(original, "me/permissions", {}, signal, diagnostic);
    if (Array.isArray(permissions.data)) {
      const rows = permissions.data;
      for (const name of facebookPermissions) {
        const row = rows.find(r => r && typeof r === "object" && r.permission === name);
        diagnostic.permissions[name] = (["granted", "declined", "expired"] as const).find(s => s === row?.status) ?? "not_returned";
      }
    }
  } catch { /* Test actual Page Insights independently of introspection support. */ }
  try {
    let after: string | undefined; const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const body = await facebookGraph(original, "me/accounts", { fields: "id,tasks", limit: "100", ...(after ? { after } : {}) }, signal, diagnostic);
      if (!Array.isArray(body.data)) break;
      const page = body.data.find(p => p && typeof p === "object" && p.id === pageId);
      if (page) { const tasks = page.tasks; diagnostic.pageTasks = Array.isArray(tasks) ? facebookTasks.filter(t => tasks.includes(t)) : null; break; }
      const paging = body.paging as { next?: unknown; cursors?: { after?: unknown } } | undefined;
      const cursor = paging?.cursors?.after;
      if (!paging?.next || typeof cursor !== "string" || !cursor || cursor.length > 2048 || seen.has(cursor)) break;
      seen.add(cursor); after = cursor;
    }
  } catch { /* Missing task introspection is unavailable evidence, not a provider failure. */ }
}
