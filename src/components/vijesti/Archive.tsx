import Link from "next/link";
import {
  archivePath,
  articlePath,
  excerpt,
  formatDate,
  imageOf,
  pageCount,
  photoOf,
  yearOf,
  type NewsArticle,
} from "@/content/vijesti";
import { newsUi, type NewsUi } from "@/content/vijesti/ui";
import type { Locale } from "@/i18n/config";
import { GoldRule } from "@/components/news/NewsMotion";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";
import { NewsPhoto } from "./Motion";

/*
 * Vijesti: the archive as an edited publication, not a feed of cards.
 *
 * The stories arrive newest first (by date, from the store) and are set by
 * what each one actually has — never by hand:
 *
 *   lead      the newest story: the largest photograph and headline (page 1)
 *   feature   photograph beside its text, sides alternating
 *   wide      a landscape photograph across the page: the photographic moment
 *   compact   up to three stories with images, as an index of rows
 *   text      stories without photographs, led by their headlines
 *
 * Stories with photographs take feature → wide → compact in turn (a wide
 * moment needs a landscape photograph; a graphic is only ever compact);
 * consecutive stories without photographs gather into one text passage. A new
 * year is marked where the archive crosses into it. Twelve stories a page.
 *
 * That sequence is the phone's. From 768px the same stories are set as a
 * front page instead (see Front, below): the lead with the next stories in a
 * rail beside it, then an index of the rest — newest first throughout.
 */

type Block =
  | { kind: "lead"; a: NewsArticle }
  | { kind: "feature"; a: NewsArticle; flip: boolean }
  | { kind: "wide"; a: NewsArticle }
  | { kind: "compact"; list: NewsArticle[] }
  | { kind: "text"; list: NewsArticle[] }
  | { kind: "year"; year: string };

export function compose(items: readonly NewsArticle[], withLead: boolean, prevYear?: string): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  // The year in force: the lead's, or (on a later page) that of the previous page's last story.
  let year = withLead || prevYear === undefined ? (items[0] ? yearOf(items[0]) : "") : prevYear;
  if (withLead && items[0]) {
    blocks.push({ kind: "lead", a: items[0] });
    i = 1;
  }
  let turn = 0;
  let flip = false;
  const sameYear = (a: NewsArticle) => yearOf(a) === year;
  while (i < items.length) {
    const a = items[i];
    if (yearOf(a) !== year) {
      year = yearOf(a);
      blocks.push({ kind: "year", year });
    }
    if (!imageOf(a)) {
      const list: NewsArticle[] = [];
      while (i < items.length && !imageOf(items[i]) && sameYear(items[i])) list.push(items[i++]);
      blocks.push({ kind: "text", list });
      continue;
    }
    const photo = photoOf(a);
    let role = (["feature", "wide", "compact"] as const)[turn % 3];
    if (!photo) role = "compact";
    else if (role === "wide" && photo.height >= photo.width) role = "feature";
    turn++;
    if (role === "compact") {
      const list: NewsArticle[] = [];
      while (i < items.length && list.length < 3 && imageOf(items[i]) && sameYear(items[i]))
        list.push(items[i++]);
      blocks.push({ kind: "compact", list });
      continue;
    }
    if (role === "feature") {
      blocks.push({ kind: "feature", a, flip });
      flip = !flip;
    } else blocks.push({ kind: "wide", a });
    i++;
  }
  return blocks;
}

function DateLine({ a, locale, className = "" }: { a: NewsArticle; locale: Locale; className?: string }) {
  return (
    <time
      dateTime={a.date}
      className={`block text-[0.75rem] font-medium uppercase leading-none tracking-[0.18em] text-gold-deep ${className}`}
    >
      {formatDate(a.date, locale)}
    </time>
  );
}

function ReadMore({ label }: { label: string }) {
  return (
    <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green md:mt-6">
      {label}
      <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
    </span>
  );
}

const press = "group block rounded-[2px] transition-transform duration-150 ease-out active:scale-[0.996]";
const excerptCls = "news-excerpt font-light text-ink-soft";

