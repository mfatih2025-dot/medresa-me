"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowRight, DocumentIcon } from "@/components/ui/icons";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Cinematic cover. The real campus photograph fills the frame; its sky
 * dissolves into a luminous ivory haze where the identity sits in deep green.
 * The admissions results float as dark glass over the lower photograph.
 * Scroll adds restrained depth only: the photograph scales and drifts, the
 * type lifts away, the glass settles out. No pinning.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const { hero } = dict;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start start", "end start"]);
  // useReducedMotion is known on the first client render, so the entrance never starts for
  // reduced-motion visitors (useMotionProfile settles only after hydration).
  const prefersReduced = useReducedMotion();
  const still = reduced || prefersReduced === true;

  const imgScale = useTransform(p, [0, 1], [1, compact ? 1.06 : 1.1]);
  const imgY = useTransform(p, [0, 1], ["0%", compact ? "8%" : "14%"]);
  // Depth separation: the photograph sinks, the name rises a little, the top line
  // rises least. Opacity holds, then eases out late. Amplitudes in vh scale with
  // the device; phones move less.
  const nameY = useTransform(p, [0, 1], ["0vh", compact ? "-5vh" : "-10vh"]);
  const nameOpacity = useTransform(p, [0.22, 0.62], [1, 0]);
  const lineY = useTransform(p, [0, 1], ["0vh", compact ? "-3vh" : "-6vh"]);
  const lineOpacity = useTransform(p, [0.14, 0.48], [1, 0]);
  const glassY = useTransform(p, [0, 1], [0, compact ? 30 : 60]);
  const glassOpacity = useTransform(p, [0, 0.45], [1, 0]);

  const t = (delay: number, duration = 1.2) => (still ? { duration: 0 } : { duration, delay, ease });
  // Entrance: short rise + blur resolving to sharp; the filter is removed at the end
  // (transitionEnd) so the resting text is never left blurred or rasterised.
  const settle = [0.22, 1, 0.36, 1] as const;
  const labelIn = (delay: number, origin: "left" | "right") => ({
    initial: { opacity: 0, y: 6, scaleX: 1.03, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, scaleX: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } },
    transition: still ? { duration: 0 } : { duration: 0.95, delay, ease: settle },
    style: { transformOrigin: origin },
  });

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="hero-frame relative isolate overflow-hidden bg-ivory"
      style={{ height: "max(36rem, 100svh)" }}
    >
      {/* The photograph, full bleed. */}
      <motion.div
        className="absolute inset-0 -z-20 will-change-transform"
        style={still ? undefined : { scale: imgScale, y: imgY }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={t(0, 1.8)}
        >
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-[30%_62%] md:object-[34%_60%] lg:object-[50%_62%]"
          />
        </motion.div>
      </motion.div>

      {/* Light: ivory haze where the sky is, soft shade under the glass (warm grade is in the image). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(246_246_243/0.97)_0%,rgb(246_246_243/0.86)_19%,rgb(246_246_243/0.45)_32%,rgb(246_246_243/0.1)_42%,rgb(246_246_243/0)_50%)] md:bg-[linear-gradient(180deg,rgb(246_246_243/0.96)_0%,rgb(246_246_243/0.84)_24%,rgb(246_246_243/0.4)_38%,rgb(246_246_243/0)_52%)] lg:bg-[linear-gradient(180deg,rgb(246_246_243/0.94)_0%,rgb(246_246_243/0.68)_28%,rgb(246_246_243/0)_52%),linear-gradient(90deg,rgb(246_246_243/0.5)_0%,rgb(246_246_243/0.22)_32%,rgb(246_246_243/0)_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[40%] bg-[linear-gradient(0deg,rgb(8_26_22/0.42)_0%,rgb(8_26_22/0)_100%)]"
      />

      {/* Identity, in the haze beneath the logo. */}
      <div className="absolute inset-x-[max(var(--gutter),calc((100%-var(--max))/2+var(--gutter)))] top-[clamp(8.5rem,17svh,11rem)] md:top-[clamp(12rem,19svh,14.5rem)] lg:top-[clamp(11.5rem,22svh,15rem)]">
        {/* The group takes the name's width, so the top line spans exactly the name. */}
        <h1 id="hero-title" className="w-fit max-w-full text-green-deep">
          <motion.span
            className="flex items-baseline justify-between gap-6"
            style={still ? undefined : { y: lineY, opacity: lineOpacity }}
          >
            <motion.span
              className="text-[clamp(0.8125rem,0.7rem+0.55vw,1.375rem)] font-light uppercase tracking-[0.42em] text-ink-soft"
              {...labelIn(0.2, "left")}
            >
              {hero.pre}
            </motion.span>
            <motion.span
              className="flex items-center gap-3 text-[0.625rem] font-normal uppercase tracking-[0.3em] text-ink min-[400px]:text-[0.6875rem] md:gap-4 md:text-xs lg:text-[clamp(0.75rem,0.5rem+0.4vw,1rem)]"
              {...labelIn(0.32, "right")}
            >
              <span aria-hidden className="hidden h-px w-8 bg-gold md:block lg:w-10" />
              {hero.signature}
            </motion.span>
          </motion.span>
          <motion.span
            className="mt-1 block pb-[0.18em] pt-[0.08em] -mb-[0.18em] md:mt-2"
            style={still ? undefined : { y: nameY, opacity: nameOpacity }}
          >
            <motion.span
              className="relative block whitespace-nowrap text-[calc((100cqw-2*var(--gutter))/6.95)] font-semibold uppercase leading-[1.02] tracking-[-0.018em] md:text-[calc((100cqw-2*var(--gutter))/7.6)] lg:text-[min(10.5rem,7.4cqw)]"
              initial={{ opacity: 0, y: "0.15em", scale: 0.985, filter: "blur(0.08em)" }}
              animate={{
                opacity: 1,
                y: "0em",
                scale: 1,
                filter: "blur(0em)",
                transitionEnd: { filter: "none" },
              }}
              transition={still ? { duration: 0 } : { duration: 1.5, delay: 0.5, ease: settle }}
            >
              {hero.name}
              {/* Light passing across the letters: the same text, filled only by a narrow
                  ivory/pearl/champagne band clipped to the glyphs (see .hero-sheen). */}
              <span aria-hidden className="hero-sheen absolute inset-0">
                {hero.name}
              </span>
            </motion.span>
          </motion.span>
        </h1>
      </div>

      {/* Admissions results: dark glass over the lower photograph. */}
      <motion.div
        className="absolute inset-x-[max(var(--gutter),calc((100%-var(--max))/2+var(--gutter)))] bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] md:right-auto md:w-[26rem] lg:bottom-[clamp(2rem,6svh,3.5rem)] lg:w-[28rem]"
        style={still ? undefined : { y: glassY, opacity: glassOpacity }}
      >
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={t(1.1, 1.1)}>
          <Link
            href={hero.admissions.href}
            className="group flex items-center gap-3.5 rounded-[22px] border border-white/25 bg-[rgb(16_22_22/0.3)] py-3 pl-4 pr-5 text-ivory min-[380px]:pl-3.5 shadow-[0_14px_40px_-20px_rgb(0_0_0/0.5)] backdrop-blur-2xl backdrop-saturate-[1.4] transition-[background-color,translate,scale] duration-300 ease-out hover:-translate-y-0.5 hover:bg-[rgb(16_22_22/0.42)] active:scale-[0.985] md:gap-4 md:py-3.5 md:pl-4 md:pr-6"
          >
            <span
              aria-hidden
              className="hidden size-10 shrink-0 place-items-center text-gold-soft min-[380px]:grid md:size-11"
            >
              <DocumentIcon width={24} height={24} />
            </span>
            <span aria-hidden className="hidden h-9 w-px shrink-0 bg-white/25 min-[380px]:block" />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-gold-soft">
                {hero.admissions.kicker}
              </span>
              <span className="mt-0.5 block truncate text-base font-normal leading-snug min-[380px]:text-[1.0625rem] md:text-lg">
                {hero.admissions.label}
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="shrink-0 text-ivory/90 transition-transform duration-300 ease-out group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
