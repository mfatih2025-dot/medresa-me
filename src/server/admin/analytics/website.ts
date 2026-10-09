import { dayAt, shiftDay, validDay } from "@/admin/analytics/period";
import type { Metrics, Period, Range } from "@/admin/analytics/model";
import { websiteRequestDimensions, vercelQueryParameters, vercelRejectionCodes, type VercelRejection, type WebsiteRequest, type WebsiteRequestResult } from "@/admin/analytics/websiteRequests";
import { blank, number, providerJson, safeText, success, ProviderFailure } from "./common";
export function websiteConfigured() { return !!process.env.VERCEL_ANALYTICS_TOKEN?.trim(); }
/** Project validation evidence to fixed enums/booleans. Never return raw messages or values. */
export function vercelRejection(body: Record<string, unknown>): VercelRejection {
  const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const error = record(body.error);
  const details = [error, ...[error.errors, error.issues, body.errors].flatMap(value => Array.isArray(value) ? value.slice(0, 16).map(record) : [])];
  const message = details.flatMap(row => typeof row.message === "string" ? [row.message.slice(0, 1000)] : []).join(" ").slice(0, 4000);
  return {
    code: vercelRejectionCodes.find(code => code === error.code) ?? null,
    parameters: vercelQueryParameters.filter(parameter => details.some(row => row.parameter === parameter || row.param === parameter || row.field === parameter || (Array.isArray(row.path) && row.path.includes(parameter)))
      || error.code === `invalid_${parameter.toLowerCase()}` || new RegExp("['\"`]" + parameter + "['\"`]|\\b(?:parameter|property|field)\\s+" + parameter + "\\b", "i").test(message)),
    reportingWindowMentioned: /\bretention\b|\breporting window\b|\b(?:date range|since|timestamp)\b.{0,80}\b(?:too old|outside|earlier than|before the|last \d+ days)\b/i.test(message),
    detailsPresent: Object.keys(error).length > 0 || details.length > 1,
  };
}
export async function website(period: Period, now: Date, signal: AbortSignal, observe?: (result: WebsiteRequestResult) => void) {
  const report = blank("website", period, now, "UTC", websiteConfigured());
  if (!websiteConfigured()) return report;
  const token = process.env.VERCEL_ANALYTICS_TOKEN!;
  async function request(request: WebsiteRequest, url: URL | string, range: Range | null = null) {
    let httpStatus: number | null = null, reason: WebsiteRequestResult["reason"] = null;
    let rejection: VercelRejection | undefined;
    try { return await providerJson(url, { headers: { Authorization: `Bearer ${token}` } }, signal, (status, body) => { httpStatus = status; if (status === 400 && body) rejection = vercelRejection(body); }); }
    catch (error) {
      // Vercel documents HTTP 400 as an invalid query value, not an unsupported
      // metric. The shared Meta-style mapping must not make that claim here.
      if (httpStatus === 400 && error instanceof ProviderFailure && error.reason === "unsupported_metric") {
        reason = "invalid_response"; throw new ProviderFailure("error", reason);
      }
      reason = error instanceof ProviderFailure ? error.reason : "invalid_response"; throw error;
    }
    finally { observe?.({ request, range, httpStatus, reason, ...(rejection ? { rejection } : {}) }); }
  }
  // Name and team are the existing verified Vercel project, never supplied by a browser.
  const project = await request("project", "https://api.vercel.com/v9/projects/medresa-me?slug=mmf16");
  if (project.name !== "medresa-me" || typeof project.id !== "string") throw new ProviderFailure("error", "project_mismatch");
  // Use Vercel's documented default (10); the former 200 was rejected by the live API.
  async function aggregate(name: Exclude<WebsiteRequest, "project">, range: Range, limit = 10) {
    const by = websiteRequestDimensions[name];
    const u = new URL("https://api.vercel.com/v1/query/web-analytics/visits/aggregate");
    u.search = new URLSearchParams({ projectId: project.id as string, slug: "mmf16", since: range.start + "T00:00:00Z", until: range.end + "T23:59:59.999Z", by, limit: String(limit), filter: "environment eq 'preview' and not startswith(requestPath, '/admin')" }).toString();
    const body = await request(name, u, range);
    if (!Array.isArray(body.data) || body.data.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new ProviderFailure("error", "invalid_response");
    return body.data as Record<string, unknown>[];
  }
  function total(rows: Record<string, unknown>[]): Metrics {
    if (rows.length !== 1) return {};
    return { pageviews: number(rows[0].pageviews), visitors: number(rows[0].visitors) };
  }
  const yesterdayDate = shiftDay(report.todayDate, -1);
  // Current-period totals are required. Comparisons/trends are optional: a rejected
  // query (including a plan's reporting-window restriction) cannot discard totals.
  const current = await aggregate("current", report.range);
  async function optional(name: Exclude<WebsiteRequest, "project" | "current">, range: Range, limit = 10) {
    try { return await aggregate(name, range, limit); }
    catch (error) {
      report.warnings.push(error instanceof ProviderFailure ? error.reason : "invalid_response");
      return [];
    }
  }
  const [previous, daily, today, yesterday] = await Promise.all([
    optional("previous", report.previousRange),
    optional("daily", { start: report.previousRange.start, end: report.todayDate }),
    optional("today", { start: report.todayDate, end: report.todayDate }), optional("yesterday", { start: yesterdayDate, end: yesterdayDate }),
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
    const rows = await optional(key as keyof typeof dimensions, report.range, 10);
    report.breakdowns[key as keyof typeof dimensions] = rows.flatMap(row => {
      const value = number(row.pageviews); const label = safeText(row[dimension]);
      if (value === null || !label || /@|\b\d{7,}\b/.test(label)) return [];
      return [{ label: label.split(/[?#]/)[0], value, url: null, basis: "period" as const }];
    }).sort((a, b) => b.value - a.value);
  }));
  report.topContent = report.breakdowns.pages;
  // Never use visits/count: that endpoint reads Production only. No inferred baseline.
  const start = process.env.MEDRESA_ANALYTICS_WEB_TRACKING_START;
  if (validDay(start) && start <= report.todayDate) {
    report.trackingStart = start;
    try { report.cumulative = total(await aggregate("cumulative", { start, end: report.todayDate })); }
    catch { report.warnings.push("retention_limit"); }
  }
  if (!Object.values(report.totals).some(v => v !== null)) report.warnings.push("no_data");
  return success(report, now);
}
