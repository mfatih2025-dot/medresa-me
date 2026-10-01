"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowRight } from "@/components/ui/icons";

/**
 * Signature moment. A sticky stage is "played" by normal scroll progress —
 * scroll is never intercepted. The four words arrive one by one, the fifteen
 * generations light up, and the campus photograph rises out of the dark until
 * "800+" lands. With reduced motion the finished state is simply shown.
 */
export function Generations({ dict }: { dict: Dictionary }) {
  const g = dict.generations;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const scrollYProgress = useScrollProgress(ref, ["start start", "end end"]);
  const done = useMotionValue(1);
  const p = reduced ? done : scrollYProgress;

  const imgOpacity = useTransform(p, [0, 0.2, 0.85], [0.18, 0.3, 0.5]);
  const imgScale = useTransform(p, [0, 1], [compact ? 1.18 : 1.3, 1.02]);
  const imgY = useTransform(p, [0, 1], ["-3%", "3%"]);
  const shade = useTransform(p, [0.7, 1], [0.55, 0.2]);

  const count = g.words.length;
  const start = 0.06;
  const step = 0.17;

  return (
    <section
      ref={ref}
      aria-labelledby="generations-title"
      className="relative h-[280svh] overflow-x-clip bg-green-deep text-ivory md:h-[360svh] motion-reduce:h-auto md:motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-svh motion-reduce:py-24">
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ opacity: imgOpacity, scale: imgScale, y: imgY }}
        >
          <Image
            src={g.image.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: g.image.position }}
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_60%,rgb(10_42_33/0.88),rgb(10_42_33/0.35)_70%)]"
        />
        <motion.div aria-hidden className="absolute inset-0 bg-green-deep" style={{ opacity: shade }} />

        <div className="wrap relative flex flex-1 flex-col justify-center pt-20 md:pt-32 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-10">
          <div className="lg:col-span-7">
            <p className="eyebrow eyebrow-display mb-6 text-gold md:mb-8">{g.eyebrow}</p>
            <h2
              id="generations-title"
              className="display flex flex-col text-[clamp(2.25rem,0.9rem+6.2vw,7.5rem)] leading-[1.02]"
            >
              {g.words.map((w, i) => (
                <Word key={w} p={p} index={i} start={start} step={step} last={i === count - 1}>
                  {w}
                </Word>
              ))}
            </h2>
          </div>

          <Closing p={p} start={start + step * count - 0.02}>
            <p className="lead max-w-[34em] text-ivory/85">{g.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-5">
              <p className="flex items-baseline gap-3">
                <span className="display text-5xl font-normal text-gold-soft md:text-6xl">{g.total}</span>
                <span className="text-sm text-ivory/80">{g.totalLabel}</span>
              </p>
              <Link
                href={g.cta.href}
                className="btn btn-line text-ivory hover:bg-ivory hover:text-green-deep"
              >
                {g.cta.label}
                <ArrowRight />
              </Link>
            </div>
          </Closing>
        </div>

        <ol
          aria-label="Generacije"
          className="wrap relative flex flex-wrap gap-x-3 gap-y-1 pb-8 pt-6 md:justify-between md:pb-10"
        >
          {g.numerals.map((n, i) => (
            <Numeral key={n} p={p} index={i} total={g.numerals.length}>
              {n}
            </Numeral>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Word({
  p,
  index,
  start,
  step,
  last,
  children,
}: {
  p: MotionValue<number>;
  index: number;
  start: number;
  step: number;
  last: boolean;
  children: string;
}) {
  const a = start + index * step;
  const nextIn = a + step;
  const opacity = useTransform(
    p,
    last ? [a, a + 0.08] : [a, a + 0.08, nextIn, nextIn + 0.08],
    last ? [0, 1] : [0, 1, 1, 0.5],
  );
  const y = useTransform(p, [a, a + 0.1], ["38%", "0%"]);
  return (
    <span className="line-mask">
      <motion.span className={`block ${last ? "italic text-gold-soft" : ""}`} style={{ opacity, y }}>
        {children}
      </motion.span>
    </span>
  );
}

function Closing({
  p,
  start,
  children,
}: {
  p: MotionValue<number>;
  start: number;
  children: React.ReactNode;
}) {
  const opacity = useTransform(p, [start, start + 0.1], [0, 1]);
  const y = useTransform(p, [start, start + 0.1], [24, 0]);
  return (
    <motion.div className="mt-8 md:mt-12 lg:col-span-4 lg:col-start-9 lg:mt-40" style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

function Numeral({
  p,
  index,
  total,
  children,
}: {
  p: MotionValue<number>;
  index: number;
  total: number;
  children: string;
}) {
  const at = 0.06 + (index / total) * 0.7;
  const opacity = useTransform(p, [at, at + 0.04], [0.18, 1]);
  return (
    <motion.li
      style={{ opacity }}
      className="display text-sm font-normal tracking-wide text-gold-soft md:text-base"
    >
      {children}
    </motion.li>
  );
}
