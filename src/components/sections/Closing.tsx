"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useRef, useSyncExternalStore, type ReactNode, type Ref } from "react";
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
  // Opening "frame": the same inset reveal as before, done with transforms instead of
  // clip-path (which repaints every frame): the frame scales open from the inset size
  // while its contents are counter-scaled, so the photograph itself is not distorted.
  const inset = compact ? { x: 0.05, y: 0.1 } : { x: 0.1, y: 0.14 };
  const frameX = useTransform(pass, [0, 0.38], [1 - 2 * inset.x, 1], { clamp: true });
  const frameY = useTransform(pass, [0, 0.38], [1 - 2 * inset.y, 1], { clamp: true });
  const counterX = useTransform(frameX, (v) => 1 / v);
  const counterY = useTransform(frameY, (v) => 1 / v);
  const scale = useTransform(pass, [0, 0.6], [1.22, 1.04]);
  const y = useTransform(pass, [0, 1], ["-6%", "8%"]);

  // Letter: arrival (section top rising to the viewport top), then the held stage.
  const arrive = useScrollProgress(ref, ["start end", "start start"]);
  const hold = useScrollProgress(ref, ["start start", "end end"]);
  const done = useMotionValue(1);

  const opening = useStep(arrive, 0.5, 0.95);
  const second = useStep(hold, 0.06, 0.3);
  const signature = useStep(hold, 0.34, 0.58);

  // Phones: no held stage — the section is as tall as the letter, and each part
  // settles as it rises into the lower third of the screen.
  const phone = usePhone();
  const openingRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const openingIn = useStep(useScrollProgress(openingRef, ["start end", "start 62%"]), 0, 1);
  const secondIn = useStep(useScrollProgress(secondRef, ["start end", "start 66%"]), 0, 1);
  const signatureIn = useStep(useScrollProgress(signatureRef, ["start end", "start 72%"]), 0, 1);

  const steps = reduced
    ? { opening: done, second: done, signature: done }
    : phone
      ? { opening: openingIn, second: secondIn, signature: signatureIn }
      : { opening, second, signature };

  return (
    <section
      ref={ref}
      aria-labelledby="director-title"
      className="relative bg-green-deep text-ivory md:h-[190svh] lg:h-[200svh] md:motion-reduce:h-auto lg:motion-reduce:h-auto"
    >
      <div className="relative isolate overflow-hidden md:sticky md:top-0 md:flex md:h-svh md:min-h-[36rem] md:items-center md:motion-reduce:relative md:motion-reduce:h-auto md:motion-reduce:py-28">
        <motion.div
          className="absolute inset-0 -z-10 overflow-hidden will-change-transform"
          style={reduced ? undefined : { scaleX: frameX, scaleY: frameY }}
        >
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={reduced ? undefined : { scaleX: counterX, scaleY: counterY }}
          >
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
              (top to bottom on phones, where the letter fills the section; the left column from tablet up). */}
            <div aria-hidden className="absolute inset-0 bg-[rgb(10_42_33/0.2)] md:bg-[rgb(10_42_33/0.34)]" />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_30_24/0.5)_0%,rgb(8_30_24/0.68)_30%,rgb(8_30_24/0.72)_70%,rgb(8_30_24/0.55)_100%)] md:bg-[linear-gradient(90deg,rgb(8_30_24/0.84)_0%,rgb(8_30_24/0.66)_42%,rgb(8_30_24/0.14)_72%,rgb(8_30_24/0)_100%)]"
            />
          </motion.div>
        </motion.div>

        <div className="wrap pb-[clamp(3.5rem,9svh,4.5rem)] pt-[clamp(2.25rem,6svh,3rem)] md:pb-0 md:pt-24">
          <article className="max-w-[31rem] md:max-w-[34rem] lg:ml-[4%] lg:max-w-[38rem] xl:max-w-[40rem]">
            <Step ref={openingRef} p={steps.opening} compact={compact}>
              <div className="flex items-center gap-4">
                <span aria-hidden className="h-px w-8 bg-gold md:w-10" />
                <h2 id="director-title" className="eyebrow eyebrow-display text-gold">
                  {l.eyebrow}
                </h2>
              </div>
              <p className="mt-5 text-[1.1875rem] font-light leading-[1.55] text-ivory/95 [text-wrap:pretty] min-[380px]:text-[1.25rem] md:mt-8 md:text-[1.3125rem] md:leading-[1.6] lg:text-[clamp(1.375rem,0.9rem+0.75vw,1.625rem)]">
                {l.paragraphs[0]}
              </p>
            </Step>

            <Step ref={secondRef} p={steps.second} compact={compact}>
              <p className="mt-4 text-[1.1875rem] font-light leading-[1.55] text-ivory/95 [text-wrap:pretty] min-[380px]:text-[1.25rem] md:mt-7 md:text-[1.3125rem] md:leading-[1.6] lg:text-[clamp(1.375rem,0.9rem+0.75vw,1.625rem)]">
                {l.paragraphs[1]}
              </p>
            </Step>

            <Step ref={signatureRef} p={steps.signature} compact={compact}>
              <footer className="mt-7 md:mt-12 lg:mt-14">
                <p className="text-[1.1875rem] font-light italic text-ivory/85 min-[380px]:text-[1.25rem] md:text-[1.25rem]">
                  {l.thanks}
                </p>
                <span aria-hidden className="mt-5 block h-px w-12 bg-gold/70 md:mt-8 md:w-16" />
                {/* Sign-off: role and name on the left, the Director's signature in the
                    space to their right (beside, not beneath), its foot on the name's baseline. */}
                <div className="mt-4 flex items-end justify-between gap-4 md:mt-6 md:justify-start md:gap-10 lg:gap-12">
                  <p>
                    <span className="block text-[0.875rem] font-normal tracking-[0.04em] text-ivory/70">
                      {l.role}
                    </span>
                    <span className="display mt-1.5 block text-[clamp(1.875rem,1.4rem+1.6vw,2.625rem)] font-normal leading-[1.1] tracking-[-0.01em] text-gold-soft">
                      {l.name}
                    </span>
                  </p>
                  <Image
                    src={l.signature.src}
                    alt={l.signature.alt}
                    width={l.signature.width}
                    height={l.signature.height}
                    sizes="(min-width: 1024px) 110px, (min-width: 768px) 96px, 80px"
                    className="-mb-2 h-[5.75rem] w-auto shrink-0 min-[400px]:h-[6.25rem] md:h-[7rem] lg:h-[8rem]"
                  />
                </div>
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

function Step({
  ref,
  p,
  compact,
  children,
}: {
  ref: Ref<HTMLDivElement>;
  p: MotionValue<number>;
  compact: boolean;
  children: ReactNode;
}) {
  const y = useTransform(p, [0, 1], [compact ? 16 : 24, 0]);
  // Blur only from tablet up, and only while arriving: removed entirely at rest.
  const filter = useTransform(p, (v) => (compact || v >= 1 ? "none" : `blur(${(1 - v) * 4}px)`));
  return (
    <motion.div ref={ref} className="will-change-[transform,opacity]" style={{ opacity: p, y, filter }}>
      {children}
    </motion.div>
  );
}

const PHONE = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** Layout-matching phone check (the md breakpoint), known after hydration. */
function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}
