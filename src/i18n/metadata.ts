import type { Metadata } from "next";
import { isLocale, type Locale } from "./config";
import { alternatesFor, pathFor, type PageId } from "./routes";

/** Open Graph locale codes. */
const ogLocale: Record<Locale, string> = { bs: "bs_BA", sq: "sq_AL", en: "en_GB" };

/** The site's name in each language, as the suffix of every page title. */
export const siteNames: Record<Locale, string> = {
  bs: "Medresa „Mehmed Fatih“",
  sq: "Medreseja “Mehmed Fatih”",
  en: "Medresa “Mehmed Fatih”",
};

/** The locale param of a page, narrowed (the [locale] layout has already 404'd anything else). */
export const asLocale = (v: string): Locale => (isLocale(v) ? v : "bs");

/**
 * A page's metadata in a language: its title and description, its own URL as
 * canonical, and the same page in the other languages as alternates (hreflang).
 * The final SEO pass can extend this one place.
 */
export function pageMetadata(
  id: PageId | null,
  locale: Locale,
  { title, description }: { title?: string; description?: string } = {},
): Metadata {
  return {
    ...(title ? { title: { absolute: `${title} · ${siteNames[locale]}` } } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: pathFor(id, locale),
      languages: { ...alternatesFor(id), "x-default": pathFor(id, "bs") },
    },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: pathFor(id, locale),
      siteName: siteNames[locale],
      locale: ogLocale[locale],
      type: "website",
      images: [{ url: "/images/hero-campus.jpg", width: 1627, height: 1080 }],
    },
  };
}
