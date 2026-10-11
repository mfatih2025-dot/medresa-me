import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { alternatesFor, pageIds } from "@/i18n/routes";
import { archivePath, type NewsArticle } from "@/content/vijesti";
import { publicNews } from "@/server/public/news";
import { absoluteUrl } from "@/seo/config";

/*
 * Every public, indexable URL in its languages, each listing its equivalents
 * as alternates (hreflang): the homepage and the 13 pages, the news archive
 * pages, and every published article with its photographs.
 *
 * Only published content is listed. A news article contributes one URL per
 * language it is published in (`paths`); a draft or an unpublished language
 * has no path, so it never appears here. The shared public News pipeline
 * combines the static archive and eligible Supabase locale publications.
 * Private routes (/admin, /ulaz7, previews, APIs) are never listed.
 */

type Published = { article: NewsArticle; paths: Partial<Record<Locale, string>>; locale: Locale };

async function publishedNews(): Promise<Published[]> {
  const feeds = await Promise.all(locales.map(locale => publicNews(locale)));
  return feeds.flatMap((feed, index) => feed.articles.map(article => ({
    article, paths: feed.paths(article.id), locale: locales[index],
  })));
}

const entries = (
  paths: Partial<Record<Locale, string>>,
  extra: Omit<MetadataRoute.Sitemap[number], "url"> = {},
): MetadataRoute.Sitemap => {
  const languages = Object.fromEntries(
    locales.filter((l) => paths[l]).map((l) => [l, absoluteUrl(paths[l]!)]),
  );
  if (paths.bs) languages["x-default"] = absoluteUrl(paths.bs);
  return locales
    .filter((l) => paths[l])
    .map((l) => ({ url: absoluteUrl(paths[l]!), alternates: { languages }, ...extra }));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const feeds = await Promise.all(locales.map(locale => publicNews(locale)));
  const pages = [null, ...pageIds].flatMap((id) =>
    entries(alternatesFor(id), { changeFrequency: id === null || id === "vijesti" ? "weekly" : "monthly" }),
  );
  const maxPages = Math.max(...feeds.map(feed => feed.pageCount));
  const archive = Array.from({ length: maxPages - 1 }, (_, k) =>
    entries(Object.fromEntries(locales.filter((_, i) => k + 2 <= feeds[i].pageCount).map(l => [l, archivePath(l, k + 2)])), { changeFrequency: "weekly" }),
  ).flat();
  const news = (await publishedNews()).flatMap(({ article, paths, locale }) =>
    entries(paths, {
      lastModified: article.date,
      ...(article.photos.length ? { images: article.photos.map((p) => absoluteUrl(p.src)) } : {}),
    }).filter(entry => entry.url === absoluteUrl(paths[locale]!)),
  );
  return [...pages, ...archive, ...news];
}
