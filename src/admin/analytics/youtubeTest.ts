import { reasonNames, type ProviderState, type Range, type Reason } from "./model";
import { validDay } from "./period";

export const youtubeConfigurationNames = ["YOUTUBE_OAUTH_CLIENT_ID", "YOUTUBE_OAUTH_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"] as const;
export const youtubeRequests = ["oauth", "channel", "daily", "current", "previous", "top", "videos"] as const;
export const youtubeGoogleReasons = ["invalid_client", "invalid_grant", "unauthorized_client", "invalid_scope", "access_denied", "unsupported_grant_type", "accessNotConfigured", "serviceDisabled", "insufficientPermissions", "forbidden", "quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded", "authError", "invalidParameter", "badRequest", "channelNotFound", "youtubeSignupRequired"] as const;
export const youtubeGoogleStatuses = ["INVALID_ARGUMENT", "PERMISSION_DENIED", "UNAUTHENTICATED", "RESOURCE_EXHAUSTED", "NOT_FOUND", "FAILED_PRECONDITION", "UNAVAILABLE", "INTERNAL"] as const;
export type YouTubeRequestResult = { request: typeof youtubeRequests[number]; httpStatus: number | null; reason: Reason | null; code: number | null; googleReason: typeof youtubeGoogleReasons[number] | null; googleStatus: typeof youtubeGoogleStatuses[number] | null };
export type YouTubeDiagnostic = {
  configuration: Record<typeof youtubeConfigurationNames[number], boolean>;
  oauthVerified: boolean; channelDiscovered: boolean; channelId: string | null;
  configuredChannelMatches: boolean | null; analyticsVerified: boolean; requests: YouTubeRequestResult[];
};
export type YouTubeTestResult = { message: string; httpStatus: number; state: ProviderState | null; reason: Reason | null; range: Range | null; stored: boolean; diagnostic: YouTubeDiagnostic | null };
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
/** Fixed safe projection. No credential values, titles, URLs or raw Google responses. */
export function youtubeTestResult(value: unknown, httpStatus: number): YouTubeTestResult {
  const result: YouTubeTestResult = { message: httpStatus === 401 ? "Sesija je istekla. Prijavite se ponovo." : httpStatus === 403 ? "YouTube test nije dozvoljen iz ovog administratorskog prostora." : "YouTube test nije završen. Sačuvani podaci ostaju dostupni.", httpStatus, state: null, reason: null, range: null, stored: false, diagnostic: null };
  if (httpStatus < 200 || httpStatus >= 300) return result;
  const b = record(value);
  if (b.acquired !== true) { result.message = b.outcome === "cooldown" ? "Sačekajte dvije minute između osvježavanja. YouTube test nije pokrenut." : "YouTube test nije pokrenut ili je osvježavanje već u toku."; return result; }
  const d = record(b.youtubeDiagnostic);
  if (b.youtubeDiagnostic) result.diagnostic = {
    configuration: Object.fromEntries(youtubeConfigurationNames.map(k => [k, record(d.configuration)[k] === true])) as YouTubeDiagnostic["configuration"],
    oauthVerified: d.oauthVerified === true, channelDiscovered: d.channelDiscovered === true,
    channelId: d.channelDiscovered === true && typeof d.channelId === "string" && /^UC[\w-]{22}$/.test(d.channelId) ? d.channelId : null,
    configuredChannelMatches: typeof d.configuredChannelMatches === "boolean" ? d.configuredChannelMatches : null,
    analyticsVerified: d.analyticsVerified === true,
    requests: Array.isArray(d.requests) ? d.requests.slice(0, 10).flatMap(v => {
      const r = record(v), request = youtubeRequests.find(s => s === r.request); if (!request) return [];
      return [{ request, httpStatus: typeof r.httpStatus === "number" && Number.isInteger(r.httpStatus) && r.httpStatus >= 100 && r.httpStatus <= 599 ? r.httpStatus : null, reason: reasonNames.find(s => s === r.reason) ?? null,
        code: typeof r.code === "number" && Number.isInteger(r.code) && r.code >= 0 && r.code <= 2147483647 ? r.code : null,
        googleReason: youtubeGoogleReasons.find(s => s === r.googleReason) ?? null, googleStatus: youtubeGoogleStatuses.find(s => s === r.googleStatus) ?? null }];
    }) : [],
  };
  const dashboard = record(b.dashboard), r = Array.isArray(dashboard.reports) ? record(dashboard.reports.find(r => record(r).provider === "youtube")) : {};
  result.state = (["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"] as const).find(s => s === r.state) ?? null;
  result.reason = reasonNames.find(s => s === r.reason) ?? null;
  const range = record(r.range); if (validDay(range.start) && validDay(range.end) && range.start <= range.end) result.range = { start: range.start, end: range.end };
  const run = Array.isArray(dashboard.history) ? record(dashboard.history.find(r => record(r).id === b.runId)) : {};
  result.stored = dashboard.storage === "ready" && run.outcome === "success" && result.state === "connected" && typeof r.fetchedAt === "string" && Number.isFinite(Date.parse(r.fetchedAt));
  result.message = "YouTube test je završen."; return result;
}
export const youtubeRequestLabels: Record<YouTubeRequestResult["request"], string> = { oauth: "Google OAuth", channel: "Vlasnički kanal", daily: "Dnevni tok", current: "Izabrani period", previous: "Prethodni period", top: "Najgledaniji video sadržaj", videos: "Nazivi video sadržaja" };