function Lead({ a, locale, t }: { a: NewsArticle; locale: Locale; t: NewsUi }) {
  const v = a[locale];
  const img = imageOf(a);
  return (
    <article>
      <Link href={articlePath(a, locale)} className={press}>
        {img && (
          <NewsPhoto
            photo={{ ...img, alt: img.alt[locale] }}
            priority
            immediate
            fit={img.graphic ? "contain" : "cover"}
            sizes="(min-width: 1440px) 1340px, 94vw"
            className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
          />
        )}
        <div className="mt-6 md:mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-8">
            <DateLine a={a} locale={locale} />
            <h2 className="news-headline mt-3 text-[clamp(1.625rem,1.1rem+2.3vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-green md:mt-4">
              <span className="link-u">{v.title}</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:pt-7">
            <p
              className={`${excerptCls} mt-4 line-clamp-4 text-[1rem] leading-[1.65] md:text-[1.0625rem] lg:mt-0`}
            >
              {excerpt(v)}
            </p>
            <ReadMore label={t.read} />
          </div>
        </div>
      </Link>
    </article>
  );
}

function Feature({ a, flip, locale, t }: { a: NewsArticle; flip: boolean; locale: Locale; t: NewsUi }) {
  const v = a[locale];
  const img = photoOf(a)!;
  const portrait = img.height > img.width;
  return (
    <article>
      <Link
        href={articlePath(a, locale)}
        className={`${press} md:grid md:grid-cols-12 md:items-center md:gap-x-10 lg:gap-x-14`}
      >
        <NewsPhoto
          photo={{ ...img, alt: img.alt[locale] }}
          sizes="(min-width: 768px) 46vw, 94vw"
          className={`aspect-[4/3] md:col-span-6 ${portrait ? "md:aspect-[4/5]" : "md:aspect-[4/3]"} ${flip ? "md:order-2 md:col-start-7" : ""} ${portrait ? "lg:col-span-4" : ""} ${portrait && flip ? "lg:col-start-9" : ""}`}
        />
        <div
          className={`mt-5 md:col-span-6 md:mt-0 ${portrait ? "lg:col-span-6" : "lg:col-span-5"} ${flip ? "md:order-1 md:col-start-1" : portrait ? "lg:col-start-6" : "lg:col-start-8"}`}
        >
          <DateLine a={a} locale={locale} />
          <h3 className="news-headline mt-3 text-[clamp(1.375rem,1.05rem+1.2vw,2.25rem)] font-medium leading-[1.14] tracking-[-0.015em] text-green">
            <span className="link-u">{v.title}</span>
          </h3>
          <p className={`${excerptCls} mt-4 line-clamp-4 text-[0.9375rem] leading-[1.65] md:text-base`}>
            {excerpt(v)}
          </p>
          <ReadMore label={t.read} />
        </div>
      </Link>
    </article>
  );
}

function Wide({ a, locale }: { a: NewsArticle; locale: Locale }) {
  const v = a[locale];
  const img = photoOf(a)!;
  return (
    <article>
      <Link href={articlePath(a, locale)} className={press}>
        {/* Phones: the photograph runs to the screen's edges. */}
        <div className="-mx-[var(--gutter)] md:mx-0">
          <NewsPhoto
            photo={{ ...img, alt: img.alt[locale] }}
            drift
            sizes="(min-width: 1440px) 1340px, 100vw"
            className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1]"
          />
        </div>
        <div className="mt-5 md:mt-7 lg:grid lg:grid-cols-12 lg:gap-x-12">
          <DateLine a={a} locale={locale} className="lg:col-span-3 lg:pt-3" />
          <h3 className="news-headline mt-3 text-[clamp(1.5rem,1.1rem+1.6vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.018em] text-green lg:col-span-9 lg:mt-0">
            <span className="link-u">{v.title}</span>
          </h3>
        </div>
      </Link>
    </article>
  );
}

