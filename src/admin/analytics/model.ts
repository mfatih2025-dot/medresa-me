export const providers = ["website", "instagram", "facebook", "youtube"] as const;
export type Provider = typeof providers[number];
export const periods = ["today", "yesterday", "7", "30", "60", "90"] as const;
export type Period = typeof periods[number];
export type ProviderState = "connected" | "not_configured" | "permission_required" | "temporarily_unavailable" | "error";
export const metricNames = ["visits", "visitors", "pageviews", "views", "reach", "interactions", "followers", "followerChange", "profileActivity", "subscribers", "subscriberChange", "watchMinutes"] as const;
export type Metric = typeof metricNames[number];
export type Metrics = Partial<Record<Metric, number | null>>;
export type Range = { start: string; end: string };
export type Daily = { date: string; metrics: Metrics; complete: boolean };
export type Ranked = { label: string; value: number; url: string | null; basis: "period" | "lifetime" };
export const reasonNames = ["not_configured", "not_synced", "permission_required", "expired_credential", "unsupported_metric", "provider_delay", "provider_timeout", "provider_unavailable", "invalid_response", "tracking_unavailable", "retention_limit", "no_data", "project_mismatch"] as const;
export type Reason = typeof reasonNames[number];
export type ProviderReport = {
  provider: Provider; state: ProviderState; reason: Reason | null; source: string;
  timezone: string; range: Range; previousRange: Range; todayDate: string;
  totalCoverage?: Partial<Record<Metric, import("./storedTotals").MetricCoverage>>;
  previousCoverage?: Partial<Record<Metric, import("./storedTotals").MetricCoverage>>;
  totals: Metrics; previousTotals: Metrics; current: Metrics;
  daily: Daily[]; today: Daily | null; yesterday: Daily | null;
  breakdowns: { pages: Ranked[]; referrers: Ranked[]; devices: Ranked[]; countries: Ranked[] };
  topContent: Ranked[]; warnings: Reason[]; requiredPermissions: string[];
  fetchedAt: string | null; lastSuccessAt: string | null; lastAttemptAt: string | null;
  trackingStart: string | null; historicalBaseline: null; cumulative: Metrics;
};
export type AnalyticsDashboard = {
  period: Period; generatedAt: string; reports: ProviderReport[];
  storage: "ready" | "migration_required" | "unavailable" | "preview_required";
  writable: boolean; sync: { running: boolean; runId: string | null; startedAt: string | null };
  history: { id: string; started_at: string; completed_at: string | null; outcome: string }[];
};
export const providerLabels: Record<Provider, string> = { website: "Website", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };
export const stateLabels: Record<ProviderState, string> = { connected: "Povezano", not_configured: "Povezivanje nije završeno", permission_required: "Potrebna dozvola", temporarily_unavailable: "Privremeno nedostupno", error: "Posljednje osvježavanje nije uspjelo" };
export const reasonLabels: Record<Reason, string> = {
  not_configured: "Povezivanje nije završeno", not_synced: "Podaci još nijesu dostupni", permission_required: "Pristup analitici nije odobren", expired_credential: "Pristup izvoru je istekao", unsupported_metric: "Izvor ne podržava sve metrike", provider_delay: "Izvor još nije završio obradu podataka", provider_timeout: "Izvor nije odgovorio na vrijeme", provider_unavailable: "Izvor je privremeno nedostupan", invalid_response: "Podaci nijesu mogli biti potvrđeni", tracking_unavailable: "Praćenje posjeta nije potvrđeno", retention_limit: "Dio perioda je izvan dostupne historije", no_data: "Nema podataka za izabrani period", project_mismatch: "Izvor nije namijenjeni Preview projekt",
};
export const metricLabels: Record<Metric, string> = { visits: "Posjete", visitors: "Posjetioci", pageviews: "Pregledi stranica", views: "Pregledi", reach: "Doseg", interactions: "Interakcije", followers: "Pratioci", followerChange: "Promjena pratilaca", profileActivity: "Klikovi na linkove profila", subscribers: "Pretplatnici", subscriberChange: "Promjena pretplatnika", watchMinutes: "Vrijeme gledanja · min" };
