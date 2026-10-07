import { defaultLocale, isLocale, locales, type Locale } from "./config";

/**
 * The route map: one page identity, one URL per language.
 *
 * A page's identity is its Bosnian slug — also the name of its folder under
 * app/[locale]/ — so the application has one page per identity, never three.
 * Each language then has its own native slug:
 *
 *   bs   /upis                (unprefixed, as on medresa.me)
 *   sq   /sq/regjistrimi
 *   en   /en/admissions
 *
 * The proxy (src/proxy.ts) serves a localized URL from the identity's folder,
 * and sends a URL in the wrong language's slug (e.g. /en/upis) to the right one.
 * Every internal link, the language switch and canonical/alternate URLs are
 * built from this map, so changing a slug here changes it everywhere.
 */
export const pageIds = [
  "historijat",
  "misija",
  "uip",
  "oiu",
  "nastava",
  "tiu",
  "alumni",
  "galerija",
  "kucni-red",
  "donacije",
  "vijesti",
  "upis",
  "kontakt",
] as const;
export type PageId = (typeof pageIds)[number];

export const slugs: Record<PageId, Record<Locale, string>> = {
  historijat: { bs: "historijat", sq: "historiku", en: "history" },
  misija: { bs: "misija", sq: "misioni-dhe-vizioni", en: "mission-and-vision" },
  uip: { bs: "uip", sq: "drejtoria-dhe-profesoret", en: "administration-and-teachers" },
  oiu: { bs: "oiu", sq: "objekti-dhe-kushtet", en: "campus-and-facilities" },
  nastava: { bs: "nastava", sq: "mesimi-dhe-lendet", en: "teaching-and-subjects" },
  tiu: { bs: "tiu", sq: "garat-dhe-sukseset", en: "competitions-and-achievements" },
  // „Alumni“ is the word in all three languages.
  alumni: { bs: "alumni", sq: "alumni", en: "alumni" },
  galerija: { bs: "galerija", sq: "galeria", en: "gallery" },
  "kucni-red": { bs: "kucni-red", sq: "rregullat-e-shtepise", en: "house-rules" },
  donacije: { bs: "donacije", sq: "donacione", en: "donations" },
  vijesti: { bs: "vijesti", sq: "lajme", en: "news" },
  upis: { bs: "upis", sq: "regjistrimi", en: "admissions" },
  kontakt: { bs: "kontakt", sq: "kontakti", en: "contact" },
};

export const isPageId = (v: string): v is PageId => (pageIds as readonly string[]).includes(v);

/** The locale's prefix: "" for Bosnian, "/sq", "/en". */
const prefix = (locale: Locale) => (locale === defaultLocale ? "" : `/${locale}`);

/** The public URL of a page (or of the homepage, `id` null) in a language. */
export function pathFor(id: PageId | null, locale: Locale): string {
  if (!id) return prefix(locale) || "/";
  return `${prefix(locale)}/${slugs[id][locale]}`;
}

/** The page whose `locale` slug is `slug` (null if none). */
export function pageBySlug(slug: string, locale: Locale): PageId | null {
  for (const id of pageIds) if (slugs[id][locale] === slug) return id;
  return null;
}

/**
 * Reads a public path: its language, and which page it is (null = homepage,
 * undefined = not a known page). Accepts a page's own-language slug and, for
 * robustness, its identity (Bosnian) slug.
 */
export function parsePath(pathname: string): { locale: Locale; id: PageId | null | undefined } {
  const parts = pathname.split("/").filter(Boolean);
  const locale: Locale = isLocale(parts[0]) ? parts[0] : defaultLocale;
  const rest = isLocale(parts[0]) ? parts.slice(1) : parts;
  if (rest.length === 0) return { locale, id: null };
  const id = pageBySlug(rest[0], locale) ?? (isPageId(rest[0]) ? rest[0] : null);
  return { locale, id: id ?? undefined };
}

/** The same page in another language (the homepage of that language if the page is unknown). */
export function translatePath(pathname: string, to: Locale): string {
  const { id } = parsePath(pathname);
  return pathFor(id ?? null, to);
}

/** URLs of a page in every language: for canonical and hreflang alternates. */
export function alternatesFor(id: PageId | null) {
  return Object.fromEntries(locales.map((l) => [l, pathFor(id, l)])) as Record<Locale, string>;
}
