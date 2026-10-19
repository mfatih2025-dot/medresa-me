import type { Period } from "@/admin/analytics/model";
import { youtubeReadOnlyResult } from "@/admin/analytics/youtubeReadOnly";
import { ProviderFailure } from "./common";
import { youtube } from "./youtube";
import { newYouTubeDiagnostic } from "./youtubeDiagnostic";

/** Only Google API reads/token exchange. No dashboard, sync, database or Storage calls. */
export async function readOnlyYouTubeDiagnostic(period: Period) {
  const diagnostic = newYouTubeDiagnostic();
  let failure: ProviderFailure | null = null;
  try { await youtube(period, new Date(), AbortSignal.timeout(45000), diagnostic); }
  catch (error) { failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response"); }
  const configured = Object.values(diagnostic.configuration).every(Boolean);
  const rejected = diagnostic.requests.find(r => r.reason !== null);
  const last = diagnostic.requests.at(-1);
  const failedStage = !configured ? "configuration" : rejected?.request ?? (failure ? !diagnostic.oauthVerified ? "oauth" : !diagnostic.channelDiscovered || diagnostic.configuredChannelMatches === false ? "channel" : "validation" : null);
  const request = rejected ?? (failure ? last : diagnostic.requests.find(r => r.request === "daily"));
  return youtubeReadOnlyResult({
    failedStage, httpStatus: request?.httpStatus,
    googleErrorCode: request?.googleReason ?? request?.googleStatus ?? request?.code,
    reason: !configured ? "not_configured" : rejected?.reason ?? failure?.reason,
    refreshTokenExchangeSucceeded: diagnostic.oauthVerified,
    channelDiscoverySucceeded: diagnostic.channelDiscovered,
    analyticsRequestSucceeded: diagnostic.analyticsVerified,
  });
}
