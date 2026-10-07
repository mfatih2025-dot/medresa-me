/**
 * Locale registry and URL scheme.
 *
 *   bs  Bosanski — the default. Its URLs stay unprefixed (/, /historijat, /uip …),
 *       exactly as before, so every existing link and search result keeps
 *       working; /bs/… is also served and declares the unprefixed URL canonical.
 *   sq  Shqip   — /sq, /sq/historijat …
 *   en  English — /en, /en/historijat …
 *
 * All pages live under app/[locale]/ and are generated for every locale; the
 * proxy (src/proxy.ts) maps unprefixed URLs to /bs internally, serves each
 * language's own slugs (src/i18n/routes.ts) and sends a visitor who chose sq
 * or en to their prefixed URLs. Every page is written in all three languages.
 */
export const locales = ["bs", "sq", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "bs";

/** Locales whose content has been translated (all three since the SQ/EN localization). */
export const translated: readonly Locale[] = ["bs", "sq", "en"];

/** The visitor's choice, remembered for a year (read by the proxy and the gateway). */
export const LOCALE_COOKIE = "medresa-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const localeNames: Record<Locale, { native: string; short: string }> = {
  bs: { native: "Bosanski", short: "BS" },
  sq: { native: "Shqip", short: "SQ" },
  en: { native: "English", short: "EN" },
};

export const isLocale = (v: string | undefined | null): v is Locale =>
  !!v && (locales as readonly string[]).includes(v);

/** The path without its locale prefix ("/sq/uip" → "/uip", "/sq" → "/"). */
export function stripLocale(pathname: string): string {
  const seg = pathname.split("/")[1];
  if (!isLocale(seg)) return pathname || "/";
  const rest = pathname.slice(seg.length + 1);
  return rest || "/";
}

/** The public URL of a path in a locale (Bosnian stays unprefixed). */
export function localizePath(pathname: string, locale: Locale): string {
  const base = stripLocale(pathname);
  if (locale === defaultLocale) return base;
  return base === "/" ? `/${locale}` : `/${locale}${base}`;
}

/** Remember the visitor's choice (client side). */
export function rememberLocale(locale: Locale) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
