import type { InstagramDiagnostic, InstagramRequestResult } from "@/admin/analytics/instagramTest";
import { instagramHints, instagramMetrics, instagramPageTasks, instagramPermissionNames } from "@/admin/analytics/instagramTest";
import { dayAt } from "@/admin/analytics/period";
import { ProviderFailure, providerJson, safeText } from "./common";

export function newInstagramDiagnostic(): InstagramDiagnostic { return { tokenPresent: false, pageDiscovered: false, pageId: null, pageTokenObtained: false, pageTasks: null, userTokenLookup: "not_checked", pageTokenLookup: "not_checked", userTokenAccountId: null, pageTokenAccountId: null, selectedCredential: null, permissions: Object.fromEntries(instagramPermissionNames.map(p => [p, "unverified"])) as InstagramDiagnostic["permissions"], pageLinkStatus: "not_checked", accountDiscovered: false, accountId: null, username: null, differsFromOldLoginId: null, expectedAccountMatches: null, accountIdSource: null, accountType: null, insightsPermission: "unverified", basicPermission: "unverified", insightsAccess: "unverified", requests: [] }; }
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
    instagram_basic: /\binstagram_basic\b/i, instagram_manage_insights: /\binstagram_manage_insights\b/i,
    pages_show_list: /\bpages_show_list\b/i, pages_read_engagement: /\bpages_read_engagement\b/i,
    business_management: /\bbusiness_management\b/i, ads_read: /\bads_read\b/i, ads_management: /\bads_management\b/i,
  };
  const unsupportedMetric = /\b(?:invalid|unsupported|deprecated)\b.{0,40}\bmetric\b|\bmetric\b.{0,60}\b(?:not supported|deprecated|must be one of)\b/i.test(message) && !/\bmetric_type\b/i.test(message);
  const permission = `(?:permissions?|instagram_business_manage_insights|${instagramPermissionNames.join("|")})`;
  const denied = new RegExp(`(?:requires?|missing|denied|not granted|not authorized|insufficient).{0,100}${permission}|${permission}.{0,100}(?:required|denied|not granted|missing|insufficient)`, "i").test(message);
  return { code: code(e.code), subcode: code(e.error_subcode), errorType: (["OAuthException", "GraphMethodException", "IGApiException", "InstagramApiException", "Exception"] as const).find(t => t === e.type) ?? null, hints: instagramHints.filter(h => tests[h].test(message)), unsupportedMetric, denied };
}
export async function instagramGraph(token: string, path: string, params: Record<string, string>, signal: AbortSignal, diagnostic?: InstagramDiagnostic, credential: "user" | "page" = "user") {
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`); url.search = new URLSearchParams(params).toString();
  const request: InstagramRequestResult["request"] = path === "me/accounts" ? "pages" : path === "me/permissions" ? "permissions" : params.fields === "instagram_business_account" ? "page_link" : params.fields === "id,username,account_type" ? "account_type" : params.fields === "followers_count" ? "followers" : path.endsWith("/media") ? "media" : params.period ? "insights" : "media_insights";
  const numericTime = (v?: string) => v && /^\d+$/.test(v) && Number.isFinite(Number(v)) && Number(v) * 1000 <= 8640000000000000 ? Number(v) * 1000 : null;
  const since = numericTime(params.since), until = numericTime(params.until);
  const result: InstagramRequestResult = { request, credential, metric: instagramMetrics.find(m => m === params.metric) ?? null, metricType: params.metric_type === "total_value" || params.metric_type === "time_series" ? params.metric_type : null, period: params.period === "day" ? "day" : null, range: since !== null && until !== null && since < until ? { start: dayAt(new Date(since), "UTC"), end: dayAt(new Date(until - 1), "UTC") } : null, httpStatus: null, reason: null, code: null, subcode: null, errorType: null, hints: [] };
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

/** Tokens returned here stay within the server provider, never diagnostics or persistence.
 * Compare user/Page access to the confirmed link; never infer disconnection from an empty field.
 */
export async function discoverInstagramFacebook(userToken: string, expectedPageId: string, signal: AbortSignal, diagnostic?: InstagramDiagnostic): Promise<{ id: string; token: string; credential: "user" | "page"; redactions: string[] }> {
  const query = (path: string, params: Record<string, string>) => instagramGraph(userToken, path, params, signal, diagnostic);
  if (diagnostic) {
    try {
      const permissions = await query("me/permissions", {});
      if (Array.isArray(permissions.data)) {
        const rows = permissions.data;
        for (const name of instagramPermissionNames) {
          const row = rows.find((r: unknown) => r && typeof r === "object" && (r as Record<string, unknown>).permission === name);
          diagnostic.permissions[name] = (["granted", "declined", "expired"] as const).find(s => s === row?.status) ?? "not_returned";
        }
        diagnostic.insightsPermission = diagnostic.permissions.instagram_manage_insights;
        diagnostic.basicPermission = diagnostic.permissions.instagram_basic;
      }
    } catch (error) { if (error instanceof ProviderFailure && error.reason === "expired_credential") throw error; }
  }
  let after: string | undefined;
  const seen = new Set<string>();
  let selectedPage: Record<string, unknown> | undefined;
  for (let page = 0; page < 10; page++) {
    const response = await query("me/accounts", { fields: "id,access_token,tasks", limit: "100", ...(after ? { after } : {}) });
    if (!Array.isArray(response.data)) throw new ProviderFailure("error", "invalid_response");
    selectedPage = response.data.find(r => r && typeof r === "object" && r.id === expectedPageId);
    if (selectedPage) break;
    const paging = response.paging as { next?: unknown; cursors?: { after?: unknown } } | undefined;
    const cursor = paging?.cursors?.after;
    if (!paging?.next) break;
    if (typeof cursor !== "string" || !cursor || cursor.length > 2048 || seen.has(cursor) || page === 9) throw new ProviderFailure("error", "invalid_response");
    seen.add(cursor); after = cursor;
  }
  if (!selectedPage) throw new ProviderFailure("permission_required", "permission_required");
  const pageToken = typeof selectedPage.access_token === "string" && selectedPage.access_token.trim() ? selectedPage.access_token : null;
  if (diagnostic) {
    diagnostic.pageDiscovered = true; diagnostic.pageId = expectedPageId; diagnostic.pageTokenObtained = pageToken !== null;
    const tasks = selectedPage.tasks;
    diagnostic.pageTasks = Array.isArray(tasks) ? instagramPageTasks.filter(t => tasks.includes(t)) : null;
  }
  const secrets = [userToken, ...(pageToken ? [pageToken] : [])];
  const lookup = async (token: string, credential: "user" | "page") => {
    let id: string | null = null; let failure: ProviderFailure | null = null;
    try {
      const page = await instagramGraph(token, expectedPageId, { fields: "instagram_business_account" }, signal, diagnostic, credential);
      if (page.id !== undefined && page.id !== expectedPageId) throw new ProviderFailure("error", "invalid_response");
      const link = page.instagram_business_account as { id?: unknown } | undefined;
      if (link != null) {
        if (typeof link.id !== "string" || !/^\d{1,32}$/.test(link.id) || safeText(link.id, secrets) !== link.id) throw new ProviderFailure("error", "invalid_response");
        id = link.id;
      }
    } catch (error) { failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response"); }
    if (diagnostic) {
      const status = failure ? "failed" : id ? "success" : "empty";
      if (credential === "user") { diagnostic.userTokenLookup = status; diagnostic.userTokenAccountId = id; }
      else { diagnostic.pageTokenLookup = status; diagnostic.pageTokenAccountId = id; }
    }
    return { id, failure };
  };
  const userLink = await lookup(userToken, "user");
  const pageLink = pageToken ? await lookup(pageToken, "page") : null;
  if (userLink.id && pageLink?.id && userLink.id !== pageLink.id) throw new ProviderFailure("error", "invalid_response");
  const id = pageLink?.id ?? userLink.id;
  if (!id) {
    if (diagnostic) diagnostic.pageLinkStatus = "not_exposed";
    throw pageLink?.failure ?? userLink.failure ?? new ProviderFailure("permission_required", "permission_required");
  }
  const credential = pageLink?.id && pageToken ? "page" : "user";
  const token = credential === "page" ? pageToken! : userToken;
  if (diagnostic) {
    diagnostic.pageLinkStatus = "linked"; diagnostic.accountDiscovered = true;
    diagnostic.accountId = id; diagnostic.accountIdSource = "instagram_business_account"; diagnostic.selectedCredential = credential;
    diagnostic.differsFromOldLoginId = id !== "17841472991265776";
    try {
      const profile = await instagramGraph(token, id, { fields: "id,username,account_type" }, signal, diagnostic, credential);
      if (profile.id !== id) throw new ProviderFailure("error", "invalid_response");
      diagnostic.username = typeof profile.username === "string" && /^[a-zA-Z0-9._]{1,30}$/.test(profile.username) && safeText(profile.username, secrets) === profile.username ? profile.username : null;
      diagnostic.expectedAccountMatches = diagnostic.username === null ? null : diagnostic.username.toLowerCase() === "medresacg";
      diagnostic.accountType = (["BUSINESS", "MEDIA_CREATOR", "CREATOR", "PERSONAL"] as const).find(t => t === profile.account_type) ?? null;
    } catch { /* Optional metadata cannot block the Insights test. */ }
  }
  return { id, token, credential, redactions: secrets };
}
