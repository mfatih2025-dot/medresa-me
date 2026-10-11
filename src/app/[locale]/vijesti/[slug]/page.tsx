import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  archivePath,
  articlePath,
  articles,
  pageCount,
  yearOf,
} from "@/content/vijesti";
import { publicNews } from "@/server/public/news";
import { newsUi } from "@/content/vijesti/ui";
import { locales } from "@/i18n/config";
import { asLocale } from "@/i18n/metadata";
import { breadcrumbs, JsonLd } from "@/seo/jsonld";
import { newsArchiveMetadata, newsArticleJsonLd, newsArticleMetadata } from "@/seo/news";
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
  const news = await publicNews(locale);
  const n = pageNumber(slug);
  if (n !== null && n >= 2) {
    const counts = await Promise.all(locales.map(async x => ({ locale: x, count: (await publicNews(x)).pageCount })));
    const paths = Object.fromEntries(counts.filter(x => n <= x.count).map(x => [x.locale, archivePath(x.locale, n)]));
    return newsArchiveMetadata(locale, n, paths);
  }
  const a = news.bySlug(slug);
  if (!a) return {};
  return newsArticleMetadata(a, locale, news.paths(a.id));
}

export default async function NewsSubPage({ params }: Props) {
  const { locale: l, slug } = await params;
  const locale = asLocale(l);
  const news = await publicNews(locale);
  const n = pageNumber(slug);
  if (n !== null) {
    if (n === 1) permanentRedirect(archivePath(locale));
    if (n < 1 || n > news.pageCount) notFound();
    const prev = news.onPage(n - 1);
    return (
      <>
        <JsonLd
          data={breadcrumbs(locale, [
            { name: newsUi[locale].title, path: archivePath(locale) },
            { name: newsUi[locale].pageTitle(n), path: archivePath(locale, n) },
          ])}
        />
        <Archive locale={locale} page={n} items={news.onPage(n)} totalPages={news.pageCount} prevYear={yearOf(prev[prev.length - 1])} />
      </>
    );
  }
  const a = news.bySlug(slug);
  if (!a) {
    const other = news.byOtherSlug(slug);
    if (other) permanentRedirect(articlePath(other, locale));
    notFound();
  }
  return (
    <>
      <JsonLd data={newsArticleJsonLd(a, locale, news.paths(a.id))} />
      <Article a={a} locale={locale} navigation={news.navigation(a)} />
    </>
  );
}
