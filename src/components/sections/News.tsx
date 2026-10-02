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
      className="relative bg-paper pb-16 pt-14 md:pb-24 md:pt-[4.5rem] lg:pb-28 lg:pt-20"
    >
      <div className="wrap">
        <NewsHead id="news-title" eyebrow={news.eyebrow} heading={news.heading} link={news.all} />
        <NewsAnnouncement label={news.notice.label} title={news.notice.title} href={news.notice.href} />
        <div className="mt-10 md:mt-14">
          <NewsEditorial items={items} readLabel={news.read} />
        </div>
      </div>
    </section>
  );
}
