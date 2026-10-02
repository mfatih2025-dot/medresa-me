import Link from "next/link";
import type { Dictionary } from "@/content";
import { sortNews, type NewsItem } from "@/content/news";
import { NewsHead } from "@/components/news/NewsLayout";
import { NewsMeta } from "@/components/news/NewsStory";
import { GoldRule, NewsImage } from "@/components/news/NewsMotion";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

const arrow =
  "shrink-0 text-gold-deep transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]";

/**
 * Homepage Vijesti: one featured story and a ruled index.
 *
 * The featured story stands on a gold column — a hairline carrying its category and
 * date vertically, like a pillar of the Medresa's arcades. The photograph breaks
 * the text grid and runs off the right edge of the page; the headline sits on a
 * paper plate that cuts into the photograph's lower-left corner. Below, the Upis
 * notice and the next stories form one compact index band.
 */
export function News({ dict }: { dict: Dictionary }) {
  const { news } = dict;
  const [lead, ...rest] = sortNews(news.items).slice(0, 3);

  return (
    <section
      aria-labelledby="news-title"
      className="news-type relative overflow-x-clip bg-paper pb-[var(--section-y)] shadow-[0_-18px_40px_-24px_rgb(6_18_15/0.45)] pt-11 md:pt-14 lg:pb-[calc(var(--section-y)*0.75)] lg:pt-16"
    >
      <div className="wrap">
        <NewsHead id="news-title" eyebrow={news.eyebrow} heading={news.heading} link={news.all} />
        {lead && <Featured item={lead} readLabel={news.read} />}
        <NewsIndex notice={news.notice} items={rest} />
      </div>
    </section>
  );
}

function Featured({ item, readLabel }: { item: NewsItem; readLabel: string }) {
  return (
    <article className="mt-8 md:mt-10 lg:mt-12">
      <a
        href={item.href}
        rel="noopener"
        className="group grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 transition-transform duration-150 ease-out active:scale-[0.995] md:grid-cols-[2rem_minmax(0,1fr)] md:gap-x-4 lg:grid-cols-[2.5rem_minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-0"
      >
        {/* The column: category and date set vertically above a gold hairline. */}
        <div className="row-span-2 flex flex-col items-center lg:row-span-1">
          <Reveal variant="fade">
            <p className="rotate-180 whitespace-nowrap text-[0.6875rem] font-medium uppercase leading-none tracking-[0.24em] text-gold-deep [writing-mode:vertical-rl]">
              {item.category}
              <span aria-hidden className="mx-[0.6em] text-gold">
                ·
              </span>
              <time dateTime={item.date} className="text-ink-soft">
                {item.dateLabel}
              </time>
            </p>
          </Reveal>
          <GoldRule
            vertical
            className="mt-4 flex-1 transition-colors duration-300 group-hover:bg-gold md:mt-5"
          />
        </div>

        {/* The photograph runs off the right edge of the page. */}
        <div className="-mr-[var(--gutter)] lg:col-start-3 lg:row-start-1 lg:-mr-[calc(var(--gutter)+max(0px,(100vw-var(--max))/2))]">
          <NewsImage
            image={item.image}
            sizes="(min-width: 1024px) 64vw, 96vw"
            className="aspect-[4/3] md:aspect-[16/10] lg:aspect-[6/5] xl:aspect-[16/10] 2xl:aspect-[2/1]"
          />
        </div>

        {/* Paper plate: overlaps the photograph's lower-left corner. */}
        <div className="relative z-10 -mt-12 mr-10 bg-paper pr-5 pt-5 min-[480px]:mr-[22%] md:-mt-20 md:mr-[38%] md:pr-8 md:pt-7 lg:col-start-2 lg:row-start-1 lg:-mr-16 lg:mt-0 lg:self-end lg:pr-12 lg:pt-10 xl:-mr-32">
          <Reveal y={14}>
            <h3 className="news-headline max-w-[18ch] text-[clamp(1.625rem,1.15rem+2.1vw,3.125rem)] font-medium leading-[1.08] tracking-[-0.02em] text-green">
              <span className="link-u">{item.title}</span>
            </h3>
            <p className="news-excerpt mt-4 line-clamp-4 max-w-[32em] text-[0.9375rem] leading-[1.6] text-ink-soft md:mt-5 md:text-base">
              {item.excerpt}
            </p>
            <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green md:mt-4">
              {readLabel}
              <ArrowRight className={arrow} />
            </span>
          </Reveal>
        </div>
      </a>
    </article>
  );
}

/**
 * The index band: the Upis notice first, then the next stories. One ruled row per
 * entry on phones; side by side, divided by hairlines, from tablet up.
 */
function NewsIndex({ notice, items }: { notice: Dictionary["news"]["notice"]; items: readonly NewsItem[] }) {
  const count = items.length + 1;
  const cols = count >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "";
  // Hairline between neighbours in a row (two per row on tablets, all in one row on desktop).
  const divider = (i: number) =>
    `${i % 2 ? "md:border-l md:pl-6" : "md:border-l-0 md:pl-0"} ${i ? "lg:border-l lg:pl-8" : "lg:border-l-0 lg:pl-0"} md:pr-6 lg:pr-8`;
  const row =
    "group relative grid min-h-16 grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-4 py-4 transition-colors duration-150 ease-out active:bg-ink/[0.03] md:h-full md:py-5 lg:grid-cols-[4.5rem_minmax(0,1fr)_auto]";
  // A gold rule draws along the row's base on hover (pointer devices only).
  const accent = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gold transition-[scale] duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
    />
  );
  const title =
    "news-headline line-clamp-3 text-[1rem] font-medium leading-[1.3] text-green md:text-[1.0625rem]";

  return (
    <ol className={`mt-10 grid border-t border-ink/15 md:mt-12 lg:mt-14 ${cols}`}>
      <Reveal as="li" y={10} className={`border-b border-ink/12 ${divider(0)}`}>
        <Link href={notice.href} className={row}>
          <span className="grid aspect-square place-items-center border border-gold/60 bg-gold/[0.08] text-[0.625rem] font-medium uppercase tracking-[0.2em] text-gold-deep">
            {notice.label}
          </span>
          <span className={title}>
            <span className="link-u">{notice.title}</span>
          </span>
          <ArrowRight className={arrow} />
          {accent}
        </Link>
      </Reveal>
      {items.map((item, i) => (
        <Reveal
          key={item.href}
          as="li"
          y={10}
          delay={(i + 1) * 0.06}
          className={`border-b border-ink/12 ${divider(i + 1)}`}
        >
          <a href={item.href} rel="noopener" className={row}>
            <NewsImage image={item.image} sizes="5rem" className="aspect-square" quiet />
            <span>
              <NewsMeta item={item} />
              <span className={`${title} mt-2 block`}>
                <span className="link-u">{item.title}</span>
              </span>
            </span>
            <ArrowRight className={arrow} />
            {accent}
          </a>
        </Reveal>
      ))}
    </ol>
  );
}
