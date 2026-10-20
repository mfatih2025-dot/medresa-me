import { days, shiftDay, startInstant } from "@/admin/analytics/period";
import type { Daily, Range, Reason } from "@/admin/analytics/model";
import { number, ProviderFailure } from "./common";

type Query = (params: Record<string, string>) => Promise<Record<string, unknown>>;
/** Views are total_value, not a reach time series. Request each missing calendar
 * day independently; never divide an aggregate across days or turn no-data into 0.
 * Already measured historical rows are retained; the last two completed days are
 * re-read because providers may still be processing them. At most 3 requests run.
 */
export async function instagramDailyViews(range: Range, today: string, query: Query, signal: AbortSignal, saved: readonly Daily[] = [], fresh: readonly Daily[] = [], onFailure: (reason: Reason, permission: boolean) => void = () => {}) {
  const measured = new Set(saved.filter(d => d.complete && d.date < shiftDay(today, -2) && number(d.metrics.views) !== null).map(d => d.date));
  for (const day of fresh) if (number(day.metrics.views) !== null) measured.add(day.date);
  const pending = days(range).filter(day => !measured.has(day));
  const received: Daily[] = [];
  let cursor = 0, stopped = false;
  await Promise.all(Array.from({ length: Math.min(3, pending.length) }, async () => {
    while (!stopped && !signal.aborted) {
      const date = pending[cursor++]; if (!date) return;
      try {
        const body = await query({ metric: "views", period: "day", metric_type: "total_value", since: String(Date.parse(startInstant(date, "UTC")) / 1000), until: String(Date.parse(startInstant(shiftDay(date, 1), "UTC")) / 1000) });
        if (Array.isArray(body.data) && body.data.length === 0) { onFailure("no_data", false); continue; }
        const row = Array.isArray(body.data) && body.data.length === 1 ? body.data[0] as Record<string, unknown> : null;
        if (!row || row.name !== "views" || row.period !== "day") { onFailure("invalid_response", false); continue; }
        const total = row.total_value as { value?: unknown } | undefined;
        const value = number(total?.value);
        if (value === null) { onFailure("no_data", false); continue; }
        received.push({ date, metrics: { views: value }, complete: date < today });
      } catch (error) {
        const failure = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response");
        const permission = failure.state === "permission_required";
        onFailure(failure.reason, permission);
        if (permission || failure.reason === "unsupported_metric" || failure.reason === "provider_unavailable" || failure.reason === "provider_timeout") stopped = true;
      }
    }
  }));
  if (signal.aborted) onFailure("provider_timeout", false);
  return received.sort((a, b) => a.date.localeCompare(b.date));
}
