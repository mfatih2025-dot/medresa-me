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
      {m[1] && <span className="mr-[0.04em] font-light text-gold-soft lg:-ml-[0.42em]">{m[1]}</span>}
      {m[2]}
      {m[3] && <span className="ml-[0.03em] font-light text-gold-soft">{m[3]}</span>}
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

      <div className="wrap relative pb-[clamp(1.75rem,5.5vh,3.5rem)] lg:flex lg:items-end lg:justify-between lg:gap-12 lg:pb-[clamp(2.5rem,7vh,4.5rem)]">
        <h1 id="hero-title" className="display min-w-0">
          <motion.span
            className="block text-[clamp(0.8125rem,0.7rem+0.5vw,1.125rem)] font-light uppercase tracking-[0.34em] text-ivory/90"
            style={still ? undefined : { y: preY, opacity: preOpacity }}
          >
            <motion.span className="block" {...intro(0.35, 12)}>
              {hero.pre}
            </motion.span>
          </motion.span>

          {/* One line, always. On desktop the opening quote hangs into the margin so the M aligns with MEDRESA. */}
          <motion.span
            className="mt-2 block whitespace-nowrap text-[clamp(2.125rem,10.2vw,4rem)] font-medium uppercase leading-[1.02] tracking-[-0.005em] md:mt-3 lg:text-[clamp(4rem,6.4vw,8rem)]"
            style={still ? undefined : { y: nameY, opacity: typeOpacity }}
          >
            <span className="line-mask lg:-ml-[0.5em] lg:pl-[0.5em]">
              <motion.span
                className="block"
                initial={still ? false : { y: "108%" }}
                animate={{ y: "0%" }}
                transition={still ? { duration: 0 } : { duration: 1.3, delay: 0.5, ease }}
              >
                {quoted(hero.name)}
              </motion.span>
            </span>
          </motion.span>

          <motion.span
            className="mt-3 block text-[0.6875rem] font-normal uppercase tracking-[0.3em] text-ivory/75 md:mt-4 md:text-xs"
            style={still ? undefined : { y: sigY, opacity: typeOpacity }}
          >
            <motion.span className="block" {...intro(0.9, 8)}>
              {hero.signature}
            </motion.span>
          </motion.span>
        </h1>

        <motion.div
          className="mt-8 md:mt-10 lg:mt-0 lg:shrink-0"
          style={still ? undefined : { y: cardY, opacity: cardOpacity }}
        >
          <motion.div {...intro(1.05, 20)} className="max-w-[26rem] lg:w-[22rem]">
            <Link
              href={hero.admissions.href}
              className="group flex items-center gap-4 rounded-[24px] border border-white/50 bg-ivory/80 px-5 py-4 text-green-deep shadow-[0_18px_44px_-20px_rgb(8_30_23/0.55)] backdrop-blur-xl backdrop-saturate-150 transition-[translate,scale,background-color,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-ivory/[0.88] hover:shadow-[0_22px_50px_-20px_rgb(8_30_23/0.6)] active:scale-[0.985] md:px-6 md:py-[1.125rem]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-deep">
                  {hero.admissions.kicker}
                </span>
                <span className="mt-0.5 block text-[1.0625rem] font-medium leading-snug md:text-lg">
                  {hero.admissions.label}
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="shrink-0 text-green transition-transform duration-300 ease-out group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
