import type { MetricCoverage } from "@/admin/analytics/storedTotals";
import { days, shiftDay, startInstant, validDay } from "@/admin/analytics/period";
import { number, ProviderFailure } from "./common";
import { reasonNames, type ProviderReport } from "@/admin/analytics/model";
import { dashboard } from "./service";
import { discoverInstagramFacebook, instagramGraph } from "./instagramDiagnostic";

const metric = "views";
const timestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const coverage = (value?: MetricCoverage) => value && Number.isSafeInteger(value.days) && Number.isSafeInteger(value.expectedDays) && ["period", "daily"].includes(value.basis)
  ? { days: value.days, expectedDays: value.expectedDays, partial: value.partial === true, basis: value.basis } : null;

/** Temporary read-only audit. Explicit projection: never serialize provider bodies,
 * captions, URLs, account metadata, errors, request headers or configuration. */
export function projectInstagramAudit(report: ProviderReport, generatedAt: string) {
  const history = coverage(report.totalCoverage?.views);
  const savedValue = number(report.totals.views);
  const basis = savedValue === null ? "unavailable" : history?.basis === "period" ? "saved_period_total" : history?.basis === "daily" ? "daily_snapshots" : "unknown";
  const measuredDays = new Map(report.daily.filter(d => validDay(d.date) && d.date >= report.range.start && d.date <= report.range.end && number(d.metrics.views) !== null).map(d => [d.date, number(d.metrics.views)!]));
  return {
    diagnostic: "instagram_90_day_views",
    generatedAt: timestamp(generatedAt),
    report: {
      provider: "instagram", metric, state: ["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"].includes(report.state) ? report.state : "error",
      reason: report.reason && reasonNames.includes(report.reason) ? report.reason : null,
      startDate: validDay(report.range.start) ? report.range.start : null,
      endDate: validDay(report.range.end) ? report.range.end : null,
      timezone: report.timezone === "UTC" ? "UTC" : null,
      savedAggregatedValue: savedValue,
      savedPeriodValue: basis === "saved_period_total" ? savedValue : null,
      displayedValueSource: basis,
      fetchedAt: timestamp(report.fetchedAt),
      lastSuccessfulInstagramRefreshAt: timestamp(report.lastSuccessAt),
      refreshTimestampScope: "provider_not_individual_metric",
      coverage: history,
      coverageEvidence: history?.basis === "period" ? "inferred_from_saved_period_total_not_daily_measurements" : history?.basis === "daily" ? "measured_daily_rows" : "unavailable",
      measuredDailyViews: { days: measuredDays.size, sum: measuredDays.size ? [...measuredDays.values()].reduce((a, b) => a + b, 0) : null },
    },
    rawMetaAtSavedRefresh: { available: false, value: null, reason: "raw_meta_responses_were_not_persisted" },
  };
}

export async function instagramAudit(fresh = false, now = new Date()) {
  // This is exactly the stored 90-day report consumed by the normal dashboard.
  // dashboard() performs database GETs only; it never invokes a provider/sync RPC.
  const saved = await dashboard("90", now);
  const report = saved.reports.find(r => r.provider === "instagram")!;
  const output = projectInstagramAudit(report, saved.generatedAt);
  const freshMeta: {
    requested: boolean; status: string; metric: string; metricType: string; period: string;
    checkedAt: string | null; rawValues: { startDate: string; endDate: string; value: number | null }[];
    aggregatedValue: number | null; differenceFromSaved: number | null; reason: string | null;
  } = { requested: fresh, status: "not_requested", metric, metricType: "total_value", period: "day", checkedAt: null, rawValues: [], aggregatedValue: null, differenceFromSaved: null, reason: null };
  if (fresh) {
    freshMeta.checkedAt = now.toISOString();
    freshMeta.status = "unavailable";
    try {
      if (saved.storage !== "ready") throw new ProviderFailure("temporarily_unavailable", "provider_unavailable");
      const original = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!original?.trim()) throw new ProviderFailure("not_configured", "not_configured");
      const signal = AbortSignal.timeout(45000);
      const { id, token, credential } = await discoverInstagramFacebook(original, "578640758657974", signal);
      const dates = days(report.range);
      // Same contiguous 30-day windows/UTC boundaries as the existing provider.
      // No other metric/provider is requested, and nothing is persisted.
      for (let offset = 0; offset < dates.length; offset += 30) {
        const startDate = dates[offset], endDate = dates[Math.min(dates.length - 1, offset + 29)];
        const body = await instagramGraph(token, `${id}/insights`, {
          metric, period: "day", metric_type: "total_value",
          since: String(Date.parse(startInstant(startDate, "UTC")) / 1000),
          until: String(Date.parse(startInstant(shiftDay(endDate, 1), "UTC")) / 1000),
        }, signal, undefined, credential);
        const data = Array.isArray(body.data) && body.data.length === 1 ? body.data[0] as Record<string, unknown> : null;
        if (!data || data.name !== metric || data.period !== "day") throw new ProviderFailure("error", "invalid_response");
        const raw = data.total_value as { value?: unknown } | undefined;
        freshMeta.rawValues.push({ startDate, endDate, value: number(raw?.value) });
      }
      if (freshMeta.rawValues.length !== 3 || freshMeta.rawValues.some(row => row.value === null)) throw new ProviderFailure("error", "no_data");
      const total = freshMeta.rawValues.reduce((sum, row) => sum + row.value!, 0);
      if (!Number.isSafeInteger(total)) throw new ProviderFailure("error", "invalid_response");
      freshMeta.aggregatedValue = total;
      freshMeta.differenceFromSaved = output.report.savedAggregatedValue === null ? null : total - output.report.savedAggregatedValue;
      freshMeta.status = "success";
    } catch (error) {
      freshMeta.reason = error instanceof ProviderFailure && reasonNames.includes(error.reason) ? error.reason : "invalid_response";
    }
  }
  return { ...output, freshMeta, freshMetaUsedForDisplayedValue: false, persisted: false };
}
