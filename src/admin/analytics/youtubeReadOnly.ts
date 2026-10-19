import { reasonLabels, reasonNames } from "./model";
import { youtubeGoogleReasons, youtubeGoogleStatuses, youtubeRequests } from "./youtubeTest";

const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const stages = ["configuration", ...youtubeRequests, "validation"] as const;
const messages: Record<string, string> = {
  invalid_grant: "Google je odbio postojeći OAuth refresh token.",
  invalid_client: "Google nije prihvatio OAuth klijenta.",
  unauthorized_client: "OAuth klijent nema odobrenje za ovaj zahtjev.",
  invalid_scope: "Google je odbio traženi OAuth opseg.",
  insufficientPermissions: "Google je odbio pristup zbog nedovoljnih ovlaštenja.",
  serviceDisabled: "Google API nije omogućen za ovaj projekt.",
  accessNotConfigured: "Google API pristup nije podešen za ovaj projekt.",
};
/** Server and browser allowlist. Never render raw Google text or arbitrary errors. */
export function youtubeReadOnlyResult(value: unknown) {
  const v = record(value);
  const failedStage = stages.find(s => s === v.failedStage) ?? null;
  const reason = reasonNames.find(r => r === v.reason) ?? null;
  const googleErrorCode = [...youtubeGoogleReasons, ...youtubeGoogleStatuses].find(c => c === v.googleErrorCode)
    ?? (typeof v.googleErrorCode === "number" && Number.isInteger(v.googleErrorCode) && v.googleErrorCode >= 0 && v.googleErrorCode <= 2147483647 ? v.googleErrorCode : null);
  return {
    failedStage,
    httpStatus: typeof v.httpStatus === "number" && Number.isInteger(v.httpStatus) && v.httpStatus >= 100 && v.httpStatus <= 599 ? v.httpStatus : null,
    googleErrorCode, reason,
    message: typeof googleErrorCode === "string" && messages[googleErrorCode] ? messages[googleErrorCode] : reason ? reasonLabels[reason] : failedStage ? "YouTube odgovor nije mogao biti potvrđen." : "YouTube provjera je uspješna.",
    refreshTokenExchangeSucceeded: v.refreshTokenExchangeSucceeded === true,
    channelDiscoverySucceeded: v.channelDiscoverySucceeded === true,
    analyticsRequestSucceeded: v.analyticsRequestSucceeded === true,
  };
}
