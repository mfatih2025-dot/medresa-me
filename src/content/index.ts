import type { Locale } from "@/i18n/config";
import { bs, type Dictionary } from "./bs";
import { en } from "./en";
import { sq } from "./sq";

export const dictionaries: Record<Locale, Dictionary> = { bs, sq, en };

export function getDictionary(locale: Locale = "bs"): Dictionary {
  return dictionaries[locale];
}

/** What the header, menu, search and footer need from a dictionary (sent to the browser). */
export type Chrome = Pick<Dictionary, "lang" | "ui" | "nav" | "contact" | "footer"> & {
  news: { heading: string; items: { title: string; href: string }[] };
};

export const chromeOf = (d: Dictionary): Chrome => ({
  lang: d.lang,
  ui: d.ui,
  nav: d.nav,
  contact: d.contact,
  footer: d.footer,
  news: { heading: d.news.heading, items: d.news.items.map((n) => ({ title: n.title, href: n.href })) },
});

export type { Dictionary };
