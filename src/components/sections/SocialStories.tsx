"use client";

import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";
import type { Platform, SocialMedia } from "@/lib/social/types";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";
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

const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Medresa iz dana u dan: the two latest stories (Instagram first, Facebook
 * second) as one layered editorial composition.
 *
 * Phones: a short pinned stage. The Instagram story lies on top of the deck
 * with the Facebook story peeking out beneath it; as the page scrolls the top
 * story lifts away and the Facebook story rises into its place. About 60% of a
 * screen of scroll — the page is never held beyond that.
 * Tablet/desktop: no pinning. The Facebook story is a wide panel set back at
 * the upper right; the Instagram story stands in front of its photograph at the
 * lower left. As the composition enters, the back panel slides out from under
 * the front one.
 * Transform/opacity only, driven by scroll MotionValues (no React state).
 * Reduced motion: both stories shown in place, without overlap on phones.
 */
export function SocialStories({
  copy,
  cards,
}: {
  copy: { eyebrow: string; heading: string; lead: string };
  cards: SocialCardData[];
}) {
  const [front, back] = cards;
  const { reduced } = useMotionProfile();
  const phone = usePhone();

  // Phones: progress through the pinned track.
  const track = useRef<HTMLDivElement>(null);
  const t = useTransform(useScrollProgress(track, ["start start", "end end"]), [0.08, 0.9], [0, 1], {
    ease,
  });
  const frontY = useTransform(t, [0, 1], ["0%", "-108%"]);
  const frontScale = useTransform(t, [0, 1], [1, 0.94]);
  const frontOpacity = useTransform(t, [0.55, 1], [1, 0]);
  const frontEvents = useTransform(t, (v) => (v > 0.6 ? "none" : "auto"));
  const backY = useTransform(t, [0, 1], ["15%", "0%"]);
  const backScale = useTransform(t, [0, 1], [0.92, 1]);

  // Tablet/desktop: progress while the composition rises into view.
  const comp = useRef<HTMLDivElement>(null);
  const d = useTransform(useScrollProgress(comp, ["start end", "center 55%"]), [0, 1], [0, 1], { ease });
  const wideFrontY = useTransform(d, [0, 1], [56, 0]);
  const wideBackX = useTransform(d, [0, 1], ["-16%", "0%"]);
  const wideBackY = useTransform(d, [0, 1], [28, 0]);
  const wideBackScale = useTransform(d, [0, 1], [0.96, 1]);

  const frontStyle = reduced
    ? undefined
    : phone
      ? { y: frontY, scale: frontScale, opacity: frontOpacity, pointerEvents: frontEvents }
      : { y: wideFrontY };
  const backStyle = reduced
    ? undefined
    : phone
      ? { y: backY, scale: backScale }
      : { x: wideBackX, y: wideBackY, scale: wideBackScale };

  return (
    <section aria-labelledby="feed-title" className="news-type relative bg-ivory">
      <div className="wrap pt-[calc(var(--section-y)*0.85)]">
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
        <GoldRule className="mt-7 md:mt-10 lg:mt-12" />
      </div>

      {/* Phones: the pinned track. From tablet up it is an ordinary block. */}
      <div ref={track} className="relative h-[160svh] motion-reduce:h-auto md:h-auto">
        <div className="sticky top-0 flex h-svh items-center overflow-hidden pt-14 motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible motion-reduce:py-8 md:static md:block md:h-auto md:overflow-visible md:pb-[var(--section-y)] md:pt-10 lg:pt-14">
          <div className="wrap w-full">
            <div
              ref={comp}
              className="mx-auto grid max-w-[34rem] pb-[18%] md:mx-0 motion-reduce:gap-y-8 motion-reduce:pb-0 md:max-w-[82rem] md:grid-cols-12 md:gap-x-6 md:pb-0 motion-reduce:md:gap-y-0"
            >
              {back && (
                <motion.div
                  className="relative z-0 will-change-transform [grid-area:1/1] md:self-start motion-reduce:[grid-area:auto] md:col-start-4 md:col-end-13 md:row-start-1 lg:col-start-5"
                  style={backStyle}
                >
                  <Story card={back} wide />
                </motion.div>
              )}
              {front && (
                <motion.div
                  className="relative z-10 will-change-transform [grid-area:1/1] md:self-start motion-reduce:row-start-1 motion-reduce:[grid-area:auto] md:col-start-1 md:col-end-8 md:row-start-1 md:mt-[22%] lg:col-end-7 lg:mt-[18%]"
                  style={frontStyle}
                >
                  <Story card={front} primary />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One story as an editorial panel: photograph, quiet metadata, excerpt, link.
 * `wide` (the story set back) lays out photograph | text side by side from
 * tablet up, so its text stays clear of the story in front.
 */
function Story({
  card,
  primary = false,
  wide = false,
}: {
  card: SocialCardData;
  primary?: boolean;
  wide?: boolean;
}) {
  return (
    <article
      className={`h-full overflow-hidden rounded-[2px] md:h-auto bg-paper ring-1 ring-ink/[0.08] ${
        primary
          ? "shadow-[0_1px_2px_rgb(10_42_33/0.06),0_24px_48px_-32px_rgb(10_42_33/0.5)]"
          : "shadow-[0_1px_2px_rgb(10_42_33/0.05)]"
      }`}
    >
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={card.label}
        className={`group flex h-full flex-col md:h-auto ${wide ? "md:grid md:grid-cols-[1.25fr_1fr]" : ""}`}
      >
        {card.media && (
          <div
            className={`relative overflow-hidden bg-sand ${
              wide
                ? "aspect-[4/3] md:aspect-auto md:min-h-[21rem] lg:min-h-[25rem]"
                : "aspect-[4/3] md:aspect-[5/4]"
            }`}
          >
            <Image
              src={card.media.src}
              alt={card.media.alt}
              fill
              sizes={
                wide
                  ? "(min-width: 768px) 38vw, 92vw"
                  : "(min-width: 1024px) 38vw, (min-width: 768px) 52vw, 92vw"
              }
              className="object-cover transition-[scale] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          </div>
        )}
        <div
          className={`px-5 pb-4 pt-4 md:px-6 md:pb-5 md:pt-5 ${wide ? "md:flex md:flex-col md:justify-end md:px-7 md:pb-7" : ""}`}
        >
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
            className={`news-excerpt mt-2.5 line-clamp-3 text-ink [text-wrap:pretty] ${
              primary
                ? "text-[1.0625rem] leading-[1.5] md:text-[1.1875rem]"
                : "text-[1rem] leading-[1.5] md:text-[1.0625rem]"
            }`}
          >
            {card.text}
          </p>
          <span className="mt-2 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green">
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

const PHONE = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}
