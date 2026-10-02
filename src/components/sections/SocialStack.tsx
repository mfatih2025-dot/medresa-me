"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";
import type { Platform, SocialMedia } from "@/lib/social/types";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";
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

const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * Two editorial cards that start as one small stack — the Facebook card lying
 * on the Instagram card, slightly turned — and separate as the section scrolls
 * in: on phones the upper card slides down out from under it, from tablet up it
 * slides out to the side. Transform/opacity only; scroll is only read.
 */
export function SocialStack({
  copy,
  cards,
}: {
  copy: { eyebrow: string; heading: string; lead: string };
  cards: SocialCardData[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionProfile();
  const phone = usePhone();
  const p = useScrollProgress(ref, ["start end", "center 60%"]);
  const spread = useTransform(p, [0.1, 1], [0, 1], { ease });

  // Card under (Instagram): settles from a small lift and turn.
  const aY = useTransform(spread, [0, 1], [phone ? 24 : 32, 0]);
  const aRotate = useTransform(spread, [0, 1], [-2.4, phone ? -0.6 : -1]);
  const aOpacity = useTransform(spread, [0, 0.4], [0.55, 1]);
  // Card on top (Facebook): starts lying on the first, slides out to its place.
  const bX = useTransform(spread, [0, 1], [phone ? "4%" : "-58%", "0%"]);
  const bY = useTransform(spread, [0, 1], [phone ? "-74%" : "-10%", "0%"]);
  const bRotate = useTransform(spread, [0, 1], [3, phone ? 0.8 : 1.2]);
  const bScale = useTransform(spread, [0, 1], [0.95, 1]);

  return (
    <section
      aria-labelledby="feed-title"
      className="relative overflow-x-clip bg-ivory pb-[var(--section-y)] pt-[calc(var(--section-y)*0.85)]"
    >
      <div className="wrap md:grid md:grid-cols-12 md:gap-x-8 lg:gap-x-12">
        <div className="md:col-span-12 lg:col-span-4 lg:pt-10">
          <Reveal variant="label">
            <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{copy.eyebrow}</p>
          </Reveal>
          <LineReveal
            id="feed-title"
            lines={[copy.heading]}
            className="display h-section text-green [text-wrap:balance]"
          />
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[26em] text-[1rem] leading-[1.6] text-ink-soft md:mt-5 md:text-[1.0625rem]">
              {copy.lead}
            </p>
          </Reveal>
        </div>

        <div
          ref={ref}
          className="mt-9 flex flex-col gap-y-5 md:col-span-12 md:mt-12 md:grid md:grid-cols-2 md:gap-x-8 lg:col-span-8 lg:mt-0 lg:gap-x-10"
        >
          {cards.map((card, i) => (
            <Card
              key={card.platform}
              card={card}
              index={i}
              style={
                reduced
                  ? undefined
                  : i === 0
                    ? { y: aY, rotate: aRotate, opacity: aOpacity }
                    : { x: bX, y: bY, rotate: bRotate, scale: bScale }
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({
  card,
  index,
  style,
}: {
  card: SocialCardData;
  index: number;
  style?: Record<string, MotionValue<number> | MotionValue<string>>;
}) {
  return (
    <motion.div
      className={`relative w-[88%] will-change-transform md:w-auto ${
        index === 0 ? "z-0 self-start" : "z-10 self-end md:mt-24 lg:mt-28"
      }`}
      style={style}
    >
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={card.label}
        className="group block rounded-[3px] bg-paper shadow-[0_1px_2px_rgb(10_42_33/0.08),0_22px_48px_-30px_rgb(10_42_33/0.45)] ring-1 ring-ink/[0.07] transition-[scale] duration-150 ease-out active:scale-[0.985]"
      >
        <header className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-5 md:py-4">
          <span className="flex items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-gold-deep">
            <PlatformIcon platform={card.platform} />
            {card.platformLabel}
          </span>
          {card.dateTime ? (
            <time dateTime={card.dateTime} className="text-[0.8125rem] text-ink-soft">
              {card.meta}
            </time>
          ) : (
            <span className="text-[0.8125rem] text-ink-soft">{card.meta}</span>
          )}
        </header>
        {card.media && (
          <div className="relative aspect-[16/11] overflow-hidden bg-sand md:aspect-[5/4]">
            <Image
              src={card.media.src}
              alt={card.media.alt}
              fill
              sizes="(min-width: 1024px) 28vw, (min-width: 768px) 44vw, 80vw"
              className="object-cover transition-[scale] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.035] motion-reduce:group-hover:scale-100"
            />
          </div>
        )}
        <div className="px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
          <p className="line-clamp-3 text-[0.9375rem] leading-[1.55] text-ink [text-wrap:pretty] md:text-base">
            {card.text}
          </p>
          <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green">
            <span className="link-u">{card.action}</span>
            <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
          </span>
        </div>
      </a>
    </motion.div>
  );
}

/** Monochrome platform marks (no brand gradients or blue). */
function PlatformIcon({ platform }: { platform: Platform }) {
  return platform === "instagram" ? (
    <svg
      aria-hidden
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
