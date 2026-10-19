import { validDay } from "./period";

const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const instant = (v: unknown) => typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;

/** Client-side allowlist, never render/stringify the unfiltered API response. */
export function instagramAuditView(value: unknown) {
  const body = object(value), report = object(body.report), fresh = object(body.freshMeta), coverage = object(report.coverage);
  if (body.diagnostic !== "instagram_90_day_views" || report.provider !== "instagram" || report.metric !== "views" || fresh.metric !== "views" || fresh.metricType !== "total_value" || fresh.period !== "day" || body.persisted !== false || body.freshMetaUsedForDisplayedValue !== false || !validDay(report.startDate) || !validDay(report.endDate) || report.timezone !== "UTC") throw new Error("Invalid diagnostic response");
  const provenance = (["saved_period_total", "daily_snapshots", "unavailable", "unknown"] as const).find(v => v === report.displayedValueSource) ?? "unknown";
  const raw = Array.isArray(fresh.rawValues) && fresh.rawValues.length <= 3 ? fresh.rawValues.flatMap(v => {
    const row = object(v);
    return validDay(row.startDate) && validDay(row.endDate) ? [{ startDate: row.startDate, endDate: row.endDate, value: count(row.value) }] : [];
  }) : [];
  const success = fresh.status === "success" && count(fresh.aggregatedValue) !== null && raw.length === 3 && raw.every(r => r.value !== null) && instant(fresh.respondedAt) !== null;
  return {
    metric: "views",
    "FRESH META VALUE": { value: success ? count(fresh.aggregatedValue) : null, rawMetaValues: raw, responseTimestamp: instant(fresh.respondedAt) },
    "SAVED ADMIN VALUE": {
      value: count(report.savedAggregatedValue), provenance,
      coverage: count(coverage.days) !== null && count(coverage.expectedDays) !== null ? { days: count(coverage.days), expectedDays: count(coverage.expectedDays), basis: coverage.basis === "period" ? "period" : coverage.basis === "daily" ? "daily" : "unknown", partial: coverage.partial === true } : null,
      lastSuccessfulInstagramRefresh: instant(report.lastSuccessfulInstagramRefreshAt),
    },
    startDate: report.startDate, endDate: report.endDate, timezone: "UTC",
  };
}
