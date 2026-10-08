// Authenticated Preview diagnostics only. Never return error messages, headers or data.
import { supabaseConfiguration } from "./supabase";

const transportCodes: Record<string, string> = {
  ENOTFOUND: "dns-not-found",
  EAI_AGAIN: "dns-temporary-failure",
  ECONNREFUSED: "connection-refused",
  ECONNRESET: "connection-reset",
  ENETUNREACH: "network-unreachable",
  EHOSTUNREACH: "host-unreachable",
  ETIMEDOUT: "connection-timeout",
  UND_ERR_CONNECT_TIMEOUT: "connection-timeout",
  UND_ERR_HEADERS_TIMEOUT: "response-timeout",
  UND_ERR_BODY_TIMEOUT: "response-timeout",
  UND_ERR_SOCKET: "socket-failure",
  CERT_HAS_EXPIRED: "tls-certificate-expired",
  ERR_TLS_CERT_ALTNAME_INVALID: "tls-hostname-mismatch",
  DEPTH_ZERO_SELF_SIGNED_CERT: "tls-certificate-untrusted",
  SELF_SIGNED_CERT_IN_CHAIN: "tls-certificate-untrusted",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "tls-certificate-untrusted",
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: "tls-certificate-untrusted",
};

function transportFailure(error: unknown): { reason: string; code?: string } {
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();
  for (let i = 0; pending.length && i < 12; i++) {
    const candidate = pending.shift();
    if (!candidate || typeof candidate !== "object" || seen.has(candidate)) continue;
    seen.add(candidate);
    const value = candidate as { name?: unknown; code?: unknown; cause?: unknown; errors?: unknown };
    if (value.name === "TimeoutError") return { reason: "request-timeout" };
    if (typeof value.code === "string" && Object.hasOwn(transportCodes, value.code)) return { reason: transportCodes[value.code], code: value.code };
    if (value.cause) pending.push(value.cause);
    if (Array.isArray(value.errors)) pending.push(...value.errors.slice(0, 4));
  }
  return { reason: "unclassified-transport-failure" };
}

export async function supabaseConnectionDiagnostic() {
  if (process.env.VERCEL_ENV !== "preview") return { state: "blocked", reason: "preview-required" };
  if (process.env.VERCEL_GIT_COMMIT_REF !== "codex/admin-panel") return { state: "blocked", reason: "admin-branch-required" };
  const config = supabaseConfiguration();
  if (!config) return { state: "blocked", reason: "configuration-unavailable" };
  const headers = new Headers({ apikey: config.key });
  if (!config.key.startsWith("sb_secret_")) headers.set("Authorization", `Bearer ${config.key}`);
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/medresa_admin_articles?select=id&limit=1`, {
      method: "GET", headers, cache: "no-store", signal: AbortSignal.timeout(20000), redirect: "error",
    });
  } catch (error) {
    return { state: "transport-error", ...transportFailure(error), elapsedMilliseconds: Math.max(0, Date.now() - started) };
  }
  if (!response.ok) {
    // Provider error bodies may contain sensitive details. Do not read or reflect them.
    await response.body?.cancel();
    return { state: "http-error", httpStatus: response.status };
  }
  try {
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => !row || typeof row !== "object" || typeof (row as { id?: unknown }).id !== "string")) return { state: "invalid-response", httpStatus: response.status };
  } catch {
    return { state: "invalid-response", httpStatus: response.status };
  }
  return { state: "connected", httpStatus: response.status };
}
