/**
 * Locale registry. Only Bosnian/Montenegrin ships today; Albanian and English
 * are reserved. To add one: create `src/content/<locale>.ts` implementing
 * `Dictionary`, register it in `src/content/index.ts` and move routes under
 * `app/[locale]/`.
 */
export const locales = ["bs", "sq", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "bs";
export const enabledLocales: readonly Locale[] = ["bs"];
