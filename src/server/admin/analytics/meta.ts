import { dayAt, days, shiftDay, startInstant } from "@/admin/analytics/period";
import type { Daily, Metric, Metrics, Period, ProviderReport, Range } from "@/admin/analytics/model";
import { blank, number, providerJson, ProviderFailure, safeText, safeUrl, success } from "./common";
import { discoverInstagramFacebook, instagramGraph } from "./instagramDiagnostic";
import type { InstagramDiagnostic } from "@/admin/analytics/instagramTest";
// Existing feed credentials and official account: no second login or token store.
const FACEBOOK_PAGE_ID = "578640758657974";
export const instagramConfigured = () => !!process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
export const facebookConfigured = () => !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
function graph(host: "instagram" | "facebook", token: string, path: string, params: Record<string, string>, signal: AbortSignal) {
  const url = new URL(`https://graph.${host}.com/v26.0/${path}`);
  url.search = new URLSearchParams(params).toString();
  return providerJson(url, { headers: { Authorization: `Bearer ${token}` } }, signal);
}
type Insight = { name?: string; values?: { value?: unknown; end_time?: string }[]; total_value?: { value?: unknown; breakdowns?: { results?: { dimension_values?: string[]; value?: unknown }[] }[] } };
function insight(body: Record<string, unknown>): Insight | null { return Array.isArray(body.data) && body.data[0] && typeof body.data[0] === "object" ? body.data[0] : null; }
async function optional(report: ProviderReport, fn: () => Promise<Record<string, unknown>>): Promise<Insight | null> {
  try { const row = insight(await fn()); if (!row) report.warnings.push("no_data"); return row; }
  catch (e) {
    const failure = e instanceof ProviderFailure ? e : new ProviderFailure("error", "invalid_response");
    report.warnings.push(failure.reason);
    if (failure.state === "permission_required") { report.state = failure.state; report.reason = failure.reason; }
    return null;
  }
}
function rangeParams(range: Range, timezone: string) { return { since: String(Date.parse(startInstant(range.start, timezone)) / 1000), until: String(Date.parse(startInstant(shiftDay(range.end, 1), timezone)) / 1000) }; }
function chunks(range: Range) {
  const all = days(range); return Array.from({ length: Math.ceil(all.length / 30) }, (_, i) => ({ start: all[i * 30], end: all[Math.min(all.length - 1, i * 30 + 29)] }));
}
function finish(report: ProviderReport, now: Date) {
  const permission = report.state === "permission_required", reason = report.reason;
  const result = success(report, now);
  result.warnings = [...new Set(result.warnings)];
  if (permission) { result.state = "permission_required"; result.reason = reason; }
  const measured = [result.totals, result.current, result.today?.metrics ?? {}, ...result.daily.map(d => d.metrics)].some(m => Object.values(m).some(v => typeof v === "number"));
  if (!measured) {
    if (!permission) { result.state = "temporarily_unavailable"; result.reason = result.warnings[0] ?? "no_data"; }
    result.lastSuccessAt = null; result.fetchedAt = null;
  }
  return result;
}
export async function instagram(period: Period, now: Date, signal: AbortSignal, diagnostic?: InstagramDiagnostic) {
  const report = blank("instagram", period, now, "UTC", instagramConfigured());
  if (diagnostic) diagnostic.tokenPresent = instagramConfigured();
  if (!instagramConfigured()) return report;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
  const query = (path: string, params: Record<string, string>) => instagramGraph(token, path, params, signal, diagnostic);
  const id = await discoverInstagramFacebook(token, FACEBOOK_PAGE_ID, signal, diagnostic);
  const failedOptional = (error: unknown) => { report.warnings.push(error instanceof ProviderFailure ? error.reason : "invalid_response"); };
  try { const counts = await query(id, { fields: "followers_count" }); report.current.followers = number(counts.followers_count); } catch (error) { failedOptional(error); }
  async function metricTotal(range: Range, metric: string, additive: boolean) {
    const slices = chunks(range);
    if (!additive && slices.length > 1) { report.warnings.push("unsupported_metric"); return null; }
    const values: (number | null)[] = [];
    for (const slice of slices) {
      const row = await optional(report, () => query(`${id}/insights`, { metric, period: "day", metric_type: "total_value", ...rangeParams(slice, "UTC") }));
      values.push(number(row?.total_value?.value));
    }
    return values.every(v => v !== null) ? values.reduce<number>((s, v) => s + v!, 0) : null;
  }
  for (const [key, name, additive] of [["views", "views", true], ["interactions", "total_interactions", true], ["reach", "reach", false], ["profileActivity", "profile_links_taps", true]] as const) {
    const [a, b] = await Promise.all([metricTotal(report.range, name, additive), metricTotal(report.previousRange, name, additive)]);
    report.totals[key] = a; report.previousTotals[key] = b;
  }
  async function growth(range: Range) {
    let total = 0;
    for (const slice of chunks(range)) {
      const row = await optional(report, () => query(`${id}/insights`, { metric: "follows_and_unfollows", period: "day", metric_type: "total_value", breakdown: "follow_type", ...rangeParams(slice, "UTC") }));
      const entries = row?.total_value?.breakdowns?.flatMap(b => b.results ?? []) ?? [];
      const follows = number(entries.find(e => e.dimension_values?.length === 1 && e.dimension_values[0] === "FOLLOW")?.value);
      const unfollows = number(entries.find(e => e.dimension_values?.length === 1 && e.dimension_values[0] === "UNFOLLOW")?.value);
      if (follows === null || unfollows === null) return null;
      total += follows - unfollows;
    }
    return total;
  }
  [report.totals.followerChange, report.previousTotals.followerChange] = await Promise.all([growth(report.range), growth(report.previousRange)]);
  const y = shiftDay(report.todayDate, -1);
  const dayReport = async (date: string): Promise<Daily> => {
    const m: Metrics = {};
    for (const [key, name] of [["views", "views"], ["reach", "reach"], ["interactions", "total_interactions"]] as const) m[key] = await metricTotal({ start: date, end: date }, name, true);
    m.followerChange = await growth({ start: date, end: date });
    return { date, metrics: m, complete: date < report.todayDate };
  };
  [report.today, report.yesterday] = await Promise.all([dayReport(report.todayDate), dayReport(y)]);
  // Reach daily is supported as time_series; daily reach is never summed as unique period reach.
  const daily = new Map<string, Daily>();
  for (const slice of chunks(report.range)) {
    const row = await optional(report, () => query(`${id}/insights`, { metric: "reach", period: "day", metric_type: "time_series", ...rangeParams(slice, "UTC") }));
    for (const v of row?.values ?? []) if (v.end_time && Number.isFinite(Date.parse(v.end_time))) {
      const date = dayAt(new Date(Date.parse(v.end_time) - 1), "UTC"), value = number(v.value);
      if (date >= slice.start && date <= slice.end && value !== null) daily.set(date, { date, metrics: { reach: value }, complete: date < report.todayDate });
    }
  }
  report.daily = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  try {
    const media = await query(`${id}/media`, { fields: "id,caption,permalink,timestamp,media_type", limit: "20" });
    const rows = Array.isArray(media.data) ? media.data as Record<string, unknown>[] : [];
    for (const item of rows.filter(x => typeof x.timestamp === "string" && x.timestamp.slice(0, 10) >= report.range.start && x.timestamp.slice(0, 10) <= report.range.end).slice(0, 5)) {
      if (typeof item.id !== "string" || !/^\d+$/.test(item.id)) continue;
      const row = await optional(report, () => query(`${item.id}/insights`, { metric: "views" }));
      const value = number(row?.values?.[0]?.value) ?? number(row?.total_value?.value);
      if (value !== null) report.topContent.push({ label: safeText(item.caption, [token]) || "Instagram objava", url: safeUrl(item.permalink, "instagram"), value, basis: "lifetime" });
    }
  } catch (error) { failedOptional(error); }
  report.topContent.sort((a, b) => b.value - a.value);
  if (report.state === "permission_required") report.requiredPermissions = ["instagram_manage_insights"];
  return finish(report, now);
}
export async function facebook(period: Period, now: Date, signal: AbortSignal) {
  const report = blank("facebook", period, now, "America/Los_Angeles", facebookConfigured());
  if (!facebookConfigured()) return report;
  const original = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;
  const page = await graph("facebook", original, FACEBOOK_PAGE_ID, { fields: "id,access_token" }, signal);
  if (page.id !== FACEBOOK_PAGE_ID) throw new ProviderFailure("error", "project_mismatch");
  const token = typeof page.access_token === "string" ? page.access_token : original;
  try { const count = await graph("facebook", token, FACEBOOK_PAGE_ID, { fields: "followers_count" }, signal); report.current.followers = number(count.followers_count); } catch { report.warnings.push("unsupported_metric"); }
  const daily = new Map<string, Daily>(); const gains = new Map<string, number>(); const losses = new Map<string, number>();
  const window = { start: report.previousRange.start, end: report.todayDate };
  const candidates: [Metric | "gains" | "losses", string][] = [["views", "page_media_view"], ["interactions", "page_post_engagements"], ["reach", "page_total_media_view_unique"], ["gains", "page_daily_follows"], ["losses", "page_daily_unfollows"]];
  for (const [key, name] of candidates) {
    for (const slice of chunks(window)) {
      const row = await optional(report, () => graph("facebook", token, `${FACEBOOK_PAGE_ID}/insights`, { metric: name, period: "day", ...rangeParams(slice, report.timezone) }, signal));
      if (!row) break; // Deprecated/unauthorized metrics do not poison other metrics.
      for (const v of row.values ?? []) if (v.end_time && Number.isFinite(Date.parse(v.end_time))) {
        const date = dayAt(new Date(Date.parse(v.end_time) - 1), report.timezone), value = number(v.value);
        if (date < window.start || date > window.end || value === null) continue;
        if (key === "gains") gains.set(date, value); else if (key === "losses") losses.set(date, value); else {
          const d = daily.get(date) ?? { date, metrics: {}, complete: date < report.todayDate }; d.metrics[key] = value; daily.set(date, d);
        }
      }
    }
  }
  for (const [date, gain] of gains) if (losses.has(date)) {
    const d = daily.get(date) ?? { date, metrics: {}, complete: date < report.todayDate }; d.metrics.followerChange = gain - losses.get(date)!; daily.set(date, d);
  }
  report.daily = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const sum = (range: Range, key: Metric) => { const values = days(range).map(d => daily.get(d)?.metrics[key]); return values.every(v => typeof v === "number") ? values.reduce<number>((s, v) => s + v!, 0) : null; };
  for (const key of ["views", "interactions", "followerChange"] as const) { report.totals[key] = sum(report.range, key); report.previousTotals[key] = sum(report.previousRange, key); }
  report.today = daily.get(report.todayDate) ?? null; report.yesterday = daily.get(shiftDay(report.todayDate, -1)) ?? null;
  try {
    const posts = await graph("facebook", token, `${FACEBOOK_PAGE_ID}/published_posts`, { fields: "id,message,created_time,permalink_url", limit: "20" }, signal);
    const list = Array.isArray(posts.data) ? posts.data as Record<string, unknown>[] : [];
    for (const p of list.filter(x => typeof x.created_time === "string" && dayAt(new Date(x.created_time), report.timezone) >= report.range.start && dayAt(new Date(x.created_time), report.timezone) <= report.range.end).slice(0, 5)) {
      if (typeof p.id !== "string" || !/^\d+_\d+$/.test(p.id)) continue;
      const row = await optional(report, () => graph("facebook", token, `${p.id}/insights`, { metric: "post_media_view" }, signal));
      const value = number(row?.values?.[0]?.value);
      if (value !== null) report.topContent.push({ label: safeText(p.message, [original, token]) || "Facebook objava", value, url: safeUrl(p.permalink_url, "facebook"), basis: "lifetime" });
    }
  } catch { report.warnings.push("unsupported_metric"); }
  report.topContent.sort((a, b) => b.value - a.value);
  if (report.state === "permission_required") report.requiredPermissions = ["read_insights", "pages_read_engagement"];
  return finish(report, now);
}
