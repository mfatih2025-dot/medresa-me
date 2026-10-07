"use client";

import { usePathname } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "./config";

/** The language of the page being shown, read from its URL (client components). */
export function useLocale(): Locale {
  const first = (usePathname() || "/").split("/")[1];
  return isLocale(first) ? first : defaultLocale;
}
