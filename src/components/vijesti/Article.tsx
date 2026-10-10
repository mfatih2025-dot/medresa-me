import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Photo } from "@/content/galerija";
import {
  archivePath,
  articlePath,
  formatDate,
  neighbours,
  pageOf,
  type NewsArticle,
  type NewsPhoto,
} from "@/content/vijesti";
import { newsUi } from "@/content/vijesti/ui";
import type { Locale } from "@/i18n/config";
import { parseBody, placedPhotos, type Block, type Inline } from "@/lib/newsBody";
import { GoldRule } from "@/components/news/NewsMotion";
import { LineReveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";
import { PhotoTile, PhotoViewer } from "./Photos";

/*
 * The news article: one fixed template for every story, migrated or future.
 * An editor supplies title, date, text and photographs; this decides
 * everything else.
 *
 *   ← All news · date        a quiet way back, and when
 *   Title                    the strongest type on the page, set in a mask once
 *   Standfirst               only when the author wrote one
 *   Lead photograph          at its own proportions — never cropped
 *   Text                     one reading column; subheadings, lists, quotations
 *   Photographs              the rest, at their own proportions, in the viewer
 *   Newer · Older            and back to the archive
 *
 * Reading comes first: after the title and the lead photograph nothing moves
 * but the photographs as they arrive. No author is ever shown.
 *
 * Phones and tablets read it as one centred column. From 1280px the page is an
 * editorial spread on a twelve-column grid: the way back and the date stand in
 * a narrow rail on the left (columns 1–3); title, photograph, text and the
 * photographs after it share one left edge in the main column (4–12), where the
 * text keeps a reading measure and the right of the page stays open.
 */

function Text({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return <span key={i}>{n.v}</span>;
          case "strong":
            return (
              <strong key={i} className="font-normal text-ink">
                <Text nodes={n.v} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <Text nodes={n.v} />
              </em>
            );
          case "link": {
            const external = /^https?:\/\//.test(n.href);
            return (
              <a
                key={i}
                href={n.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-green underline decoration-gold/70 decoration-1 underline-offset-[5px] transition-colors hover:decoration-green"
              >
                <Text nodes={n.v} />
              </a>
            );
          }
        }
      })}
    </>
  );
}

const asTile = (a: NewsArticle, p: NewsPhoto, n: number, locale: Locale): Photo & { focus?: string } => ({
  id: `${a.id}-${n}`,
  src: p.src,
  width: p.width,
  height: p.height,
  alt: p.alt[locale],
  source: p.src,
  blur: p.blur ?? "",
});

/** The lead photograph: landscape across the reading measure and beyond; portrait or graphic, held to the screen's height. */
function LeadPhoto({ tile }: { tile: Photo }) {
  const portrait = tile.height >= tile.width;
  return (
    <figure
      className={
        portrait
          ? "mx-auto w-full max-w-[min(100%,calc(78svh*var(--r)))] xl:mx-0"
          : "w-full xl:max-w-[min(100%,calc(80svh*var(--r)))]"
      }
      style={{ "--r": `${tile.width / tile.height}` } as CSSProperties}
    >
      <PhotoTile
        photo={tile}
        priority
        immediate
        sizes={
          portrait
            ? "(min-width: 1024px) 40vw, 94vw"
            : "(min-width: 1280px) 68vw, (min-width: 1024px) 76vw, 94vw"
        }
      />
    </figure>
  );
}

/** Photographs after the text: one at full measure, two side by side, more in balanced columns. */
function Rest({ tiles }: { tiles: Photo[] }) {
  if (!tiles.length) return null;
  if (tiles.length === 1)
    return (
      <div
        className="mx-auto max-w-[min(100%,calc(80svh*var(--r)))]"
        style={{ "--r": `${tiles[0].width / tiles[0].height}` } as CSSProperties}
      >
        <PhotoTile photo={tiles[0]} sizes="(min-width: 1024px) 50vw, 94vw" />
      </div>
    );
  if (tiles.length === 2)
    return (
      <div className="grid grid-cols-2 items-start gap-2 md:gap-4">
        {tiles.map((t) => (
          <PhotoTile key={t.id} photo={t} sizes="(min-width: 1024px) 34vw, 47vw" />
        ))}
      </div>
    );
  return (
    <div className="columns-2 gap-2 md:gap-4 lg:columns-3">
      {tiles.map((t) => (
        <div key={t.id} className="mb-2 break-inside-avoid md:mb-4">
          <PhotoTile photo={t} sizes="(min-width: 1024px) 24vw, 47vw" />
        </div>
      ))}
    </div>
  );
}

