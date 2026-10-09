import { providers, reasonNames, metricNames, type AnalyticsDashboard, type Period, type Provider, type ProviderReport, type Metrics } from "@/admin/analytics/model";
import { days, shiftDay, validDay } from "@/admin/analytics/period";
import { AdminError } from "@/admin/contracts";
import { supabaseRequest } from "../supabase";
import { blank, metrics, previewConfiguration, safeText, safeUrl } from "./common";
import { collectProvider, configurations, timezones } from "./providers";
import type { WebsiteRequestResult } from "@/admin/analytics/websiteRequests";
import { newInstagramDiagnostic } from "./instagramDiagnostic";
const validStates = ["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"];
/** Explicit schema projection, never passthrough of raw provider or stored JSON. */
export function sanitizedReport(raw: ProviderReport, base: ProviderReport): ProviderReport {
  const r: ProviderReport = { ...base };
  const present = raw.provider === base.provider && raw.timezone === base.timezone && raw.range?.start === base.range.start && raw.range?.end === base.range.end && raw.previousRange?.start === base.previousRange.start && raw.previousRange?.end === base.previousRange.end;
  if (!present) return r;
  if (validStates.includes(raw.state)) r.state = raw.state;
  r.reason = raw.reason && reasonNames.includes(raw.reason) ? raw.reason : null;
  for (const field of ["totals", "previousTotals", "current", "cumulative"] as const) r[field] = metrics(raw[field]);
  r.warnings = Array.isArray(raw.warnings) ? [...new Set(raw.warnings.filter(x => reasonNames.includes(x)))].slice(0, 13) : [];
  const permissions = ["instagram_business_manage_insights", "read_insights", "pages_read_engagement", "youtube.readonly", "yt-analytics.readonly"];
  r.requiredPermissions = Array.isArray(raw.requiredPermissions) ? raw.requiredPermissions.filter(p => permissions.includes(p)) : [];
  for (const field of ["fetchedAt", "lastSuccessAt", "lastAttemptAt"] as const) r[field] = typeof raw[field] === "string" && Number.isFinite(Date.parse(raw[field]!)) ? new Date(raw[field]!).toISOString() : null;
  r.trackingStart = validDay(raw.trackingStart) ? raw.trackingStart : null;
  r.daily = Array.isArray(raw.daily) ? raw.daily.filter(d => validDay(d.date) && d.date >= base.previousRange.start && d.date <= base.todayDate).slice(0, 200).map(d => ({ date: d.date, metrics: metrics(d.metrics), complete: d.complete === true && d.date < base.todayDate })) : [];
  for (const field of ["today", "yesterday"] as const) {
    const item = raw[field]; r[field] = item && item.date === (field === "today" ? base.todayDate : shiftDay(base.todayDate, -1)) ? { date: item.date, metrics: metrics(item.metrics), complete: field !== "today" && item.complete === true } : null;
  }
  const ranked = (items: ProviderReport["topContent"]) => Array.isArray(items) ? items.slice(0, 20).flatMap(item => {
    const n = typeof item.value === "number" && Number.isFinite(item.value) && item.value >= 0 ? item.value : null;
    const label = safeText(item.label);
    return n === null || !label ? [] : [{ label, value: n, url: safeUrl(item.url, base.provider), basis: item.basis === "lifetime" ? "lifetime" as const : "period" as const }];
  }) : [];
  r.topContent = ranked(raw.topContent);
  r.breakdowns = Object.fromEntries((["pages", "referrers", "devices", "countries"] as const).map(k => [k, ranked(raw.breakdowns?.[k])])) as ProviderReport["breakdowns"];
  return r;
}
async function database(path: string, init: RequestInit = {}, write = false) {
  previewConfiguration(write);
  return supabaseRequest(path, init, write);
}
async function call<T>(name: "medresa_analytics_begin_sync" | "medresa_analytics_complete_sync", args: Record<string, unknown>): Promise<T> {
  const response = await database(`/rest/v1/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) }, true);
  // PostgREST returns 204 for the void completion RPC after committing successfully.
  if (name === "medresa_analytics_complete_sync" && response.status === 204) return undefined as T;
  return response.json();
}
export async function dashboard(period: Period, now = new Date()): Promise<AnalyticsDashboard> {
  const result: AnalyticsDashboard = { period, generatedAt: now.toISOString(), reports: providers.map(p => blank(p, period, now, timezones[p], configurations[p]())), storage: "unavailable", writable: false, sync: { running: false, runId: null, startedAt: null }, history: [] };
  try { result.writable = previewConfiguration().writable; } catch { result.storage = "preview_required"; return result; }
  const config = previewConfiguration();
  // A read-only schema probe distinguishes missing tables from an outage without exposing DB errors.
  try {
    const response = await fetch(`${config.url}/rest/v1/medresa_analytics_sync_lock?select=run_id,lease_until,last_started_at`, { headers: { apikey: config.key, ...(config.key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${config.key}` }) }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      let code = ""; try { code = (await response.json()).code ?? ""; } catch { /* no raw error */ }
      result.storage = ["42P01", "PGRST205"].includes(code) ? "migration_required" : "unavailable"; return result;
    }
    const locks = await response.json();
    if (!Array.isArray(locks) || locks.length !== 1) return result;
    const lock = locks[0]; result.sync = { running: typeof lock.lease_until === "string" && Date.parse(lock.lease_until) > now.getTime(), runId: typeof lock.run_id === "string" && /^[a-f0-9-]{36}$/.test(lock.run_id) ? lock.run_id : null, startedAt: typeof lock.last_started_at === "string" ? lock.last_started_at : null };
    const [states, history] = await Promise.all([
      database("/rest/v1/medresa_analytics_provider_state?select=provider,state,reason,last_attempt_at,last_success_at").then(r => r.json()),
      database("/rest/v1/medresa_analytics_sync_runs?select=id,started_at,completed_at,outcome&order=started_at.desc&limit=8").then(r => r.json()),
    ]);
    if (!Array.isArray(states) || !Array.isArray(history)) return result;
    result.history = history.map(r => ({ id: r.id, started_at: r.started_at, completed_at: r.completed_at, outcome: ["running", "success", "partial", "failed", "abandoned"].includes(r.outcome) ? r.outcome : "failed" }));
    result.storage = "ready";
    result.reports = await Promise.all(result.reports.map(async base => {
      const query = new URLSearchParams({ provider: `eq.${base.provider}`, start_date: `eq.${base.range.start}`, end_date: `eq.${base.range.end}`, timezone: `eq.${base.timezone}`, select: "report", limit: "1" });
      const snapshots = new URLSearchParams({ provider: `eq.${base.provider}`, timezone: `eq.${base.timezone}`, day: `gte.${base.previousRange.start}`, and: `(day.lte.${base.todayDate})`, select: "day,metrics,complete", order: "day.asc", limit: "200" });
      try {
        const [rows, savedDays] = await Promise.all([database(`/rest/v1/medresa_analytics_reports?${query}`).then(r => r.json()), database(`/rest/v1/medresa_analytics_daily?${snapshots}`).then(r => r.json())]);
        let r = Array.isArray(rows) && rows[0]?.report ? sanitizedReport(rows[0].report, base) : base;
        if (Array.isArray(savedDays)) {
          r = { ...r, daily: savedDays.filter(d => validDay(d.day)).map(d => ({ date: d.day, metrics: metrics(d.metrics), complete: d.complete === true && d.day < base.todayDate })) };
          r.today = r.today ?? r.daily.find(d => d.date === base.todayDate) ?? null;
          r.yesterday = r.yesterday ?? r.daily.find(d => d.date === new Date(Date.parse(base.todayDate) - 86400000).toISOString().slice(0, 10)) ?? null;
          // Only additive complete daily metrics may be reconstructed. Never sum unique visitors/reach.
          const additive: Partial<Record<Provider, (typeof metricNames[number])[]>> = { website: ["pageviews"], instagram: ["views", "interactions", "followerChange"], facebook: ["views", "interactions", "followerChange"], youtube: ["views", "watchMinutes", "subscriberChange"] };
          for (const [range, field] of [[base.range, "totals"], [base.previousRange, "previousTotals"]] as const) for (const key of additive[base.provider] ?? []) {
            if (r[field][key] != null) continue;
            const values = days(range).map(date => r.daily.find(d => d.date === date && d.complete)?.metrics[key]);
            if (values.every(v => typeof v === "number")) r[field] = { ...r[field], [key]: values.reduce<number>((s, v) => s + v!, 0) } as Metrics;
          }
        }
        const state = states.find(s => s.provider === base.provider);
        if (state) { r.state = validStates.includes(state.state) ? state.state : "error"; r.reason = reasonNames.includes(state.reason) ? state.reason : null; r.lastSuccessAt = state.last_success_at; r.lastAttemptAt = state.last_attempt_at; }
        if (!configurations[base.provider]()) { r.state = "not_configured"; r.reason = "not_configured"; }
        return r;
      } catch { return { ...base, state: "temporarily_unavailable", reason: "provider_unavailable" }; }
    }));
  } catch { result.storage = "unavailable"; }
  return result;
}
export async function synchronize(period: Period, id: string, provider?: Provider) {
  previewConfiguration(true);
  if (provider !== undefined && !providers.includes(provider)) throw new AdminError(422, "Izvor analitike nije ispravan.");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) throw new AdminError(422, "Zahtjev za osvježavanje nije ispravan.");
  let claim: { acquired: boolean; runId: string; outcome: string };
  try { claim = await call("medresa_analytics_begin_sync", { p_id: id, p_period: period, ...(provider ? { p_provider: provider } : {}) }); }
  catch { throw new AdminError(503, provider ? "Osvježavanje pojedinačnog izvora nije spremno. Provjerite Preview migraciju analitike za pojedinačne izvore." : "Historija analitike nije spremna. Provjerite Preview analitičku migraciju."); }
  if (!claim.acquired) return { ...claim, dashboard: await dashboard(period) };
  const now = new Date(), signal = AbortSignal.timeout(75000);
  const websiteRequests: WebsiteRequestResult[] = [];
  const instagramDiagnostic = provider === "instagram" ? newInstagramDiagnostic() : undefined;
  const reports = await Promise.all((provider ? [provider] : providers).map(async p => {
    const r = await collectProvider(p, period, now, signal, provider === "website" ? result => { websiteRequests.push(result); } : undefined, instagramDiagnostic);
    // Include daily overview in history; duplicate dates are merged deterministically.
    const daily = new Map(r.daily.map(d => [d.date, d]));
    for (const d of [r.today, r.yesterday]) if (d && Object.values(d.metrics).some(v => typeof v === "number")) daily.set(d.date, { ...d, metrics: { ...daily.get(d.date)?.metrics, ...d.metrics } });
    r.daily = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
    return sanitizedReport(r, blank(p, period, now, timezones[p], configurations[p]()));
  }));
  try { await call("medresa_analytics_complete_sync", { p_id: id, p_reports: reports }); }
  catch { throw new AdminError(503, "Osvježavanje nije sačuvano. Prethodni podaci ostaju dostupni; pokušajte ponovo nakon isteka aktivnog osvježavanja."); }
  // Provider diagnostics are ephemeral, scoped-test-only; never stored in reports.
  return { ...claim, outcome: "completed", dashboard: await dashboard(period), ...(provider === "website" ? { websiteRequests } : {}), ...(instagramDiagnostic ? { instagramDiagnostic } : {}) };
}
