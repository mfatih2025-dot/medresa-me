// Only authenticated API routes / getServerSideProps import this server module.
import { AdminError } from "@/admin/contracts";
import { supabaseConfiguration } from "../supabase";
import { ranges, validDay } from "@/admin/analytics/period";
import { metricNames, type Metrics, type Period, type Provider, type ProviderReport, type ProviderState, type Reason } from "@/admin/analytics/model";
export const EXPECTED_PREVIEW_REF = "safsijrhxbefgcahvsvm";
export function previewConfiguration(write = false) {
  const c = supabaseConfiguration();
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== "codex/admin-panel" || !c || c.ref !== EXPECTED_PREVIEW_REF) throw new AdminError(503, "Analitika je dostupna samo za namijenjeni Supabase Preview projekt.");
  if (write && !c.writable) throw new AdminError(503, "Upis analitike u Preview nije omogućen.");
  return c;
}
export class ProviderFailure extends Error {
  constructor(public state: ProviderState, public reason: Reason) { super(reason); }
}
export function number(value: unknown, signed = false): number | null {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))) return null;
  const n = Number(value); return Number.isFinite(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER && (signed || n >= 0) ? n : null;
}
export function metrics(value: unknown): Metrics {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(metricNames.filter(k => k in value).map(k => [k, number((value as Record<string, unknown>)[k], k.endsWith("Change"))]));
}
export function blank(provider: Provider, period: Period, now: Date, timezone: string, configured: boolean): ProviderReport {
  const r = ranges(period, now, timezone);
  return { provider, state: configured ? "temporarily_unavailable" : "not_configured", reason: configured ? "not_synced" : "not_configured", source: provider === "website" ? "Vercel Web Analytics · Preview projekta" : provider === "youtube" ? "YouTube Data / Analytics API" : "Meta Graph API v26.0", timezone, range: r.current, previousRange: r.previous, todayDate: r.today, totals: {}, previousTotals: {}, current: {}, daily: [], today: null, yesterday: null, breakdowns: { pages: [], referrers: [], devices: [], countries: [] }, topContent: [], warnings: [], requiredPermissions: [], fetchedAt: null, lastSuccessAt: null, lastAttemptAt: null, trackingStart: null, historicalBaseline: null, cumulative: {} };
}
const credentialNames = ["INSTAGRAM_ACCESS_TOKEN", "FACEBOOK_PAGE_ACCESS_TOKEN", "VERCEL_ANALYTICS_TOKEN", "YOUTUBE_OAUTH_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "SUPABASE_SERVICE_ROLE_KEY", "MEDRESA_ADMIN_SESSION_SECRET", "MEDRESA_ADMIN_PASSWORD_HASH", "OPENAI_API_KEY"];
export function safeText(value: unknown, extraSecrets: string[] = []): string {
  if (typeof value !== "string") return "";
  let text = value.replace(/[\u0000-\u001f\u007f]/g, " ");
  for (const secret of [...credentialNames.map(k => process.env[k]), ...extraSecrets]) {
    if (secret) for (const s of [secret, encodeURIComponent(secret)]) text = text.split(s).join("[skriveno]");
  }
  return text.slice(0, 180);
}
export function safeUrl(value: unknown, provider: Provider): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    const allowed = provider === "instagram" ? ["instagram.com", "www.instagram.com"] : provider === "facebook" ? ["facebook.com", "www.facebook.com", "m.facebook.com"] : provider === "youtube" ? ["www.youtube.com", "youtube.com"] : [];
    if (u.protocol !== "https:" || u.username || u.password || !allowed.includes(u.hostname)) return null;
    u.hash = ""; const video = provider === "youtube" ? u.searchParams.get("v") : null; u.search = "";
    if (video && /^[\w-]{11}$/.test(video)) u.searchParams.set("v", video);
    return safeText(u.href) === u.href ? u.href : null;
  } catch { return null; }
}
export function success(report: ProviderReport, now: Date) {
  report.state = "connected"; report.reason = null; report.fetchedAt = now.toISOString(); report.lastSuccessAt = report.fetchedAt; report.lastAttemptAt = report.fetchedAt;
  return report;
}
/** Fixed hosts only; no redirects, bounded reads/retry, no bodies or URLs in errors. */
export async function providerJson(url: URL | string, init: RequestInit = {}, signal?: AbortSignal, onStatus?: (status: number) => void): Promise<Record<string, unknown>> {
  const u = new URL(url);
  if (u.protocol !== "https:" || !["api.vercel.com", "graph.instagram.com", "graph.facebook.com", "oauth2.googleapis.com", "youtubeanalytics.googleapis.com", "www.googleapis.com"].includes(u.hostname)) throw new ProviderFailure("error", "invalid_response");
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(u.href, { ...init, redirect: "error", cache: "no-store", signal: AbortSignal.any([AbortSignal.timeout(10000), ...(signal ? [signal] : [])]) });
      onStatus?.(res.status);
      const text = await res.text();
      if (text.length > 1500000) throw new ProviderFailure("error", "invalid_response");
      let body: Record<string, unknown>;
      try { body = JSON.parse(text); } catch { throw new ProviderFailure("temporarily_unavailable", "invalid_response"); }
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new ProviderFailure("error", "invalid_response");
      const e = body.error as { code?: number } | undefined;
      if (res.ok && !e) return body;
      if ((res.status === 429 || res.status >= 500 || [4, 17, 32, 613].includes(e?.code ?? -1)) && attempt === 0) { await new Promise(r => setTimeout(r, 200)); continue; }
      if (res.status === 401 || e?.code === 190) throw new ProviderFailure("permission_required", "expired_credential");
      if (u.hostname === "oauth2.googleapis.com" && res.status === 400) throw new ProviderFailure("permission_required", "expired_credential");
      if (res.status === 403 || [10, 200].includes(e?.code ?? -1)) throw new ProviderFailure("permission_required", "permission_required");
      if (e?.code === 100 || res.status === 400) throw new ProviderFailure("error", "unsupported_metric");
      if (res.status === 429 || res.status >= 500) throw new ProviderFailure("temporarily_unavailable", "provider_unavailable");
      throw new ProviderFailure("error", "provider_unavailable");
    } catch (error) {
      if (error instanceof ProviderFailure) throw error;
      if (signal?.aborted) throw new ProviderFailure("temporarily_unavailable", "provider_timeout");
      if (attempt === 0) continue;
      throw new ProviderFailure("temporarily_unavailable", "provider_timeout");
    }
  }
  throw new ProviderFailure("temporarily_unavailable", "provider_unavailable");
}
export function cleanDay(value: unknown): string | null { return validDay(value) ? value : null; }
