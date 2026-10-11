import type { Metadata } from "next";
import { excerpt, imageOf, photoOf, topicLabels, type NewsArticle } from "@/content/vijesti";
import { newsUi } from "@/content/vijesti/ui";
import type { Locale } from "@/i18n/config";
import { localizedMetadata } from "@/i18n/metadata";
import { pathFor } from "@/i18n/routes";
import { absoluteUrl, describe, languageTag } from "./config";
import { breadcrumbs, orgRef, WEBSITE_ID } from "./jsonld";

/*
 * News SEO from the article alone, so every article published later (from
 * the static archive or the Admin's publication feed) gets correct metadata
 * and structured data without anyone editing code:
 *
 *   paths   the article's URL in each language it is PUBLISHED in. A language
 *           left out (a draft or unpublished locale) gets no hreflang and is
 *           never linked; its URL does not exist (404), so it cannot be indexed.
 */

type Paths = Partial<Record<Locale, string>>;

/** The article's description: the author's standfirst, or the text's opening. */
const summary = (a: NewsArticle, locale: Locale) => describe(a[locale].lead ?? excerpt(a[locale], 300));

/** The share image: the first real photograph, else the first graphic; none → the site's default. */
function shareImage(a: NewsArticle, locale: Locale) {
  const p = photoOf(a) ?? imageOf(a);
  return p ? { url: p.src, width: p.width, height: p.height, alt: p.alt[locale] || a[locale].title } : undefined;
}

export function newsArticleMetadata(a: NewsArticle, locale: Locale, paths: Paths): Metadata {
  const meta = localizedMetadata(paths, locale, {
    title: a[locale].title,
    description: summary(a, locale),
    image: shareImage(a, locale),
    publishedTime: a.date,
  });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, section: topicLabels[locale][a.topic] } as Metadata["openGraph"],
  };
}

/** An archive page (1 = /vijesti) of the news, in a language. */
export function newsArchiveMetadata(locale: Locale, page: number, paths: Paths): Metadata {
  const t = newsUi[locale];
  return localizedMetadata(paths, locale, {
    title: page > 1 ? t.pageTitle(page) : t.title,
    description: t.description,
  });
}

/** NewsArticle + its breadcrumbs, for the article page. */
export function newsArticleJsonLd(a: NewsArticle, locale: Locale, paths: Paths) {
  const v = a[locale];
  const url = absoluteUrl(paths[locale]!);
  const images = a.photos.map((p) => ({
    "@type": "ImageObject",
    url: absoluteUrl(p.src),
    width: p.width,
    height: p.height,
    ...(p.alt[locale] ? { caption: p.alt[locale] } : {}),
  }));
  return [
    {
      "@type": "NewsArticle",
      "@id": `${url}#article`,
      headline: v.title,
      description: summary(a, locale),
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: languageTag[locale],
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(images.length ? { image: images } : {}),
      articleSection: topicLabels[locale][a.topic],
      author: orgRef(locale),
      publisher: orgRef(locale),
      isPartOf: { "@id": WEBSITE_ID },
    },
    breadcrumbs(locale, [
      { name: newsUi[locale].title, path: pathFor("vijesti", locale) },
      { name: v.title, path: paths[locale]! },
    ]),
  ];
}
