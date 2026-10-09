import type { Range, Reason } from "./model";

// Fixed request names/dimensions only. No provider response text, URLs or credentials.
export const websiteRequestDimensions = {
  project: null, current: "environment", previous: "environment", daily: "day",
  today: "environment", yesterday: "environment", pages: "requestPath",
  referrers: "referrerHostname", devices: "deviceType", countries: "country", cumulative: "environment",
} as const;
export type WebsiteRequest = keyof typeof websiteRequestDimensions;
export const vercelQueryParameters = ["projectId", "by", "since", "until", "limit", "filter", "teamId", "slug"] as const;
export const vercelRejectionCodes = ["bad_request", "invalid_request", "invalid_query", "invalid_query_parameter", "invalid_parameter", "invalid_filter", "invalid_by", "invalid_since", "invalid_until", "invalid_limit", "validation_error"] as const;
// Preserve API codes composed solely of technical words; never pass arbitrary strings.
const codeWords = new Set("invalid unsupported filter odata syntax parse parser parsing expression query parameter parameters bad request schema validation error failed failure team project account context scope permission permissions required forbidden unauthorized date range since until by limit type operator function dimension dimensions group grouping unknown not found enabled analytics web disabled window retention outside data unavailable".split(" "));
export function vercelErrorCode(value: unknown): string | null {
  return typeof value === "string" && value.length <= 80 && /^[a-z]+(?:_[a-z]+)*$/.test(value) && value.split("_").every(word => codeWords.has(word)) ? value : null;
}
export const vercelResponseShapes = ["error_object", "error_string", "top_level", "unrecognized"] as const;
export const vercelValidationHints = ["filter_syntax", "operator_or_function", "date_range", "project_context", "team_context", "access", "analytics_configuration"] as const;
export type VercelRejection = {
  code: string | null;
  parameters: typeof vercelQueryParameters[number][];
  reportingWindowMentioned: boolean; detailsPresent: boolean;
  responseShape: typeof vercelResponseShapes[number]; hints: typeof vercelValidationHints[number][];
};
export type WebsiteRequestResult = { request: WebsiteRequest; range: Range | null; httpStatus: number | null; reason: Reason | null; rejection?: VercelRejection };
export const websiteRequestLabels: Record<WebsiteRequest, string> = {
  project: "Provjera projekta", current: "Izabrani period", previous: "Prethodni period", daily: "Dnevni tok",
  today: "Danas", yesterday: "Juče", pages: "Stranice", referrers: "Izvori posjeta",
  devices: "Uređaji", countries: "Zemlje", cumulative: "Od početka praćenja",
};
