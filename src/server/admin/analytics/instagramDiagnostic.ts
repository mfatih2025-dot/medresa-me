import type { InstagramDiagnostic, InstagramRequestResult } from "@/admin/analytics/instagramTest";
import { instagramHints, instagramMetrics } from "@/admin/analytics/instagramTest";
import { dayAt } from "@/admin/analytics/period";
import { ProviderFailure, providerJson } from "./common";

export function newInstagramDiagnostic(): InstagramDiagnostic { return { tokenPresent: false, pageDiscovered: false, pageId: null, pageLinkStatus: "not_checked", accountDiscovered: false, accountId: null, differsFromOldLoginId: null, expectedAccountMatches: null, accountIdSource: null, accountType: null, insightsPermission: "unverified", basicPermission: "unverified", insightsAccess: "unverified", requests: [] }; }
/** Only fixed topics and numeric Meta codes leave the server. Raw text stays here. */
export function instagramRejection(body: Record<string, unknown>) {
  const e = body.error && typeof body.error === "object" && !Array.isArray(body.error) ? body.error as Record<string, unknown> : {};
  const code = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 2147483647 ? v : null;
  const message = typeof e.message === "string" ? e.message.slice(0, 4000) : "";
  const tests: Record<typeof instagramHints[number], RegExp> = {
    token: /\b(?:token|oauth|expired|session invalid)\b/i, permission: /\b(?:permission|permissions|not authorized|not authorised|access denied)\b|instagram_(?:business_)?manage_insights/i,
    professional_account: /\b(?:professional|business|creator) account\b/i, account: /\b(?:user_id|account|user id|object.*not found|unsupported get request)\b/i,
    fields: /\b(?:field|fields)\b/i, metric: /\bmetric\b/i, metric_type: /\bmetric_type\b/i, period: /\bperiod\b/i,
    breakdown: /\bbreakdown\b/i, date_range: /\b(?:since|until|date|timestamp|time range|retention)\b|\b\d+ days\b/i,
    account_threshold: /\b(?:100 followers|not enough followers|fewer than|threshold)\b/i, api_version: /\b(?:api version|version.*deprecated)\b/i,
    rate_limit: /\b(?:rate limit|too many|request limit)\b/i,
  };
  const unsupportedMetric = /\b(?:invalid|unsupported|deprecated)\b.{0,40}\bmetric\b|\bmetric\b.{0,60}\b(?:not supported|deprecated|must be one of)\b/i.test(message) && !/\bmetric_type\b/i.test(message);
  const denied = /(?:requires?|missing|denied|not granted|not authorized|insufficient).{0,100}(?:permissions?|instagram_(?:business_)?manage_insights)|(?:permissions?|instagram_(?:business_)?manage_insights).{0,100}(?:required|denied|not granted|missing|insufficient)/i.test(message);
  return { code: code(e.code), subcode: code(e.error_subcode), errorType: (["OAuthException", "GraphMethodException", "IGApiException", "InstagramApiException", "Exception"] as const).find(t => t === e.type) ?? null, hints: instagramHints.filter(h => tests[h].test(message)), unsupportedMetric, denied };
}
export async function instagramGraph(token: string, path: string, params: Record<string, string>, signal: AbortSignal, diagnostic?: InstagramDiagnostic) {
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`); url.search = new URLSearchParams(params).toString();
  const request: InstagramRequestResult["request"] = path === "me/accounts" ? "pages" : path === "me/permissions" ? "permissions" : params.fields === "instagram_business_account" ? "page_link" : params.fields === "id,username,account_type" ? "account_type" : params.fields === "followers_count" ? "followers" : path.endsWith("/media") ? "media" : params.period ? "insights" : "media_insights";
  const numericTime = (v?: string) => v && /^\d+$/.test(v) && Number.isFinite(Number(v)) && Number(v) * 1000 <= 8640000000000000 ? Number(v) * 1000 : null;
  const since = numericTime(params.since), until = numericTime(params.until);
  const result: InstagramRequestResult = { request, metric: instagramMetrics.find(m => m === params.metric) ?? null, metricType: params.metric_type === "total_value" || params.metric_type === "time_series" ? params.metric_type : null, period: params.period === "day" ? "day" : null, range: since !== null && until !== null && since < until ? { start: dayAt(new Date(since), "UTC"), end: dayAt(new Date(until - 1), "UTC") } : null, httpStatus: null, reason: null, code: null, subcode: null, errorType: null, hints: [] };
  let rejection: ReturnType<typeof instagramRejection> | undefined;
  try {
    const body = await providerJson(url, { headers: { Authorization: `Bearer ${token}` } }, signal, (status, body) => {
      result.httpStatus = status;
      if (body?.error) { rejection = instagramRejection(body); const { code, subcode, errorType, hints } = rejection; Object.assign(result, { code, subcode, errorType, hints }); }
    });
    if (request === "insights" && Array.isArray(body.data) && diagnostic) diagnostic.insightsAccess = diagnostic.insightsAccess === "denied" || diagnostic.insightsAccess === "partially_verified" ? "partially_verified" : "verified";
    if (Array.isArray(body.data) && body.data.length === 0) result.reason = "no_data";
    return body;
  } catch (error) {
    let failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response");
    // HTTP 400 / code 100 alone does not prove that a metric is unsupported.
    if (result.httpStatus === 400 && failure.reason === "unsupported_metric") failure = rejection?.denied ? new ProviderFailure("permission_required", "permission_required") : new ProviderFailure("error", rejection?.unsupportedMetric ? "unsupported_metric" : "invalid_response");
    result.reason = failure.reason;
    if (request === "insights" && failure.reason === "permission_required" && diagnostic) diagnostic.insightsAccess = diagnostic.insightsAccess === "verified" || diagnostic.insightsAccess === "partially_verified" ? "partially_verified" : "denied";
    throw failure;
  } finally { if (diagnostic && diagnostic.requests.length < 160) diagnostic.requests.push(result); }
}

/** Facebook Login user token: discover only the existing Medresa Page's linked IG account.
 * Never read a Page access token, reuse an Instagram Login ID, or follow paging URLs.
 */
export async function discoverInstagramFacebook(token: string, expectedPageId: string, signal: AbortSignal, diagnostic?: InstagramDiagnostic): Promise<string> {
  const query = (path: string, params: Record<string, string>) => instagramGraph(token, path, params, signal, diagnostic);
  if (diagnostic) {
    try {
      const permissions = await query("me/permissions", {});
      if (Array.isArray(permissions.data)) {
        const rows = permissions.data;
        const status = (name: string) => {
          const row = rows.find((r: unknown) => r && typeof r === "object" && (r as Record<string, unknown>).permission === name);
          return (["granted", "declined", "expired"] as const).find(s => s === row?.status) ?? "not_returned";
        };
        diagnostic.insightsPermission = status("instagram_manage_insights");
        diagnostic.basicPermission = status("instagram_basic");
      }
    } catch (error) { if (error instanceof ProviderFailure && error.reason === "expired_credential") throw error; /* Otherwise actual access is tested below. */ }
  }
  let after: string | undefined;
  const seen = new Set<string>();
  let found = false;
  for (let page = 0; page < 10; page++) {
    const response = await query("me/accounts", { fields: "id", limit: "100", ...(after ? { after } : {}) });
    if (!Array.isArray(response.data)) throw new ProviderFailure("error", "invalid_response");
    found = response.data.some(r => r && typeof r === "object" && r.id === expectedPageId);
    if (found) break;
    const paging = response.paging as { next?: unknown; cursors?: { after?: unknown } } | undefined;
    const cursor = paging?.cursors?.after;
    if (!paging?.next) break;
    if (typeof cursor !== "string" || !cursor || cursor.length > 2048 || seen.has(cursor) || page === 9) throw new ProviderFailure("error", "invalid_response");
    seen.add(cursor); after = cursor;
  }
  if (!found) throw new ProviderFailure("permission_required", "permission_required");
  if (diagnostic) { diagnostic.pageDiscovered = true; diagnostic.pageId = expectedPageId; }
  const page = await query(expectedPageId, { fields: "instagram_business_account" });
  const link = page.instagram_business_account as { id?: unknown } | undefined;
  if (!link) { if (diagnostic) diagnostic.pageLinkStatus = "missing"; throw new ProviderFailure("permission_required", "permission_required"); }
  const id = link.id;
  if (typeof id !== "string" || !/^\d{1,32}$/.test(id) || id === token) throw new ProviderFailure("error", "invalid_response");
  if (diagnostic) {
    diagnostic.pageLinkStatus = "linked"; diagnostic.accountDiscovered = true;
    diagnostic.accountId = id; diagnostic.accountIdSource = "instagram_business_account";
    diagnostic.differsFromOldLoginId = id !== "17841472991265776";
    try {
      const profile = await query(id, { fields: "id,username,account_type" });
      if (profile.id !== id) throw new ProviderFailure("error", "invalid_response");
      diagnostic.expectedAccountMatches = typeof profile.username === "string" ? profile.username.toLowerCase() === "medresacg" : null;
      diagnostic.accountType = (["BUSINESS", "MEDIA_CREATOR", "CREATOR", "PERSONAL"] as const).find(t => t === profile.account_type) ?? null;
    } catch { /* Optional profile metadata must not block actual Insights. */ }
  }
  return id;
}
