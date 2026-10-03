"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Platform, SocialMedia } from "@/lib/social/types";
import { GoldRule } from "@/components/news/NewsMotion";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export type SocialCardData = {
  platform: Platform;
  platformLabel: string;
  url: string;
  /** Formatted date (post) or handle (profile). */
  meta: string;
  dateTime?: string;
  text: string;
  media?: SocialMedia;
  action: string;
  label: string;
};

/**
 * Medresa iz dana u dan: the latest stories (Instagram first, then Facebook) as
 * an editorial carousel. The track is the browser's own horizontal scroller with
 * snap points — native swipe, momentum and trackpad on every device; the arrow
 * buttons scroll it with the platform's smooth scrolling. The active card fills
 * most of the width and the next one peeks in from the right edge of the page.
 * React state changes only when the active card changes, never per frame.
 *
 * Phones: tall cards (photo 4:5) at ~84% of the screen.
 * Tablet: wider cards (photo 3:2).
 * Desktop: each card is a wide panel, photograph left and text right, ~60rem.
 */
export function SocialStories({
  copy,
  cards,
}: {
  copy: { eyebrow: string; heading: string; lead: string };
  cards: SocialCardData[];
}) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const count = cards.length;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const items = [...el.children] as HTMLElement[];
      const max = el.scrollWidth - el.clientWidth;
      // At the end of the track the last card is active even if it cannot reach the start edge.
      const index =
        el.scrollLeft >= max - 4
          ? items.length - 1
          : items.reduce(
              (best, item, i) =>
                Math.abs(item.offsetLeft - el.offsetLeft - el.scrollLeft - pad(el)) <
                Math.abs(items[best].offsetLeft - el.offsetLeft - el.scrollLeft - pad(el))
                  ? i
                  : best,
              0,
            );
      setActive((prev) => (prev === index ? prev : index));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const go = (index: number) => {
    const el = track.current;
    const item = el?.children[index] as HTMLElement | undefined;
    if (!el || !item) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: item.offsetLeft - el.offsetLeft - pad(el), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      aria-labelledby="feed-title"
      className="news-type relative bg-ivory pb-[var(--section-y)] pt-[calc(var(--section-y)*0.85)]"
    >
      <div className="wrap">
        <header className="md:grid md:grid-cols-12 md:items-end md:gap-x-8 lg:gap-x-12">
          <div className="md:col-span-7">
            <Reveal variant="label">
              <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{copy.eyebrow}</p>
            </Reveal>
            <LineReveal
              id="feed-title"
              lines={[copy.heading]}
              className="display h-section text-green [text-wrap:balance]"
            />
          </div>
          <Reveal delay={0.08} className="md:col-span-5 md:pb-2">
            <p className="mt-4 max-w-[24em] text-[1rem] leading-[1.6] text-ink-soft md:mt-0 md:text-[1.0625rem] lg:ml-auto">
              {copy.lead}
            </p>
          </Reveal>
        </header>
        <GoldRule className="mt-8 md:mt-10" />
      </div>

      <Reveal y={18} className="mt-10 md:mt-12">
        {/* The track: full bleed to the right edge, content aligned with the page grid on the left. */}
        <ul
          ref={track}
          aria-label={copy.heading}
          className="social-track flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pl-[var(--track-pad)] pr-[var(--gutter)] [--track-pad:calc(var(--gutter)+max(0px,(100%-var(--max))/2))] [scroll-padding-inline-start:var(--track-pad)] md:gap-6 lg:gap-8"
        >
          {cards.map((card, i) => (
            <li
              key={card.platform}
              aria-label={`${i + 1} / ${count}`}
              className="w-[82vw] max-w-[30rem] shrink-0 snap-start md:w-[64vw] md:max-w-none lg:w-[min(60rem,66vw)]"
            >
              <Story card={card} index={i} />
            </li>
          ))}
        </ul>
      </Reveal>

      {count > 1 && (
        <div className="wrap mt-6 flex items-center justify-between gap-6 md:mt-8">
          <div className="flex items-center gap-4 text-[0.8125rem] tabular-nums text-ink-soft">
            <span aria-live="polite">
              <span className="text-green">{String(active + 1).padStart(2, "0")}</span> /{" "}
              {String(count).padStart(2, "0")}
            </span>
            <span aria-hidden className="relative block h-px w-16 bg-ink/15 md:w-24">
              <span
                className="absolute inset-y-0 left-0 block w-full origin-left bg-gold transition-[scale] duration-500 ease-[var(--ease-out-expo)]"
                style={{ scale: `${(active + 1) / count} 1` }}
              />
            </span>
          </div>
          <div className="flex gap-2.5">
            <NavButton label="Prethodna objava" disabled={active === 0} onClick={() => go(active - 1)} back />
            <NavButton
              label="Sljedeća objava"
              disabled={active >= count - 1}
              onClick={() => go(active + 1)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/** Left padding of the track (the snap edge), in px. */
const pad = (el: HTMLElement) => parseFloat(getComputedStyle(el).paddingLeft) || 0;

function NavButton({
  label,
  disabled,
  onClick,
  back = false,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  back?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full text-green ring-1 ring-ink/15 transition-[background-color,opacity,scale] duration-200 ease-out hover:bg-green/[0.06] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-35"
    >
      <ArrowRight width={16} height={16} className={back ? "rotate-180" : undefined} />
    </button>
  );
}

/** One story: photograph first, then quiet metadata, excerpt and link. */
function Story({ card, index }: { card: SocialCardData; index: number }) {
  return (
    <article className="h-full">
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={card.label}
        draggable={false}
        className="group flex h-full flex-col overflow-hidden rounded-[4px] bg-paper lg:grid lg:grid-cols-[1.45fr_1fr]"
      >
        {card.media && (
          <div className="relative aspect-[4/5] overflow-hidden bg-sand md:aspect-[3/2] lg:aspect-auto lg:min-h-[26rem]">
            <Image
              src={card.media.src}
              alt={card.media.alt}
              fill
              priority={false}
              sizes="(min-width: 1024px) 36rem, (min-width: 768px) 64vw, 82vw"
              className="object-cover transition-[scale] duration-[800ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025] motion-reduce:group-hover:scale-100"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col px-5 pb-5 pt-5 md:px-7 md:pb-6 md:pt-6 lg:justify-between lg:px-9 lg:py-9">
          <div>
            <p className="flex items-center gap-2 text-[0.75rem] text-ink-soft">
              <PlatformIcon platform={card.platform} />
              <span className="font-medium uppercase tracking-[0.16em] text-gold-deep">
                {card.platformLabel}
              </span>
              <span aria-hidden className="text-gold">
                ·
              </span>
              {card.dateTime ? <time dateTime={card.dateTime}>{card.meta}</time> : <span>{card.meta}</span>}
            </p>
            <p
              className={`news-excerpt mt-3 line-clamp-4 font-medium leading-[1.3] tracking-[-0.01em] text-green [text-wrap:pretty] md:mt-4 lg:line-clamp-5 ${
                index === 0
                  ? "text-[1.25rem] md:text-[1.5rem] lg:text-[1.625rem]"
                  : "text-[1.25rem] md:text-[1.375rem] lg:text-[1.5rem]"
              }`}
            >
              {card.text}
            </p>
          </div>
          <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green lg:mt-8">
            <span className="link-u">{card.action}</span>
            <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
          </span>
        </div>
      </a>
    </article>
  );
}

/** Small monochrome platform marks, in gold (no brand colours). */
function PlatformIcon({ platform }: { platform: Platform }) {
  return platform === "instagram" ? (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="text-gold-deep"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-gold-deep"
    >
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
    </svg>
  );
}
