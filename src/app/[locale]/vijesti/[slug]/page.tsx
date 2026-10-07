import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  archivePath,
  articleAlternates,
  articleByAnySlug,
  articleBySlug,
  articlePath,
  articles,
  articlesOnPage,
  excerpt,
  pageCount,
  photoOf,
  imageOf,
  yearOf,
} from "@/content/vijesti";
import { newsUi } from "@/content/vijesti/ui";
import { locales, type Locale } from "@/i18n/config";
import { asLocale, localizedMetadata } from "@/i18n/metadata";
import { Archive } from "@/components/vijesti/Archive";
import { Article } from "@/components/vijesti/Article";

type Params = { locale: string; slug: string };
type Props = { params: Promise<Params> };

/*
 * Below the news page's address, in each language:
 *   /vijesti/<bs-slug>  ·  /sq/lajme/<sq-slug>  ·  /en/news/<en-slug>   an article
 *   /vijesti/2          ·  /sq/lajme/2          ·  /en/news/2           an older archive page
 * An article reached by another language's slug is sent to this language's (308).
 */

const pageNumber = (slug: string) => (/^\d{1,4}$/.test(slug) ? Number(slug) : null);

export function generateStaticParams({ params }: { params: { locale: string } }): Pick<Params, "slug">[] {
  const locale = asLocale(params.locale);
  const pages = Array.from({ length: pageCount - 1 }, (_, k) => ({ slug: String(k + 2) }));
  return [...articles.map((a) => ({ slug: a[locale].slug })), ...pages];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const n = pageNumber(slug);
  if (n !== null && n >= 2) {
    const paths = Object.fromEntries(locales.map((x) => [x, archivePath(x, n)])) as Record<Locale, string>;
    return localizedMetadata(paths, locale, {
      title: newsUi[locale].pageTitle(n),
      description: newsUi[locale].description,
    });
  }
  const a = articleBySlug(slug, locale);
  if (!a) return {};
  const img = photoOf(a) ?? imageOf(a);
  return localizedMetadata(articleAlternates(a), locale, {
    title: a[locale].title,
    description: excerpt(a[locale], 180),
    publishedTime: a.date,
    ...(img ? { image: { url: img.src, width: img.width, height: img.height, alt: img.alt[locale] } } : {}),
  });
}

export default async function NewsSubPage({ params }: Props) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const n = pageNumber(slug);
  if (n !== null) {
    if (n === 1) permanentRedirect(archivePath(locale));
    if (n < 1 || n > pageCount) notFound();
    const prev = articlesOnPage(n - 1);
    return (
      <Archive locale={locale} page={n} items={articlesOnPage(n)} prevYear={yearOf(prev[prev.length - 1])} />
    );
  }
  const a = articleBySlug(slug, locale);
  if (!a) {
    const other = articleByAnySlug(slug);
    if (other) permanentRedirect(articlePath(other, locale));
    notFound();
  }
  return <Article a={a} locale={locale} />;
}
