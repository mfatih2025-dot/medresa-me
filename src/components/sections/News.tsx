import type { Dictionary } from "@/content";
import { sortNews } from "@/content/news";
import { NewsAnnouncement, NewsEditorial, NewsHead } from "@/components/news/NewsLayout";

/** Homepage Vijesti: intro, the institutional notice, and the three newest stories. */
export function News({ dict }: { dict: Dictionary }) {
  const { news } = dict;
  const items = sortNews(news.items).slice(0, 3);
  return (
    <section
      aria-labelledby="news-title"
      className="relative bg-paper pb-[var(--section-y)] pt-11 md:pt-14 lg:pb-[calc(var(--section-y)*0.75)] lg:pt-16"
    >
      <div className="wrap">
        <NewsHead id="news-title" eyebrow={news.eyebrow} heading={news.heading} link={news.all} />
        <NewsAnnouncement label={news.notice.label} title={news.notice.title} href={news.notice.href} />
        <div className="mt-8 md:mt-12">
          <NewsEditorial items={items} readLabel={news.read} />
        </div>
      </div>
    </section>
  );
}
