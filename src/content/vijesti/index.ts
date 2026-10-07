import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";
import { allArticles } from "./articles";
import type { NewsArticle, NewsPhoto, NewsTopic, NewsVersion } from "./types";

export type { NewsArticle, NewsPhoto, NewsTopic, NewsVersion } from "./types";

/*
 * The news store: everything the news pages ask of the articles goes through
 * here, so replacing the static archive with the Admin's storage later changes
 * this file only.
 */

/** Newest first, by publication date; never by hand. Same-day articles keep a stable order. */
export const articles: readonly NewsArticle[] = [...allArticles].sort(
  (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
);

/** Stories per archive page. Page 1 opens with the lead story. */
export const PAGE_SIZE = 12;
export const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));

export function articlesOnPage(page: number): readonly NewsArticle[] {
  return articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

/** The archive page an article is listed on (for the article's way back). */
export function pageOf(article: NewsArticle): number {
  return Math.floor(articles.indexOf(article) / PAGE_SIZE) + 1;
}

/** The article whose `locale` slug is `slug`. */
export function articleBySlug(slug: string, locale: Locale): NewsArticle | undefined {
  return articles.find((a) => a[locale].slug === slug);
}

/** The article that has `slug` in any language (to send a wrong-language address to the right one). */
export function articleByAnySlug(slug: string): NewsArticle | undefined {
  return articles.find((a) => a.bs.slug === slug || a.sq.slug === slug || a.en.slug === slug);
}

/** The archive's address in a language, page 1 or a later page (/vijesti/2). */
export function archivePath(locale: Locale, page = 1): string {
  const base = pathFor("vijesti", locale);
  return page > 1 ? `${base}/${page}` : base;
}

/** An article's address in a language: /vijesti/<bs>, /sq/lajme/<sq>, /en/news/<en>. */
export function articlePath(article: NewsArticle, locale: Locale): string {
  return `${pathFor("vijesti", locale)}/${article[locale].slug}`;
}

export function articleAlternates(article: NewsArticle): Record<Locale, string> {
  return { bs: articlePath(article, "bs"), sq: articlePath(article, "sq"), en: articlePath(article, "en") };
}

/** Newer and older neighbours in the archive. */
export function neighbours(article: NewsArticle) {
  const i = articles.indexOf(article);
  return { newer: articles[i - 1], older: articles[i + 1] };
}

const intl: Record<Locale, string> = { bs: "bs-BA", sq: "sq-AL", en: "en-GB" };

/** „6. oktobar 2026.“ · “6 tetor 2026” · “6 October 2026” — the date as each language writes it. */
export function formatDate(date: string, locale: Locale): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat(intl[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export const yearOf = (a: NewsArticle) => a.date.slice(0, 4);

/** The body's plain text, without Markdown marks or placed photographs. */
function plain(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\(\d+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|\*/g, "")
    .replace(/^#+\s.*$/gm, "")
    .replace(/^\s*(?:[->]|\d+\.)\s+/gm, "");
}

/**
 * A listing excerpt: the author's standfirst, or the opening of the first
 * paragraph, cut at a word. Taken from the article, never written for it.
 */
export function excerpt(v: NewsVersion, max = 220): string {
  if (v.lead) return v.lead;
  const first =
    plain(v.body)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .find((p) => p.length > 0) ?? "";
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–—-]$/, "")}…`;
}

/** The article's first real photograph (not a poster or card) — the listing's photographic moment. */
export const photoOf = (a: NewsArticle): NewsPhoto | undefined => a.photos.find((p) => !p.graphic);
/** The first image of any kind: a photograph, or a graphic where there is no photograph. */
export const imageOf = (a: NewsArticle): NewsPhoto | undefined => a.photos[0];

/** Topic labels for the homepage's story column. */
export const topicLabels: Record<Locale, Record<NewsTopic, string>> = {
  bs: {
    visits: "Posjete",
    donations: "Donacije",
    school: "Iz škole",
    events: "Obilježavanja",
    notices: "Obavještenja",
    sport: "Sport",
  },
  sq: {
    visits: "Vizita",
    donations: "Donacione",
    school: "Nga shkolla",
    events: "Shënime",
    notices: "Njoftime",
    sport: "Sport",
  },
  en: {
    visits: "Visits",
    donations: "Donations",
    school: "School life",
    events: "Occasions",
    notices: "Notices",
    sport: "Sport",
  },
};
