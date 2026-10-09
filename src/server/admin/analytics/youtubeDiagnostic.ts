import type { YouTubeDiagnostic, YouTubeRequestResult } from "@/admin/analytics/youtubeTest";
import { youtubeConfigurationNames, youtubeGoogleReasons, youtubeGoogleStatuses } from "@/admin/analytics/youtubeTest";
import { providerJson, ProviderFailure } from "./common";

export function youtubeConfiguration(): YouTubeDiagnostic["configuration"] { return Object.fromEntries(youtubeConfigurationNames.map(k => [k, !!process.env[k]?.trim()])) as YouTubeDiagnostic["configuration"]; }
export function newYouTubeDiagnostic(): YouTubeDiagnostic { return { configuration: youtubeConfiguration(), oauthVerified: false, channelDiscovered: false, channelId: null, configuredChannelMatches: null, analyticsVerified: false, requests: [] }; }
/** Existing official Google endpoints; credentials and raw response text never enter diagnostics. */
export async function youtubeJson(url: URL | string, init: RequestInit, signal: AbortSignal, request: YouTubeRequestResult["request"], diagnostic?: YouTubeDiagnostic) {
  const result: YouTubeRequestResult = { request, httpStatus: null, reason: null, code: null, googleReason: null, googleStatus: null };
  try {
    return await providerJson(url, init, signal, (status, body) => {
      result.httpStatus = status;
      if (!body) return;
      const e = body.error && typeof body.error === "object" && !Array.isArray(body.error) ? body.error as Record<string, unknown> : {};
      result.code = typeof e.code === "number" && Number.isInteger(e.code) && e.code >= 0 && e.code <= 2147483647 ? e.code : null;
      result.googleStatus = youtubeGoogleStatuses.find(s => s === e.status) ?? null;
      const errors = Array.isArray(e.errors) ? e.errors : [];
      result.googleReason = youtubeGoogleReasons.find(r => r === body.error || errors.some(e => e && typeof e === "object" && e.reason === r)) ?? null;
    });
  } catch (error) {
    let failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response");
    // The common Meta classifier treats all HTTP 400s as unsupported metrics.
    // Google validation errors alone do not prove an unsupported metric.
    if (request !== "oauth" && failure.reason === "unsupported_metric" && result.httpStatus === 400) failure = new ProviderFailure("error", "invalid_response");
    result.reason = failure.reason; throw failure;
  } finally { if (diagnostic && diagnostic.requests.length < 10) diagnostic.requests.push(result); }
}
