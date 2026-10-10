import type { Locale } from "@/i18n/config";
export type AdmissionStatus = "open" | "closed";
export type AdmissionsState = { status: AdmissionStatus; revision: number };
export type AdmissionsControl = { state: AdmissionsState | null; writable: boolean; message: string | null };
/** Static institutional translations, never AI-generated. Reuse the existing
 * introductory line + animated status word without changing renderer styling. */
export function admissionText(status: AdmissionStatus, locale: Locale) {
 const before = { bs: "UPIS JE", sq: "REGJISTRIMI ËSHTË", en: "ADMISSIONS ARE" }[locale];
 const word = status === "open" ? { bs: "OTVOREN", sq: "I HAPUR", en: "OPEN" }[locale] : { bs: "ZATVOREN", sq: "I MBYLLUR", en: "CLOSED" }[locale];
 return { before, word, after: "" };
}
