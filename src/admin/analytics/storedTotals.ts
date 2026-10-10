import { days, validDay } from "./period";
import type { Daily, Metric, Metrics, Provider, Range } from "./model";

/** Only daily flow metrics are additive. Unique audiences and current/lifetime
 * counts are never summed. An exact saved period total takes precedence: it must
 * never be added to its constituent daily rows or overlapping period reports. */
const additive: Record<Provider, Metric[]> = {
  website: ["pageviews"], instagram: ["views", "interactions", "followerChange"],
  facebook: ["views", "interactions", "followerChange"], youtube: ["views", "watchMinutes", "subscriberChange"],
};
export type MetricCoverage = { days: number; expectedDays: number; partial: boolean; basis: "period" | "daily" };
export function storedTotals(provider: Provider, range: Range, totals: Metrics, daily: readonly Daily[]) {
  const expectedDays = days(range).length;
  const result = { ...totals };
  const coverage: Partial<Record<Metric, MetricCoverage>> = {};
  for (const key of additive[provider]) {
    if (typeof totals[key] === "number" && Number.isFinite(totals[key])) {
      coverage[key] = { days: expectedDays, expectedDays, partial: false, basis: "period" };
      continue;
    }
    // Storage has a unique provider/timezone/day key. Defensive deduplication also
    // prevents repeat snapshots from being counted twice. Today remains partial.
    const measured = new Map<string, { value: number; complete: boolean }>();
    for (const day of daily) {
      const value = day.metrics[key];
      if (!validDay(day.date) || day.date < range.start || day.date > range.end || typeof value !== "number" || !Number.isFinite(value)) continue;
      if (!["followerChange", "subscriberChange"].includes(key) && value < 0) continue;
      const previous = measured.get(day.date);
      if (!previous || day.complete || !previous.complete) measured.set(day.date, { value, complete: day.complete });
    }
    if (!measured.size) continue;
    const value = [...measured.values()].reduce((sum, day) => sum + day.value, 0);
    if (!Number.isFinite(value)) continue;
    result[key] = value;
    coverage[key] = { days: measured.size, expectedDays, partial: measured.size < expectedDays || [...measured.values()].some(day => !day.complete), basis: "daily" };
  }
  return { totals: result, coverage };
}
