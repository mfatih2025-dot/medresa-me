import { reasonNames, type ProviderState, type Reason, type Range } from "./model";
import { validDay } from "./period";
import { websiteRequestDimensions, vercelQueryParameters, vercelRejectionCodes, type WebsiteRequest, type WebsiteRequestResult } from "./websiteRequests";

export type WebsiteTestResult = {
  message: string; httpStatus: number; state: ProviderState | null; reason: Reason | null;
  range: Range | null; pageviews: number | null; visitors: number | null;
  warnings: Reason[]; stored: boolean; requests: WebsiteRequestResult[];
};
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const metric = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : null;

/** Render only known status codes, valid dates and numeric metrics, never raw responses/errors. */
export function websiteTestResult(value: unknown, httpStatus: number): WebsiteTestResult {
  const result: WebsiteTestResult = {
    message: httpStatus === 401 ? "Sesija je istekla. Prijavite se ponovo." : httpStatus === 403 ? "Website test nije dozvoljen iz ovog administratorskog prostora." : "Website test nije završen. Sačuvani podaci ostaju dostupni.",
    httpStatus, state: null, reason: null, range: null, pageviews: null, visitors: null, warnings: [], stored: false, requests: [],
  };
  if (httpStatus < 200 || httpStatus >= 300) return result;
  const body = record(value);
  if (body.acquired !== true) {
    result.message = body.outcome === "cooldown" ? "Sačekajte dvije minute između osvježavanja. Website test nije pokrenut." : body.outcome === "running" ? "Osvježavanje je već u toku. Website test nije pokrenut." : "Website test nije pokrenut. Ponovo učitajte pregled prije novog pokušaja.";
    return result;
  }
  const dashboard = record(body.dashboard);
  if (Array.isArray(body.websiteRequests)) result.requests = body.websiteRequests.slice(0, 11).flatMap(value => {
    const row = record(value), range = record(row.range), rejection = record(row.rejection);
    const request = (Object.keys(websiteRequestDimensions) as WebsiteRequest[]).find(k => k === row.request);
    if (!request) return [];
    return [{ request, range: validDay(range.start) && validDay(range.end) && range.start <= range.end ? { start: range.start, end: range.end } : null,
      httpStatus: typeof row.httpStatus === "number" && Number.isInteger(row.httpStatus) && row.httpStatus >= 100 && row.httpStatus <= 599 ? row.httpStatus : null,
      reason: reasonNames.find(r => r === row.reason) ?? null,
      ...(row.httpStatus === 400 && row.rejection ? { rejection: {
        code: vercelRejectionCodes.find(code => code === rejection.code) ?? null,
        parameters: vercelQueryParameters.filter(parameter => Array.isArray(rejection.parameters) && rejection.parameters.includes(parameter)),
        reportingWindowMentioned: rejection.reportingWindowMentioned === true, detailsPresent: rejection.detailsPresent === true,
      } } : {}) }];
  });
  const report = Array.isArray(dashboard.reports) ? record(dashboard.reports.find(r => record(r).provider === "website")) : {};
  const states: ProviderState[] = ["connected", "not_configured", "permission_required", "temporarily_unavailable", "error"];
  result.state = states.find(s => s === report.state) ?? null;
  result.reason = reasonNames.find(r => r === report.reason) ?? null;
  result.warnings = Array.isArray(report.warnings) ? reasonNames.filter(r => (report.warnings as unknown[]).includes(r)) : [];
  const range = record(report.range);
  if (validDay(range.start) && validDay(range.end) && range.end >= range.start) result.range = { start: range.start, end: range.end };
  const run = Array.isArray(dashboard.history) ? record(dashboard.history.find(r => record(r).id === body.runId)) : {};
  result.stored = dashboard.storage === "ready" && run.outcome === "success" && result.state === "connected"
    && typeof report.fetchedAt === "string" && Number.isFinite(Date.parse(report.fetchedAt));
  // Old saved metrics must not be presented as a new successful Website test.
  if (result.stored && !result.warnings.includes("no_data")) {
    const totals = record(report.totals);
    result.pageviews = metric(totals.pageviews); result.visitors = metric(totals.visitors);
  }
  result.message = result.state ? "Website test je završen." : result.message;
  return result;
}
