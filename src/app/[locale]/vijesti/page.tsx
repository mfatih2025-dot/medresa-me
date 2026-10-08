import type { Metadata } from "next";
import { publicNews } from "@/server/public/news";
import { newsUi } from "@/content/vijesti/ui";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { Archive } from "@/components/vijesti/Archive";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = newsUi[locale];
  return pageMetadata("vijesti", locale, { title: t.title, description: t.description });
}

/** Vijesti: the newest stories, led by the latest; older pages at /vijesti/2, /vijesti/3… */
export default async function VijestiPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  const news = await publicNews(locale);
  return <Archive locale={locale} page={1} items={news.onPage(1)} totalPages={news.pageCount} />;
}