function BodyBlock({ b, tiles }: { b: Block; tiles: Photo[] }): ReactNode {
  switch (b.type) {
    case "p":
      return (
        <p>
          <Text nodes={b.content} />
        </p>
      );
    case "h":
      return (
        <h2 className="!mt-12 text-[clamp(1.3125rem,1.1rem+0.7vw,1.625rem)] font-normal leading-[1.25] tracking-[-0.01em] text-green md:!mt-14">
          <Text nodes={b.content} />
        </h2>
      );
    case "ul":
    case "ol": {
      const L = b.type;
      return (
        <L className="space-y-2 border-l border-gold/60 pl-5 md:pl-6">
          {b.items.map((it, i) => (
            <li key={i} className="relative">
              {L === "ol" && <span className="mr-2 tabular-nums text-gold-deep">{i + 1}.</span>}
              <Text nodes={it} />
            </li>
          ))}
        </L>
      );
    }
    case "quote":
      return (
        <blockquote className="!my-10 border-l-2 border-gold pl-5 text-[1.1875em] font-light leading-[1.55] text-green md:pl-7">
          <Text nodes={b.content} />
        </blockquote>
      );
    case "photo": {
      const t = tiles[b.n - 1];
      return t ? (
        <figure className="!my-10 md:!my-12">
          <PhotoTile photo={t} sizes="(min-width: 1024px) 42rem, 94vw" />
        </figure>
      ) : null;
    }
  }
}

