"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowRight } from "@/components/ui/icons";

const ease = [0.16, 1, 0.3, 1] as const;

/** Colours the typographic quotes of a name line gold. */
function quoted(line: string): ReactNode {
  const m = line.match(/^([„“"]?)(.*?)([“”"]?)$/);
  if (!m) return line;
  return (
    <>
      {m[1] && <span className="text-gold-soft">{m[1]}</span>}
      {m[2]}
      {m[3] && <span className="text-gold-soft">{m[3]}</span>}
    </>
  );
}

/**
 * Editorial identity over the photograph: a light pre-title, the dominant
 * two-line name (second line hung under the first letter), a small
 * institutional signature and a floating admissions card. The photograph keeps
 * the upper two thirds of the frame to itself.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const { hero } = dict;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start start", "end start"]);
  const k = compact ? 0.5 : 1;

  const imgY = useTransform(p, [0, 1], ["0%", compact ? "9%" : "16%"]);
  const imgScale = useTransform(p, [0, 1], [1.04, compact ? 1.12 : 1.2]);
  // Layered drift: the small pre-title travels furthest, the name less, the
  // signature least; everything settles out before the hero leaves.
  const preY = useTransform(p, [0, 1], [0, -150 * k]);
  const nameY = useTransform(p, [0, 1], [0, -90 * k]);
  const sigY = useTransform(p, [0, 1], [0, -50 * k]);
  const typeOpacity = useTransform(p, [0, 0.65], [1, 0]);
  const preOpacity = useTransform(p, [0, 0.45], [1, 0]);
  const cardY = useTransform(p, [0, 0.5], [0, 40 * k]);
  const cardOpacity = useTransform(p, [0, 0.4], [1, 0]);
  const still = reduced;

  // Always animate *to* the visible state: the server renders the start state, and
  // a reduced-motion visitor must still land on the final one (instantly).
  const intro = (delay: number, y = 18) => ({
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: still ? { duration: 0 } : { duration: 1.2, delay, ease },
  });

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[40rem] items-end overflow-hidden bg-green-deep text-ivory"
      style={{ height: "max(40rem, 100svh)" }}
    >
      <motion.div
        className="absolute inset-0 -z-20 will-change-transform"
        style={still ? undefined : { y: imgY, scale: imgScale }}
        initial={still ? false : { opacity: 0.001 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease }}
      >
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="100vw"
          quality={80}
          className="object-cover object-[28%_50%] md:object-[34%_50%] lg:object-[50%_55%]"
        />
      </motion.div>

      {/* Shade only where the type sits (lower band); the rest of the photograph stays open. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(8_30_23/0.9)_0%,rgb(8_30_23/0.55)_28%,rgb(8_30_23/0.12)_52%,rgb(8_30_23/0)_64%)] lg:bg-[linear-gradient(0deg,rgb(8_30_23/0.85)_0%,rgb(8_30_23/0.45)_30%,rgb(8_30_23/0)_58%),linear-gradient(90deg,rgb(8_30_23/0.35)_0%,rgb(8_30_23/0)_45%)]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gold/10 mix-blend-soft-light" />

      {/* Desktop signature: vertical, on the right edge. */}
      <motion.div
        aria-hidden
        className="absolute right-[calc(var(--gutter)*0.55)] top-1/2 hidden -translate-y-1/2 items-center gap-5 lg:flex lg:flex-col"
        style={still ? undefined : { y: sigY, opacity: typeOpacity }}
      >
        <motion.span
          className="h-16 w-px origin-top bg-gold"
          initial={still ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.4, delay: 0.9, ease }}
        />
        <motion.span
          className="text-xs font-normal uppercase tracking-[0.42em] text-ivory [text-shadow:0_1px_14px_rgb(8_30_23/0.85)] [writing-mode:vertical-rl]"
          {...intro(1.1, 0)}
        >
          {hero.signature}
        </motion.span>
      </motion.div>

      <div className="wrap relative pb-[clamp(1.5rem,5vh,3.5rem)] lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:pb-[clamp(2.5rem,7vh,4.5rem)]">
        <h1 id="hero-title" className="display">
          <motion.span
            className="flex items-center gap-4 text-[clamp(0.875rem,0.72rem+0.75vw,1.375rem)] font-light uppercase tracking-[0.42em] text-ivory/90 after:h-px after:w-10 after:bg-gold/80 md:gap-5 md:after:w-16"
            style={still ? undefined : { y: preY, opacity: preOpacity }}
          >
            <motion.span {...intro(0.35, 12)}>{hero.pre}</motion.span>
          </motion.span>

          <motion.span
            className="mt-2 block text-[clamp(3.1rem,16.6vw,7rem)] font-medium uppercase leading-[0.9] tracking-[-0.01em] md:mt-3 lg:text-[clamp(6rem,8.4vw,11.5rem)]"
            style={still ? undefined : { y: nameY, opacity: typeOpacity }}
          >
            {hero.name.map((line, i) => (
              <span className="line-mask" key={line}>
                <motion.span
                  className={`block ${i > 0 ? "pl-[0.42em]" : ""}`}
                  initial={still ? false : { y: "108%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1.3, delay: 0.5 + i * 0.13, ease }}
                >
                  {quoted(line)}
                </motion.span>
              </span>
            ))}
          </motion.span>

          {/* Phone/tablet signature: a quiet line under the name. Desktop shows the vertical one. */}
          <motion.span
            className="mt-4 flex items-center justify-end gap-3 text-[0.625rem] font-normal uppercase tracking-[0.42em] text-ivory/85 before:h-px before:w-8 before:bg-gold/80 md:mt-6 md:text-xs lg:sr-only"
            style={still ? undefined : { y: sigY, opacity: typeOpacity }}
          >
            <motion.span {...intro(1, 0)}>{hero.signature}</motion.span>
          </motion.span>
        </h1>

        <motion.div
          className="mt-7 flex justify-end md:mt-9 lg:mt-0"
          style={still ? undefined : { y: cardY, opacity: cardOpacity }}
        >
          <motion.div {...intro(1.15, 24)} className="w-full max-w-[21rem] md:max-w-[23rem]">
            <Link
              href={hero.admissions.href}
              className="group relative flex items-center gap-5 border border-ivory/15 bg-green-deep/45 px-5 py-4 backdrop-blur-md transition-colors duration-500 hover:border-gold/50 hover:bg-green-deep/70 md:px-6 md:py-5"
            >
              <span aria-hidden className="absolute left-0 top-0 h-px w-12 bg-gold" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.625rem] font-medium uppercase tracking-[0.32em] text-gold-soft md:text-[0.6875rem]">
                  {hero.admissions.kicker}
                </span>
                <span className="mt-1.5 block text-base font-normal leading-snug text-ivory md:text-[1.0625rem]">
                  {hero.admissions.label}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/60 text-gold-soft transition-colors duration-500 group-hover:bg-gold group-hover:text-green-deep"
              >
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
