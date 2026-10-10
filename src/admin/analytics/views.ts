import { providers, type ProviderReport } from "./model";

/**
 * Selected-period native view counts only: Website pageviews; all other sources views.
 * One report per provider, in fixed provider order. Never substitute reach, followers,
 * cumulative/lifetime counts or sum daily unique counts. Missing/invalid values are
 * excluded; measured zero participates. No measured sources means unavailable, not 0.
 * Sources retain their own reporting calendar; the sum is views, not unique people.
 */
export function periodViews(reports: readonly Pick<ProviderReport, "provider" | "totals">[]) {
  const sources = providers.map(provider => {
    const report = reports.find(r => r.provider === provider);
    const value = report?.totals[provider === "website" ? "pageviews" : "views"];
    return { provider, value: typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null };
  });
  const available = sources.filter(source => source.value !== null);
  const sum = available.reduce((total, source) => total + source.value!, 0);
  return { total: available.length && Number.isFinite(sum) ? sum : null, sources, coverage: available.length };
}
