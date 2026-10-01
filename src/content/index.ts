import type { Locale } from "@/i18n/config";
import { bs, type Dictionary } from "./bs";

const dictionaries: Partial<Record<Locale, Dictionary>> = { bs };

/** Falls back to Bosnian until sq/en dictionaries exist. */
export function getDictionary(locale: Locale = "bs"): Dictionary {
  return dictionaries[locale] ?? bs;
}

export type { Dictionary };
