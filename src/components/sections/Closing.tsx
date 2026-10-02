"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";

/**
 * Riječ direktora: the Director's letter over the minaret photograph.
 *
 * A long section with a sticky, viewport-high stage. The photograph keeps its
 * opening clip, slow scale and drift; the letter is read in three steps as the
 * page scrolls past — the opening paragraph arrives as the stage settles, the
 * second while it is held, then the signature. Each step is a short rise with
 * opacity (and a faint blur-to-sharp on larger screens). Scroll is only read,
 * never held. Reduced motion: a normal-height section with the letter shown.
 */
export function Closing({ dict }: { dict: Dictionary }) {
  const { closing } = dict;
  const l = closing.letter;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();

  // Photograph: unchanged mapping over the section's whole pass through the viewport.
  const pass = useScrollProgress(ref, ["start end", "end start"]);
  const clip = useTransform(
    pass,
    [0, 0.38],
    compact
      ? ["inset(10% 5% 10% 5%)", "inset(0% 0% 0% 0%)"]
      : ["inset(14% 10% 14% 10%)", "inset(0% 0% 0% 0%)"],
  );
  const scale = useTransform(pass, [0, 0.6], [1.22, 1.04]);
  const y = useTransform(pass, [0, 1], ["-6%", "8%"]);

  // Letter: arrival (section top rising to the viewport top), then the held stage.
  const arrive = useScrollProgress(ref, ["start end", "start start"]);
  const hold = useScrollProgress(ref, ["start start", "end end"]);
  const done = useMotionValue(1);

  const opening = useStep(arrive, 0.5, 0.95);
  const second = useStep(hold, 0.06, 0.3);
  const signature = useStep(hold, 0.34, 0.58);
  const steps = reduced ? { opening: done, second: done, signature: done } : { opening, second, signature };

  return (
    <section
      ref={ref}
      aria-labelledby="director-title"
      className="relative h-[175svh] bg-green-deep text-ivory md:h-[190svh] lg:h-[200svh] motion-reduce:h-auto md:motion-reduce:h-auto lg:motion-reduce:h-auto"
    >
      <div className="sticky top-0 isolate flex h-svh min-h-[36rem] items-end overflow-hidden md:items-center motion-reduce:relative motion-reduce:h-auto motion-reduce:py-28">
        <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { clipPath: clip }}>
          <motion.div
            className="absolute inset-[-8%] will-change-transform"
            style={reduced ? undefined : { scale, y }}
          >
            <Image
              src={closing.image.src}
              alt={closing.image.alt}
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: closing.image.position }}
            />
          </motion.div>
          {/* Only what the text needs: an even green veil, deeper where the letter sits
              (the lower part on phones, where the letter sits, the left column from tablet up). */}
          <div aria-hidden className="absolute inset-0 bg-[rgb(10_42_33/0.2)] md:bg-[rgb(10_42_33/0.34)]" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(0deg,rgb(8_30_24/0.9)_0%,rgb(8_30_24/0.78)_42%,rgb(8_30_24/0.35)_66%,rgb(8_30_24/0)_84%)] md:bg-[linear-gradient(90deg,rgb(8_30_24/0.84)_0%,rgb(8_30_24/0.66)_42%,rgb(8_30_24/0.14)_72%,rgb(8_30_24/0)_100%)]"
          />
        </motion.div>

        <div className="wrap pb-12 pt-20 md:pb-0 md:pt-24">
          <article className="max-w-[31rem] md:max-w-[34rem] lg:ml-[4%] lg:max-w-[38rem] xl:max-w-[40rem]">
            <Step p={steps.opening} compact={compact}>
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-px w-8 bg-gold md:w-10" />
                <h2 id="director-title" className="eyebrow eyebrow-display text-gold">
                  {l.eyebrow}
                </h2>
              </div>
              <p className="mt-6 text-[1.0625rem] font-light leading-[1.62] text-ivory/95 [text-wrap:pretty] min-[400px]:text-[1.125rem] md:mt-8 md:text-[1.3125rem] md:leading-[1.6] lg:text-[clamp(1.375rem,0.9rem+0.75vw,1.625rem)] [@media(max-height:700px)_and_(max-width:767px)]:text-[1rem]">
                {l.paragraphs[0]}
              </p>
            </Step>

            <Step p={steps.second} compact={compact}>
              <p className="mt-5 text-[1.0625rem] font-light leading-[1.62] text-ivory/95 [text-wrap:pretty] min-[400px]:text-[1.125rem] md:mt-7 md:text-[1.3125rem] md:leading-[1.6] lg:text-[clamp(1.375rem,0.9rem+0.75vw,1.625rem)] [@media(max-height:700px)_and_(max-width:767px)]:text-[1rem]">
                {l.paragraphs[1]}
              </p>
            </Step>

            <Step p={steps.signature} compact={compact}>
              <footer className="mt-8 md:mt-12 lg:mt-14 [@media(max-height:700px)_and_(max-width:767px)]:mt-6">
                <p className="text-[1.0625rem] font-light italic text-ivory/85 min-[400px]:text-[1.125rem] md:text-[1.25rem]">
                  {l.thanks}
                </p>
                <span aria-hidden className="mt-6 block h-px w-12 bg-gold/70 md:mt-8 md:w-16" />
                <p className="mt-5 md:mt-6">
                  <span className="block text-[0.8125rem] font-normal tracking-[0.04em] text-ivory/70 md:text-[0.875rem]">
                    {l.role}
                  </span>
                  <span className="display mt-1.5 block text-[clamp(1.75rem,1.3rem+1.6vw,2.625rem)] font-normal leading-[1.1] tracking-[-0.01em] text-gold-soft">
                    {l.name}
                  </span>
                </p>
              </footer>
            </Step>
          </article>
        </div>
      </div>
    </section>
  );
}

/** 0 → 1 over a stretch of a progress value, eased out so each step settles softly. */
function useStep(p: MotionValue<number>, from: number, to: number) {
  return useTransform(p, [from, to], [0, 1], { ease: (t) => 1 - (1 - t) ** 3 });
}

function Step({ p, compact, children }: { p: MotionValue<number>; compact: boolean; children: ReactNode }) {
  const opacity = p;
  const y = useTransform(p, [0, 1], [compact ? 16 : 24, 0]);
  // Blur only from tablet up, and only while arriving: removed entirely at rest.
  const filter = useTransform(p, (v) => (compact || v >= 1 ? "none" : `blur(${(1 - v) * 4}px)`));
  return <motion.div style={{ opacity, y, filter }}>{children}</motion.div>;
}
