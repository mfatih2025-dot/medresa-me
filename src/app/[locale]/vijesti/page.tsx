import type { Metadata } from "next";
import { getDictionary } from "@/content";
import { EDITORIAL_COUNT, sortNews } from "@/content/news";
import { asLocale, pageMetadata } from "@/i18n/metadata";
import { NewsArchive } from "@/components/news/NewsArchive";
import { NewsAnnouncement, NewsEditorial, NewsHead } from "@/components/news/NewsLayout";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return pageMetadata("vijesti", locale, { title: getDictionary(locale).news.heading });
}

/** News — the full news publication: notice, curated stories, then the archive index. */
export default async function VijestiPage({ params }: Props) {
  const { news } = getDictionary(asLocale((await params).locale));
  const items = sortNews(news.items);
  return (
    <section aria-labelledby="vijesti-title" className="bg-paper pb-20 pt-32 md:pb-28 md:pt-44 lg:pt-48">
      <div className="wrap">
        <NewsHead id="vijesti-title" as="h1" eyebrow={news.eyebrow} heading={news.heading} />
        <NewsAnnouncement label={news.notice.label} title={news.notice.title} href={news.notice.href} />
        <div className="mt-10 md:mt-14">
          <NewsEditorial
            items={items.slice(0, EDITORIAL_COUNT)}
            readLabel={news.read}
            headingLevel="h2"
            priorityLead
          />
        </div>
        <NewsArchive
          items={items}
          labels={{ archive: news.archive, filterAll: news.filterAll, more: news.more }}
        />
      </div>
    </section>
  );
}
