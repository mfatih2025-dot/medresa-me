import { dayAt, shiftDay, validDay } from "@/admin/analytics/period";
import type { Metrics, Period, Range } from "@/admin/analytics/model";
import { blank, number, providerJson, safeText, success, ProviderFailure } from "./common";
export function websiteConfigured() { return !!process.env.VERCEL_ANALYTICS_TOKEN?.trim(); }
export async function website(period: Period, now: Date, signal: AbortSignal) {
  const report = blank("website", period, now, "UTC", websiteConfigured());
  if (!websiteConfigured()) return report;
  const token = process.env.VERCEL_ANALYTICS_TOKEN!;
  // Name and team are the existing verified Vercel project, never supplied by a browser.
  const project = await providerJson("https://api.vercel.com/v9/projects/medresa-me?slug=mmf16", { headers: { Authorization: `Bearer ${token}` } }, signal);
  if (project.name !== "medresa-me" || typeof project.id !== "string") throw new ProviderFailure("error", "project_mismatch");
  async function aggregate(range: Range, by: string, limit = 200) {
    const u = new URL("https://api.vercel.com/v1/query/web-analytics/visits/aggregate");
    u.search = new URLSearchParams({ projectId: project.id as string, slug: "mmf16", since: range.start + "T00:00:00Z", until: range.end + "T23:59:59.999Z", by, limit: String(limit), filter: "environment eq 'preview' and not startswith(requestPath, '/admin')" }).toString();
    const body = await providerJson(u, { headers: { Authorization: `Bearer ${token}` } }, signal);
    if (!Array.isArray(body.data)) throw new ProviderFailure("error", "invalid_response");
    return body.data as Record<string, unknown>[];
  }
  function total(rows: Record<string, unknown>[]): Metrics {
    if (rows.length !== 1) return {};
    return { pageviews: number(rows[0].pageviews), visitors: number(rows[0].visitors) };
  }
  const yesterdayDate = shiftDay(report.todayDate, -1);
  const [current, previous, daily, today, yesterday] = await Promise.all([
    aggregate(report.range, "environment"), aggregate(report.previousRange, "environment"),
    aggregate({ start: report.previousRange.start, end: report.todayDate }, "day"),
    aggregate({ start: report.todayDate, end: report.todayDate }, "environment"), aggregate({ start: yesterdayDate, end: yesterdayDate }, "environment"),
  ]);
  report.totals = total(current); report.previousTotals = total(previous);
  report.today = { date: report.todayDate, metrics: total(today), complete: false };
  report.yesterday = { date: yesterdayDate, metrics: total(yesterday), complete: true };
  report.daily = daily.flatMap(row => {
    const date = typeof row.timestamp === "string" && Number.isFinite(Date.parse(row.timestamp)) ? dayAt(new Date(row.timestamp), "UTC") : null;
    return date ? [{ date, metrics: { pageviews: number(row.pageviews), visitors: number(row.visitors) }, complete: date < report.todayDate }] : [];
  });
  const dimensions = { pages: "requestPath", referrers: "referrerHostname", devices: "deviceType", countries: "country" } as const;
  await Promise.all(Object.entries(dimensions).map(async ([key, dimension]) => {
    try {
      const rows = await aggregate(report.range, dimension, 10);
      report.breakdowns[key as keyof typeof dimensions] = rows.flatMap(row => {
        const value = number(row.pageviews); const label = safeText(row[dimension]);
        if (value === null || !label || /@|\b\d{7,}\b/.test(label)) return [];
        return [{ label: label.split(/[?#]/)[0], value, url: null, basis: "period" as const }];
      }).sort((a, b) => b.value - a.value);
    } catch { report.warnings.push("unsupported_metric"); }
  }));
  report.topContent = report.breakdowns.pages;
  // Never use visits/count: that endpoint reads Production only. No inferred baseline.
  const start = process.env.MEDRESA_ANALYTICS_WEB_TRACKING_START;
  if (validDay(start) && start <= report.todayDate) {
    report.trackingStart = start;
    try { report.cumulative = total(await aggregate({ start, end: report.todayDate }, "environment")); }
    catch { report.warnings.push("retention_limit"); }
  }
  if (!Object.values(report.totals).some(v => v !== null)) report.warnings.push("no_data");
  return success(report, now);
}
