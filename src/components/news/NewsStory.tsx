import type { NewsItem } from "@/content/news";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";
import { GoldRule, NewsImage } from "./NewsMotion";

/**
 * Editorial roles. Each one sets its own image proportion, text/image
 * relationship and type scale, so a run of stories reads as curated:
 *
 * lead     – dominant story: large photograph, strong headline, excerpt
 * side     – compact horizontal on phones, tall portrait beside the lead on desktop
 * compact  – small square photograph with a headline beside it
 * wide     – landscape photograph with text beside it from tablet up
 * text     – no photograph; headline-led, opened by a gold rule
 * feature  – medium landscape photograph above a short text
 */
export type StoryRole = "lead" | "side" | "compact" | "wide" | "text" | "feature";

type Props = {
  item: NewsItem;
  role: StoryRole;
  readLabel: string;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
};

export function NewsMeta({ item, className = "" }: { item: NewsItem; className?: string }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[0.8125rem] leading-none ${className}`}>
      <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-gold-deep">
        {item.category}
      </span>
      <span aria-hidden className="text-gold">
        ·
      </span>
      <time dateTime={item.date} className="font-normal text-ink-soft">
        {item.dateLabel}
      </time>
    </p>
  );
}

function ReadMore({ label }: { label: string }) {
  return (
    <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green">
      {label}
      <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
    </span>
  );
}

const headline = {
  lead: "text-[clamp(1.625rem,1.15rem+2vw,2.875rem)] leading-[1.1] tracking-[-0.018em]",
  feature: "text-[clamp(1.3125rem,1.1rem+0.8vw,1.75rem)] leading-[1.18] tracking-[-0.01em]",
  wide: "text-[clamp(1.3125rem,1.05rem+1.1vw,2.125rem)] leading-[1.14] tracking-[-0.012em]",
  text: "text-[clamp(1.5rem,1.15rem+1.4vw,2.375rem)] leading-[1.12] tracking-[-0.015em]",
  compact: "text-[1.0625rem] leading-[1.3] md:text-[1.125rem]",
  side: "text-[1.0625rem] leading-[1.3] md:text-[1.125rem] lg:text-[1.625rem] lg:leading-[1.2] lg:tracking-[-0.01em]",
} as const;

const excerptCls = "news-excerpt mt-3 max-w-[36em] text-[0.9375rem] leading-[1.6] text-ink-soft md:text-base";

export function NewsStory({ item, role, readLabel, headingLevel = "h3", priority = false }: Props) {
  const H = headingLevel;
  const title = (
    <H className={`news-headline font-medium text-green ${headline[role]}`}>
      <span className="link-u">{item.title}</span>
    </H>
  );
  const link = "group block rounded-[2px] transition-transform duration-150 ease-out active:scale-[0.995]";

  if (role === "lead")
    return (
      <article>
        <a href={item.href} rel="noopener" className={link}>
          <NewsImage
            image={item.image}
            priority={priority}
            sizes="(min-width: 1024px) 56vw, (min-width: 768px) 88vw, 92vw"
            className="aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/10]"
          />
          <Reveal y={14}>
            <NewsMeta item={item} className="mt-5 md:mt-6" />
            <div className="mt-3 md:mt-4">{title}</div>
            <p className={`${excerptCls} line-clamp-3`}>{item.excerpt}</p>
            <ReadMore label={readLabel} />
          </Reveal>
        </a>
      </article>
    );

  if (role === "side")
    return (
      <article>
        <a
          href={item.href}
          rel="noopener"
          className={`${link} grid grid-cols-[5.5rem_1fr] items-start gap-4 min-[380px]:grid-cols-[6.5rem_1fr] sm:grid-cols-[8rem_1fr] md:grid-cols-[6.5rem_1fr] lg:block`}
        >
          <NewsImage
            image={item.image}
            sizes="(min-width: 1024px) 30vw, 8rem"
            className="aspect-[4/5]"
            quiet
          />
          <Reveal y={10} className="lg:mt-6">
            <NewsMeta item={item} />
            <div className="mt-2.5 lg:mt-4">{title}</div>
            <p className={`${excerptCls} hidden line-clamp-3 lg:block`}>{item.excerpt}</p>
          </Reveal>
        </a>
      </article>
    );

  if (role === "compact")
    return (
      <article>
        <a
          href={item.href}
          rel="noopener"
          className={`${link} grid grid-cols-[5.5rem_1fr] items-start gap-4 min-[380px]:grid-cols-[6.5rem_1fr] sm:grid-cols-[8rem_1fr] md:grid-cols-[6.5rem_1fr] lg:grid-cols-[5.5rem_1fr] xl:grid-cols-[6.5rem_1fr]`}
        >
          <NewsImage image={item.image} sizes="8rem" className="aspect-square" quiet />
          <Reveal y={10}>
            <NewsMeta item={item} />
            <div className="mt-2.5">{title}</div>
          </Reveal>
        </a>
      </article>
    );

  if (role === "wide")
    return (
      <article>
        <a
          href={item.href}
          rel="noopener"
          className={`${link} md:grid md:grid-cols-12 md:items-center md:gap-x-10`}
        >
          <NewsImage
            image={item.image}
            sizes="(min-width: 768px) 56vw, 92vw"
            className="aspect-[3/2] md:col-span-6 md:aspect-[4/3] lg:col-span-7 lg:aspect-[16/10]"
          />
          <Reveal y={14} className="mt-5 md:col-span-6 md:mt-0 lg:col-span-5">
            <NewsMeta item={item} />
            <div className="mt-3 md:mt-4">{title}</div>
            <p className={`${excerptCls} line-clamp-3`}>{item.excerpt}</p>
            <ReadMore label={readLabel} />
          </Reveal>
        </a>
      </article>
    );

  if (role === "text")
    return (
      <article>
        <a href={item.href} rel="noopener" className={link}>
          <GoldRule className="w-16" />
          <Reveal y={12}>
            <NewsMeta item={item} className="mt-6" />
            <div className="mt-4">{title}</div>
            <p className={`${excerptCls} line-clamp-4`}>{item.excerpt}</p>
            <ReadMore label={readLabel} />
          </Reveal>
        </a>
      </article>
    );

  // feature
  return (
    <article>
      <a href={item.href} rel="noopener" className={link}>
        <NewsImage image={item.image} sizes="(min-width: 1024px) 44vw, 92vw" className="aspect-[3/2]" />
        <Reveal y={12}>
          <NewsMeta item={item} className="mt-5" />
          <div className="mt-3">{title}</div>
          <p className={`${excerptCls} line-clamp-3`}>{item.excerpt}</p>
        </Reveal>
      </a>
    </article>
  );
}
