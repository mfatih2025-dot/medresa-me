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
export type VercelRejection = {
  code: typeof vercelRejectionCodes[number] | null;
  parameters: typeof vercelQueryParameters[number][];
  reportingWindowMentioned: boolean; detailsPresent: boolean;
};
export type WebsiteRequestResult = { request: WebsiteRequest; range: Range | null; httpStatus: number | null; reason: Reason | null; rejection?: VercelRejection };
export const websiteRequestLabels: Record<WebsiteRequest, string> = {
  project: "Provjera projekta", current: "Izabrani period", previous: "Prethodni period", daily: "Dnevni tok",
  today: "Danas", yesterday: "Juče", pages: "Stranice", referrers: "Izvori posjeta",
  devices: "Uređaji", countries: "Zemlje", cumulative: "Od početka praćenja",
};
