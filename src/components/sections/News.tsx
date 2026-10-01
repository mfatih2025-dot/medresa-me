import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/content";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export function News({ dict }: { dict: Dictionary }) {
  const { news } = dict;
  const [lead, second] = news.items;
  return (
    <section
      aria-labelledby="news-title"
      className="relative bg-paper pb-16 pt-14 md:pb-24 md:pt-[4.5rem] lg:pb-28 lg:pt-20"
    >
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b border-ink/15 pb-8">
          <div>
            <Reveal>
              <p className="eyebrow eyebrow-display mb-5 text-gold-deep">{news.eyebrow}</p>
            </Reveal>
            <LineReveal id="news-title" lines={[news.heading]} className="display h-section text-green" />
          </div>
          <Reveal>
            <Link
              href={news.all.href}
              className="link-u inline-flex min-h-12 items-center gap-3 text-[0.9375rem] text-green"
            >
              {news.all.label}
              <ArrowRight />
            </Link>
          </Reveal>
        </div>

        <Reveal>
          <Link
            href={news.notice.href}
            className="group mt-6 flex min-h-14 items-center gap-4 border-b border-gold/50 py-3 text-[0.9375rem] transition-transform duration-150 ease-out active:scale-[0.99]"
          >
            <span className="eyebrow rounded-full bg-gold px-3 py-1.5 text-[0.625rem] text-green-deep">
              {news.notice.label}
            </span>
            <span className="flex-1 font-medium text-green">{news.notice.title}</span>
            <ArrowRight className="shrink-0 text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-14 md:mt-16 lg:grid-cols-12 lg:gap-x-12">
          <Story item={lead} index={1} className="lg:col-span-7" ratio="aspect-[4/3] md:aspect-[16/10]" big />
          <Story
            item={second}
            index={2}
            className="lg:col-span-4 lg:col-start-9 lg:mt-32"
            ratio="aspect-[4/5]"
          />
        </div>
      </div>
    </section>
  );
}

function Story({
  item,
  index,
  className = "",
  ratio,
  big = false,
}: {
  item: Dictionary["news"]["items"][number];
  index: number;
  className?: string;
  ratio: string;
  big?: boolean;
}) {
  return (
    <Reveal className={className}>
      <article>
        <a
          href={item.href}
          rel="noopener"
          className="group block transition-transform duration-150 ease-out active:scale-[0.99]"
        >
          <div className={`relative overflow-hidden bg-sand ${ratio}`}>
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes={big ? "(min-width: 1024px) 58vw, 92vw" : "(min-width: 1024px) 32vw, 92vw"}
              className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
              style={{ objectPosition: item.image.position }}
            />
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm font-normal text-ink-soft">
            <span className="display text-xl font-normal text-gold-deep" aria-hidden>
              {String(index).padStart(2, "0")}
            </span>
            <span className="eyebrow text-[0.6875rem] text-green">{item.category}</span>
            <time dateTime={item.date}>{item.dateLabel}</time>
          </div>
          <h3
            className={`display mt-4 font-normal text-green ${big ? "text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-[1.08]" : "text-[clamp(1.5rem,1.1rem+1.2vw,2.1rem)] leading-[1.12]"}`}
          >
            <span className="link-u">{item.title}</span>
          </h3>
          <p className="mt-4 max-w-[38em] text-ink-soft">{item.excerpt}</p>
        </a>
      </article>
    </Reveal>
  );
}
