import type { Range, Reason } from "./model";

// Fixed request names/dimensions only. No provider response text, URLs or credentials.
export const websiteRequestDimensions = {
  project: null, current: "environment", previous: "environment", daily: "day",
  today: "environment", yesterday: "environment", pages: "requestPath",
  referrers: "referrerHostname", devices: "deviceType", countries: "country", cumulative: "environment",
} as const;
export type WebsiteRequest = keyof typeof websiteRequestDimensions;
export type WebsiteRequestResult = { request: WebsiteRequest; range: Range | null; httpStatus: number | null; reason: Reason | null };
export const websiteRequestLabels: Record<WebsiteRequest, string> = {
  project: "Provjera projekta", current: "Izabrani period", previous: "Prethodni period", daily: "Dnevni tok",
  today: "Danas", yesterday: "Juče", pages: "Stranice", referrers: "Izvori posjeta",
  devices: "Uređaji", countries: "Zemlje", cumulative: "Od početka praćenja",
};