function Compact({ list, locale }: { list: NewsArticle[]; locale: Locale }) {
  return (
    <ul className="border-t border-ink/10">
      {list.map((a) => {
        const img = imageOf(a)!;
        return (
          <li key={a.id} className="border-b border-ink/10">
            <Link
              href={articlePath(a, locale)}
              className={`${press} grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-4 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[12rem_minmax(0,1fr)_10rem] md:gap-x-8 md:py-6 lg:grid-cols-[15rem_minmax(0,1fr)_12rem]`}
            >
              <NewsPhoto
                photo={{ ...img, alt: img.alt[locale] }}
                fit={img.graphic ? "contain" : "cover"}
                sizes="(min-width: 1024px) 15rem, (min-width: 768px) 12rem, 9rem"
                className="aspect-[4/3]"
              />
              <div className="min-w-0">
                <DateLine a={a} locale={locale} className="md:hidden" />
                <h3 className="news-headline mt-2 text-[1.0625rem] font-medium leading-[1.25] text-green sm:text-[1.125rem] md:mt-0 md:text-[1.375rem] md:leading-[1.2] md:tracking-[-0.01em]">
                  <span className="link-u">{a[locale].title}</span>
                </h3>
              </div>
              <DateLine a={a} locale={locale} className="hidden text-right md:block" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TextRun({ list, locale, t }: { list: NewsArticle[]; locale: Locale; t: NewsUi }) {
  const single = list.length === 1;
  return (
    <div
      className={
        single
          ? "lg:grid lg:grid-cols-12 lg:gap-x-12"
          : "grid gap-y-10 md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:gap-x-14"
      }
    >
      {list.map((a) => (
        <article key={a.id} className={single ? "lg:col-span-9" : ""}>
          <GoldRule className="w-16 md:w-20" />
          <Link href={articlePath(a, locale)} className={`${press} pt-5`}>
            <DateLine a={a} locale={locale} />
            <h3
              className={`news-headline mt-3 font-medium tracking-[-0.015em] text-green ${
                single
                  ? "text-[clamp(1.5rem,1.1rem+1.6vw,2.625rem)] leading-[1.1]"
                  : "text-[clamp(1.3125rem,1.05rem+0.9vw,1.875rem)] leading-[1.16]"
              }`}
            >
              <span className="link-u">{a[locale].title}</span>
            </h3>
            <p className={`${excerptCls} mt-3 line-clamp-3 text-[0.9375rem] leading-[1.65] md:text-base`}>
              {excerpt(a[locale])}
            </p>
            <ReadMore label={t.read} />
          </Link>
        </article>
      ))}
    </div>
  );
}

function Year({ year }: { year: string }) {
  return (
    <div aria-hidden className="flex items-center gap-5 md:gap-8">
      <span className="display text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] leading-none tracking-[-0.02em] text-gold-deep">
        {year}
      </span>
      <GoldRule className="flex-1" />
    </div>
  );
}

function Pagination({ page, locale, t }: { page: number; locale: Locale; t: NewsUi }) {
  if (pageCount < 2) return null;
  const link = "inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-green";
  return (
    <nav aria-label={t.pages} className="mt-16 border-t border-gold/50 pt-6 md:mt-24 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {page > 1 && (
            <Link href={archivePath(locale, page - 1)} className={`group ${link}`}>
              <ArrowRight className="rotate-180 transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:-translate-x-[5px]" />
              {t.newerPage}
            </Link>
          )}
        </div>
        <ol className="flex items-center gap-1">
          {Array.from({ length: pageCount }, (_, k) => k + 1).map((n) => (
            <li key={n}>
              <Link
                href={archivePath(locale, n)}
                aria-label={t.page(n)}
                aria-current={n === page ? "page" : undefined}
                className={`grid size-11 place-items-center text-[0.9375rem] tabular-nums transition-colors duration-150 ${
                  n === page ? "font-medium text-green" : "text-ink-soft hover:text-green"
                }`}
              >
                <span className={n === page ? "border-b border-gold pb-0.5" : ""}>{n}</span>
              </Link>
            </li>
          ))}
        </ol>
        <div className="min-w-0">
          {page < pageCount && (
            <Link href={archivePath(locale, page + 1)} className={`group ${link}`}>
              {t.olderPage}
              <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px]" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- tablet & desktop
 * A publication's front page, composed from the same stories in the same order:
 *
 *   front    page 1: the lead (photograph, headline, standfirst) with the next
 *            three stories in a rail beside it (below it on tablets)
 *   opener   a later page, or a new year: its first story as a spread
 *   index    the rest, as rows of headline + excerpt with the photograph at
 *            the side; two columns on wide screens
 */

type Section = { year: string; mark: boolean; list: NewsArticle[] };

function sections(items: readonly NewsArticle[], prevYear?: string): Section[] {
  const out: Section[] = [];
  let last = prevYear;
  for (const a of items) {
    const y = yearOf(a);
    if (!out.length || out[out.length - 1].year !== y) {
      out.push({ year: y, mark: last !== undefined && last !== y, list: [] });
    }
    out[out.length - 1].list.push(a);
    last = y;
  }
  return out;
}

function WideLead({ a, locale, t }: { a: NewsArticle; locale: Locale; t: NewsUi }) {
  const v = a[locale];
  const img = imageOf(a);
  return (
    <article className="lg:col-span-8">
      <Link href={articlePath(a, locale)} className={press}>
        {img && (
          <NewsPhoto
            photo={{ ...img, alt: img.alt[locale] }}
            immediate
            fit={img.graphic ? "contain" : "cover"}
            sizes="(min-width: 1440px) 1340px, 94vw"
            className="aspect-[16/9] lg:aspect-[3/2]"
          />
        )}
        <DateLine a={a} locale={locale} className="mt-7 lg:mt-8" />
        <h2 className="news-headline mt-4 max-w-[22em] text-[clamp(2.25rem,1rem+2.6vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.024em] text-green">
          <span className="link-u">{v.title}</span>
        </h2>
        <p className={`${excerptCls} mt-5 max-w-[38em] line-clamp-3 text-[1.0625rem] leading-[1.65] lg:text-[1.125rem]`}>
          {excerpt(v)}
        </p>
        <ReadMore label={t.read} />
      </Link>
    </article>
  );
}

function Rail({ list, locale }: { list: NewsArticle[]; locale: Locale }) {
  return (
    <ol className="mt-12 grid grid-cols-3 gap-x-8 border-t border-gold/50 lg:col-span-4 lg:mt-0 lg:block lg:border-t-0 lg:border-l lg:border-gold/40 lg:pl-10 xl:pl-12">
      {list.map((a, k) => {
        const img = photoOf(a);
        return (
          <li key={a.id} className={`pt-6 lg:pt-0 ${k ? "lg:mt-8 lg:border-t lg:border-ink/10 lg:pt-8" : ""}`}>
            <Link href={articlePath(a, locale)} className={press}>
              {img && (
                <NewsPhoto
                  photo={{ ...img, alt: img.alt[locale] }}
                  sizes="(min-width: 1024px) 22vw, 30vw"
                  className="mb-5 hidden aspect-[16/10] lg:block"
                />
              )}
              <DateLine a={a} locale={locale} />
              <h3 className="news-headline mt-3 text-[1.1875rem] font-medium leading-[1.22] tracking-[-0.01em] text-green xl:text-[1.375rem]">
                <span className="link-u">{a[locale].title}</span>
              </h3>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function Opener({ a, locale, t }: { a: NewsArticle; locale: Locale; t: NewsUi }) {
  const v = a[locale];
  const img = imageOf(a);
  return (
    <article>
      <Link
        href={articlePath(a, locale)}
        className={`${press} ${img ? "grid grid-cols-12 items-center gap-x-10 xl:gap-x-14" : ""}`}
      >
        {img && (
          <NewsPhoto
            photo={{ ...img, alt: img.alt[locale] }}
            fit={img.graphic ? "contain" : "cover"}
            sizes="(min-width: 1024px) 58vw, 94vw"
            className="col-span-12 aspect-[16/10] lg:col-span-6 xl:col-span-7"
          />
        )}
        <div className={img ? "col-span-12 mt-7 lg:col-span-6 lg:mt-0 xl:col-span-5" : "max-w-[46rem]"}>
          <DateLine a={a} locale={locale} />
          <h2 className="news-headline mt-4 text-[clamp(1.875rem,1rem+1.6vw,2.875rem)] font-medium leading-[1.08] tracking-[-0.02em] text-green">
            <span className="link-u">{v.title}</span>
          </h2>
          <p className={`${excerptCls} mt-5 line-clamp-4 text-[1.0625rem] leading-[1.65]`}>{excerpt(v)}</p>
          <ReadMore label={t.read} />
        </div>
      </Link>
    </article>
  );
}

function Index({ list, locale, t }: { list: NewsArticle[]; locale: Locale; t: NewsUi }) {
  return (
    <ul className="grid border-t border-gold/50 xl:grid-cols-2 xl:gap-x-16">
      {list.map((a) => {
        const img = imageOf(a);
        return (
          <li key={a.id} className="border-b border-ink/10">
            <Link
              href={articlePath(a, locale)}
              className={`${press} grid h-full items-start gap-x-8 py-8 ${img ? "grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_15rem] xl:grid-cols-[minmax(0,1fr)_12rem] 2xl:grid-cols-[minmax(0,1fr)_14rem]" : ""}`}
            >
              <div className="min-w-0">
                <DateLine a={a} locale={locale} />
                <h3 className="news-headline mt-3 text-[clamp(1.3125rem,1rem+0.7vw,1.625rem)] font-medium leading-[1.2] tracking-[-0.012em] text-green">
                  <span className="link-u">{a[locale].title}</span>
                </h3>
                <p className={`${excerptCls} mt-3 line-clamp-2 text-[0.9375rem] leading-[1.6] xl:text-base`}>
                  {excerpt(a[locale], 160)}
                </p>
                <span className="sr-only">{t.read}</span>
              </div>
              {img && (
                <NewsPhoto
                  photo={{ ...img, alt: img.alt[locale] }}
                  fit={img.graphic ? "contain" : "cover"}
                  sizes="(min-width: 1024px) 15rem, 13rem"
                  className="aspect-[4/3]"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Front({
  items,
  page,
  prevYear,
  locale,
  t,
}: {
  items: readonly NewsArticle[];
  page: number;
  prevYear?: string;
  locale: Locale;
  t: NewsUi;
}) {
  return (
    <div className="space-y-20 lg:space-y-24">
      {sections(items, page === 1 ? undefined : prevYear).map((sec, k) => {
        const front = page === 1 && k === 0;
        const [first, ...others] = sec.list;
        const rail = front ? others.slice(0, 3) : [];
        const rest = front ? others.slice(3) : others;
        return (
          <div key={sec.year + k} className="space-y-16 lg:space-y-20">
            {sec.mark && <Year year={sec.year} />}
            {front ? (
              <div className="lg:grid lg:grid-cols-12 lg:gap-x-10 xl:gap-x-14">
                <WideLead a={first} locale={locale} t={t} />
                {rail.length > 0 && <Rail list={rail} locale={locale} />}
              </div>
            ) : (
              <Opener a={first} locale={locale} t={t} />
            )}
            {rest.length > 0 && <Index list={rest} locale={locale} t={t} />}
          </div>
        );
      })}
    </div>
  );
}

export function Archive({
  locale,
  page,
  items,
  prevYear,
}: {
  locale: Locale;
  page: number;
  items: readonly NewsArticle[];
  /** Year of the last story on the previous page (so a page opens with its year when it changes). */
  prevYear?: string;
}) {
  const t = newsUi[locale];
  const blocks = compose(items, page === 1, prevYear);
  return (
    <section aria-labelledby="vijesti-title" className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28">
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <div className="flex items-end justify-between gap-6">
          <LineReveal
            as="h1"
            id="vijesti-title"
            immediate
            lines={[t.title]}
            className="display text-[clamp(2.75rem,1.6rem+5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-green"
          />
          {page > 1 && (
            <Reveal variant="label" className="pb-2">
              <p className="text-[0.875rem] tabular-nums text-ink-soft">{t.page(page)}</p>
            </Reveal>
          )}
        </div>
        <GoldRule className="mt-6 w-24 md:mt-8 md:w-32" />
      </header>

      <div className="wrap mt-10 space-y-14 md:hidden">
        {blocks.map((b, k) => {
          switch (b.kind) {
            case "lead":
              return <Lead key={b.a.id} a={b.a} locale={locale} t={t} />;
            case "feature":
              return <Feature key={b.a.id} a={b.a} flip={b.flip} locale={locale} t={t} />;
            case "wide":
              return <Wide key={b.a.id} a={b.a} locale={locale} />;
            case "compact":
              return <Compact key={b.list[0].id} list={b.list} locale={locale} />;
            case "text":
              return <TextRun key={b.list[0].id} list={b.list} locale={locale} t={t} />;
            case "year":
              return <Year key={`y${b.year}-${k}`} year={b.year} />;
          }
        })}
      </div>

      <div className="wrap mt-14 hidden md:block lg:mt-16">
        <Front items={items} page={page} prevYear={prevYear} locale={locale} t={t} />
      </div>

      <div className="wrap">
        <Pagination page={page} locale={locale} t={t} />
      </div>
    </section>
  );
}
