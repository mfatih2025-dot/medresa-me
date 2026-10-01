"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform } from "framer-motion";
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
  const still = reduced;

  const imgScale = useTransform(p, [0, 1], [1, compact ? 1.06 : 1.1]);
  const imgY = useTransform(p, [0, 1], ["0%", compact ? "8%" : "14%"]);
  const typeY = useTransform(p, [0, 1], [0, compact ? -60 : -120]);
  const typeOpacity = useTransform(p, [0, 0.55], [1, 0]);
  const glassY = useTransform(p, [0, 1], [0, compact ? 30 : 60]);
  const glassOpacity = useTransform(p, [0, 0.45], [1, 0]);

  const t = (delay: number, duration = 1.2) => (still ? { duration: 0 } : { duration, delay, ease });

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
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(247_243_234/0.97)_0%,rgb(247_243_234/0.86)_19%,rgb(247_243_234/0.45)_32%,rgb(247_243_234/0.1)_42%,rgb(247_243_234/0)_50%)] md:bg-[linear-gradient(180deg,rgb(247_243_234/0.96)_0%,rgb(247_243_234/0.84)_24%,rgb(247_243_234/0.4)_38%,rgb(247_243_234/0)_52%)] lg:bg-[linear-gradient(180deg,rgb(247_243_234/0.94)_0%,rgb(247_243_234/0.68)_28%,rgb(247_243_234/0)_52%),linear-gradient(90deg,rgb(247_243_234/0.5)_0%,rgb(247_243_234/0.22)_32%,rgb(247_243_234/0)_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[40%] bg-[linear-gradient(0deg,rgb(8_30_23/0.5)_0%,rgb(8_30_23/0)_100%)]"
      />

      {/* Identity, in the haze beneath the logo. */}
      <motion.div
        className="absolute inset-x-[var(--gutter)] top-[clamp(9.5rem,19svh,12rem)] md:top-[clamp(13.5rem,21svh,16rem)] lg:top-[clamp(13rem,25svh,17rem)]"
        style={still ? undefined : { y: typeY, opacity: typeOpacity }}
      >
        <h1 id="hero-title" className="text-green-deep">
          <motion.span
            className="block text-[clamp(0.8125rem,0.7rem+0.55vw,1.375rem)] font-light uppercase tracking-[0.42em] text-ink-soft"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.3, 1)}
          >
            {hero.pre}
          </motion.span>
          <span className="line-mask mt-1 md:mt-2">
            <motion.span
              className="block whitespace-nowrap text-[calc((100cqw-2*var(--gutter))/6.95)] font-semibold uppercase leading-[1.02] tracking-[-0.018em] md:text-[calc((100cqw-2*var(--gutter))/7.6)] lg:text-[min(10.5rem,7.4cqw)]"
              initial={{ y: "108%" }}
              animate={{ y: "0%" }}
              transition={t(0.4, 1.35)}
            >
              {hero.name}
            </motion.span>
          </span>
          <motion.span
            className="mt-3 flex items-center gap-4 text-[0.6875rem] font-normal uppercase tracking-[0.34em] text-ink md:mt-5 md:gap-5 md:text-xs lg:text-[clamp(0.75rem,0.5rem+0.4vw,1rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.9)}
          >
            <span aria-hidden className="h-px w-10 bg-gold md:w-14" />
            {hero.signature}
          </motion.span>
        </h1>
      </motion.div>

      {/* Admissions results: dark glass over the lower photograph. */}
      <motion.div
        className="absolute inset-x-[var(--gutter)] bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] md:right-auto md:w-[26rem] lg:bottom-[clamp(2rem,6svh,3.5rem)] lg:w-[28rem]"
        style={still ? undefined : { y: glassY, opacity: glassOpacity }}
      >
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={t(1.1, 1.1)}>
          <Link
            href={hero.admissions.href}
            className="group flex items-center gap-3.5 rounded-[22px] border border-white/25 bg-[rgb(20_42_32/0.36)] py-3 pl-4 pr-5 text-ivory min-[380px]:pl-3.5 shadow-[0_14px_40px_-20px_rgb(0_0_0/0.5)] backdrop-blur-2xl backdrop-saturate-150 transition-[background-color,translate,scale] duration-300 ease-out hover:-translate-y-0.5 hover:bg-[rgb(20_42_32/0.48)] active:scale-[0.985] md:gap-4 md:py-3.5 md:pl-4 md:pr-6"
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
