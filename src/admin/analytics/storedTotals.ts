import { days, validDay } from "./period";
import type { Daily, Metric, Metrics, Provider, Range } from "./model";

/** Only daily flow metrics are additive. Never add unique audience/current/lifetime
 * counts or overlapping reports. A saved aggregate is not evidence of daily rows. */
const additive: Record<Provider, Metric[]> = {
  website: ["pageviews"], instagram: ["views", "interactions", "followerChange"],
  facebook: ["views", "interactions", "followerChange"], youtube: ["views", "watchMinutes", "subscriberChange"],
};
// days counts observed daily rows, including when the displayed value comes from
// a period aggregate. An aggregate alone never proves per-day completeness.
export type MetricCoverage = { days: number; expectedDays: number; partial: boolean; basis: "period" | "daily" };
export function storedTotals(provider: Provider, range: Range, totals: Metrics, daily: readonly Daily[]) {
  const expectedDays = days(range).length;
  const result = { ...totals };
  const coverage: Partial<Record<Metric, MetricCoverage>> = {};
  for (const key of additive[provider]) {
    const measured = new Map<string, { value: number; complete: boolean }>();
    for (const day of daily) {
      const value = day.metrics[key];
      if (!validDay(day.date) || day.date < range.start || day.date > range.end || typeof value !== "number" || !Number.isFinite(value)) continue;
      if (!["followerChange", "subscriberChange"].includes(key) && value < 0) continue;
      const previous = measured.get(day.date);
      if (!previous || day.complete || !previous.complete) measured.set(day.date, { value, complete: day.complete });
    }
    const exact = typeof totals[key] === "number" && Number.isFinite(totals[key]) && (totals[key]! >= 0 || ["followerChange", "subscriberChange"].includes(key));
    if (!exact && !measured.size) continue;
    const value = exact ? totals[key]! : [...measured.values()].reduce((sum, day) => sum + day.value, 0);
    if (!Number.isFinite(value)) continue;
    result[key] = value;
    coverage[key] = { days: measured.size, expectedDays, partial: measured.size < expectedDays || [...measured.values()].some(day => !day.complete), basis: exact ? "period" : "daily" };
  }
  return { totals: result, coverage };
}
