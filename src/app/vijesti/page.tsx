import type { Metadata } from "next";
import { getDictionary } from "@/content";
import { EDITORIAL_COUNT, sortNews } from "@/content/news";
import { defaultLocale } from "@/i18n/config";
import { NewsArchive } from "@/components/news/NewsArchive";
import { NewsAnnouncement, NewsEditorial, NewsHead } from "@/components/news/NewsLayout";

const { news } = getDictionary(defaultLocale);

export const metadata: Metadata = { title: news.heading };

/** /vijesti — the full news publication: notice, curated stories, then the archive index. */
export default function VijestiPage() {
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
