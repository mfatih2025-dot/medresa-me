import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { locales } from "@/i18n/config";
import { alternatesFor, pageIds, pathFor, type PageId } from "@/i18n/routes";
import { archivePath, articleAlternates, articles, pageCount } from "@/content/vijesti";
import type { Locale } from "@/i18n/config";

/*
 * Every public page in its three languages, each entry listing the others as
 * alternates (hreflang). Pages still waiting for their content are left out
 * until they are written. Groundwork for the final SEO pass.
 */
const pending: PageId[] = [];

export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (path: string) => new URL(path, site.url).toString();
  const ids: (PageId | null)[] = [null, ...pageIds.filter((id) => !pending.includes(id))];
  const entries = (paths: Record<Locale, string>, lastModified?: string) => {
    const languages = Object.fromEntries(Object.entries(paths).map(([l, path]) => [l, abs(path)]));
    return locales.map((locale) => ({
      url: abs(paths[locale]),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages },
    }));
  };
  const news = [
    ...Array.from({ length: pageCount - 1 }, (_, k) =>
      entries(Object.fromEntries(locales.map((l) => [l, archivePath(l, k + 2)])) as Record<Locale, string>),
    ),
    ...articles.map((a) => entries(articleAlternates(a), a.date)),
  ].flat();
  return [
    ...ids.flatMap((id) => {
      const languages = Object.fromEntries(
        Object.entries(alternatesFor(id)).map(([l, path]) => [l, abs(path)]),
      );
      return locales.map((locale) => ({
        url: abs(pathFor(id, locale)),
        alternates: { languages },
      }));
    }),
    ...news,
  ];
}