export function Article({ a, locale }: { a: NewsArticle; locale: Locale }) {
  const t = newsUi[locale];
  const v = a[locale];
  const tiles = a.photos.map((p, i) => asTile(a, p, i + 1, locale));
  const blocks = parseBody(v.body);
  const placed = placedPhotos(blocks);
  const [lead, ...others] = tiles;
  const rest = others.filter((_, i) => !placed.has(i + 2));
  const { newer, older } = neighbours(a);
  const back = archivePath(locale, pageOf(a));

  return (
    <PhotoViewer photos={tiles} labels={t.lightbox}>
      <article className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28">
        <header className="wrap pt-28 md:pt-40 lg:pt-44">
          <div className="mx-auto max-w-[44rem] md:max-w-[42rem] xl:mx-0 xl:grid xl:max-w-none xl:grid-cols-12 xl:gap-x-12">
            <div className="flex items-center gap-4 xl:col-span-3 xl:flex-col xl:items-start xl:gap-4 xl:pt-[0.6rem]">
              <Link
                href={back}
                className="group -ml-1 inline-flex min-h-11 items-center gap-2 px-1 text-[0.875rem] font-medium text-green"
              >
                <ArrowRight className="rotate-180 transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:-translate-x-[4px]" />
                {t.back}
              </Link>
              <span aria-hidden className="h-px w-6 bg-gold/70 xl:order-first xl:w-10" />
              <time
                dateTime={a.date}
                className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-gold-deep"
              >
                <span className="sr-only">{t.published}: </span>
                {formatDate(a.date, locale)}
              </time>
            </div>
            <LineReveal
              as="h1"
              immediate
              lines={[v.title]}
              className="news-headline mt-5 text-[clamp(1.875rem,1.25rem+2.2vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.022em] text-green md:mt-8 md:text-[clamp(2.625rem,1.3rem+2.6vw,3.5rem)] md:leading-[1.06] xl:col-span-9 xl:col-start-4 xl:mt-0 xl:text-[clamp(3.5rem,1.2rem+3.1vw,4.75rem)] xl:leading-[1.03] xl:tracking-[-0.026em]"
            />
            {v.lead && (
              <p className="news-excerpt mt-5 max-w-[34em] text-[clamp(1.125rem,1rem+0.45vw,1.4375rem)] font-light leading-[1.5] text-ink md:mt-8 xl:col-span-7 xl:col-start-4 xl:mt-9 xl:text-[clamp(1.375rem,0.9rem+0.6vw,1.625rem)] xl:leading-[1.48]">
                {v.lead}
              </p>
            )}
            <div className="xl:col-span-9 xl:col-start-4">
              <GoldRule className="mt-8 w-20 md:mt-10 md:w-28 xl:mt-12" />
            </div>
          </div>
        </header>

        {lead && (
          <div className="wrap mt-8 md:mt-12 xl:mt-14">
            <div className="lg:mx-auto lg:max-w-[76rem] xl:mx-0 xl:grid xl:max-w-none xl:grid-cols-12 xl:gap-x-12">
              <div className="xl:col-span-9 xl:col-start-4">
                <LeadPhoto tile={lead} />
              </div>
            </div>
          </div>
        )}

        <div className="wrap mt-10 md:mt-14 xl:mt-16">
          <div className="xl:grid xl:grid-cols-12 xl:gap-x-12">
            <div className="news-body hist-text mx-auto max-w-[44rem] space-y-6 text-[1.0625rem] font-light leading-[1.75] text-ink md:max-w-[42rem] md:text-[1.1875rem] md:leading-[1.78] xl:col-span-7 xl:col-start-4 xl:mx-0 xl:max-w-[42rem] xl:text-[1.25rem] xl:leading-[1.75]">
              {blocks.map((b, i) => (
                <BodyBlock key={i} b={b} tiles={tiles} />
              ))}
            </div>
          </div>
        </div>

        {rest.length > 0 && (
          <section aria-label={t.photos} className="wrap mt-14 md:mt-20 xl:mt-24">
            <div className="mx-auto max-w-[76rem] xl:mx-0 xl:grid xl:max-w-none xl:grid-cols-12 xl:gap-x-12">
              <div className="xl:col-span-9 xl:col-start-4">
              <div className="mb-5 flex items-baseline justify-between gap-4 md:mb-7">
                <h2 className="eyebrow text-gold-deep">{t.photos}</h2>
                <p className="text-[0.8125rem] tabular-nums text-ink-soft">{t.photoCount(rest.length)}</p>
              </div>
              <Rest tiles={rest} />
              </div>
            </div>
          </section>
        )}

        <footer className="wrap mt-16 md:mt-24 xl:mt-32">
          <div className="mx-auto max-w-[76rem] border-t border-gold/50 pt-6 md:pt-8 xl:mx-0 xl:max-w-none xl:pt-10">
            <div className="grid gap-y-6 md:grid-cols-2 md:gap-x-12 xl:gap-x-24">
              {newer ? (
                <Neighbour a={newer} label={t.newer} locale={locale} />
              ) : (
                <span className="hidden md:block" />
              )}
              {older && <Neighbour a={older} label={t.older} locale={locale} right />}
            </div>
            <Link
              href={back}
              className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-green md:mt-10"
            >
              <ArrowRight className="rotate-180 transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:-translate-x-[5px]" />
              {t.back}
            </Link>
          </div>
        </footer>
      </article>
    </PhotoViewer>
  );
}

function Neighbour({
  a,
  label,
  locale,
  right = false,
}: {
  a: NewsArticle;
  label: string;
  locale: Locale;
  right?: boolean;
}) {
  return (
    <Link href={articlePath(a, locale)} className={`group block ${right ? "md:text-right" : ""}`}>
      <span className="block text-[0.75rem] font-medium uppercase tracking-[0.18em] text-gold-deep">
        {label}
      </span>
      <span
        className={`news-headline mt-2 block text-[1.0625rem] font-medium leading-[1.3] text-green md:text-[1.1875rem] xl:mt-3 xl:max-w-[26em] xl:text-[1.5rem] xl:leading-[1.25] ${right ? "xl:ml-auto" : ""}`}
      >
        <span className="link-u">{a[locale].title}</span>
      </span>
      <time dateTime={a.date} className="mt-2 block text-[0.8125rem] text-ink-soft">
        {formatDate(a.date, locale)}
      </time>
    </Link>
  );
}
