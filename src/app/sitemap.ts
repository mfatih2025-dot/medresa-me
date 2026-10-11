import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { alternatesFor, pageIds } from "@/i18n/routes";
import { archivePath, articleAlternates, articles, pageCount, type NewsArticle } from "@/content/vijesti";
import { absoluteUrl } from "@/seo/config";

/*
 * Every public, indexable URL in its languages, each listing its equivalents
 * as alternates (hreflang): the homepage and the 13 pages, the news archive
 * pages, and every published article with its photographs.
 *
 * Only published content is listed. A news article contributes one URL per
 * language it is published in (`paths`); a draft or an unpublished language
 * has no path, so it never appears here. When the Admin's publication feed
 * replaces the static archive, `publishedNews` is the one function to change.
 * Private routes (/admin, /ulaz7, previews, APIs) are never listed.
 */

type Published = { article: NewsArticle; paths: Partial<Record<Locale, string>> };

function publishedNews(): Published[] {
  return articles.map((article) => ({ article, paths: articleAlternates(article) }));
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

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [null, ...pageIds].flatMap((id) =>
    entries(alternatesFor(id), { changeFrequency: id === null || id === "vijesti" ? "weekly" : "monthly" }),
  );
  const archive = Array.from({ length: pageCount - 1 }, (_, k) =>
    entries(Object.fromEntries(locales.map((l) => [l, archivePath(l, k + 2)])), { changeFrequency: "weekly" }),
  ).flat();
  const news = publishedNews().flatMap(({ article, paths }) =>
    entries(paths, {
      lastModified: article.date,
      ...(article.photos.length ? { images: article.photos.map((p) => absoluteUrl(p.src)) } : {}),
    }),
  );
  return [...pages, ...archive, ...news];
}
