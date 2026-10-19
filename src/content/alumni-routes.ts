import type { Locale } from "../i18n/config";
// Relative (not "@/"): next.config loads this through src/content/alumni.ts and src/seo/legacy.ts.
import { pathFor } from "../i18n/routes";

/*
 * The address of each Alumni generation's page, in each language:
 *
 *   /alumni/generacija-vii  ·  /sq/alumni/gjenerata-vii  ·  /en/alumni/generation-vii
 *
 * PERMANENT: the QR code printed on each generation's pano encodes the Bosnian
 * address on https://www.medresa.me (public/qr/alumni, scripts/alumni-qr).
 * Never change these words or the numerals; a new generation only adds data.
 * Kept free of the generations' data, so the language switch can use it on
 * every page without loading the Alumni archive.
 */
export const generationSlugWord: Record<Locale, string> = {
  bs: "generacija",
  sq: "gjenerata",
  en: "generation",
};

/** „generacija-vii“: a generation's slug in a language, from its Roman numeral. */
export const generationSlugFor = (roman: string, locale: Locale) =>
  `${generationSlugWord[locale]}-${roman.toLowerCase()}`;

/** „/en/alumni/generation-vii“: a generation's page in a language. */
export const generationPathFor = (roman: string, locale: Locale) =>
  `${pathFor("alumni", locale)}/${generationSlugFor(roman, locale)}`;

/** The same generation page in another language; null for any other path. */
export function generationPathIn(pathname: string, locale: Locale): string | null {
  const m = pathname.match(/^(?:\/(?:sq|en))?\/alumni\/(?:generacija|gjenerata|generation)-([ivxlcdm]+)\/?$/);
  return m ? generationPathFor(m[1], locale) : null;
}
