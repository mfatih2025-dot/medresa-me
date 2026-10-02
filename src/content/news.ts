import type { Dictionary } from "./bs";

export type NewsItem = Dictionary["news"]["items"][number];

/** Newest first, by ISO date. Never mutates the source list. */
export function sortNews(items: readonly NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

/** Year of publication, taken from the ISO date. */
export const newsYear = (item: NewsItem) => item.date.slice(0, 4);

/** How many stories the curated editorial layout shows before the archive index takes over. */
export const EDITORIAL_COUNT = 6;
