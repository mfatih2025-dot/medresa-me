"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import type { Dictionary } from "@/content";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { ArrowRight } from "@/components/ui/icons";

type Card = Dictionary["life"]["stack"]["cards"][number];

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/*
 * The composition at rest (spread). Each photograph has its own place per
 * breakpoint — phones get a tight, tall deck; tablets a wider fan; desktop a
 * cinematic spread — plus where it starts in the compressed stack (x/y in % of
 * its own size, rotation in degrees), its resting tilt, and how far it drifts
 * as the stack leaves (depth, px).
 */
const deck = [
  {
    place: "left-0 top-0 w-[56%] aspect-[4/5] md:w-[40%] lg:left-[7%] lg:top-[9%] lg:w-[25%] lg:aspect-[4/5]",
    label: "top",
    align: "",
    from: { x: 24, y: 34, r: -1 },
    fromWide: { x: 58, y: 24, r: -1 },
    rest: -3,
    depth: -26,
  },
  {
    place:
      "right-0 top-[3%] w-[50%] aspect-[3/4] md:right-[5%] md:top-[4%] md:w-[38%] md:aspect-[4/3] lg:left-[30%] lg:right-auto lg:top-0 lg:w-[21%] lg:aspect-[3/4]",
    label: "top",
    align: "",
    from: { x: -22, y: 30, r: 1.5 },
    fromWide: { x: 22, y: 34, r: 1.5 },
    rest: 2.5,
    depth: 18,
  },
  {
    place:
      "left-[3%] bottom-0 w-[44%] aspect-square md:left-[6%] md:w-[30%] md:aspect-[5/4] lg:left-[57%] lg:right-auto lg:top-[4%] lg:bottom-auto lg:w-[29%] lg:aspect-[4/3]",
    label: "bottom",
    align: "lg:text-right",
    from: { x: 18, y: -36, r: 1 },
    fromWide: { x: -46, y: 34, r: 1 },
    rest: -2,
    depth: -14,
  },
  {
    place:
      "right-0 bottom-[3%] w-[48%] aspect-[4/3] md:bottom-[5%] md:w-[40%] lg:left-[60%] lg:right-auto lg:bottom-[2%] lg:w-[27%] lg:aspect-[5/4]",
    label: "bottom",
    align: "lg:text-right",
    from: { x: -20, y: -34, r: -1 },
    fromWide: { x: -44, y: -30, r: -1 },
    rest: 3,
    depth: 24,
  },
] as const;

/**
 * Život u Medresi: one physical stack. A deep-green card carries the words; four
 * photographs of everyday life lie behind it. As the section scrolls in, the
 * stack — compressed at first, almost one object — spreads: each photograph
 * slides out from under the green card at its own pace and settles at a slight
 * tilt, revealing more of itself. As it leaves, the layers drift apart in depth.
 * Scroll is only read, never held; everything is transform/opacity.
 */
export function LifeStack({ dict }: { dict: Dictionary }) {
  const { life } = dict;
  const s = life.stack;
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  // 0: stack's top at the viewport bottom · 1: its bottom at the viewport top.
  const p = useScrollProgress(ref, ["start end", "end start"]);
  // Spread while the stack rises into view; drift apart as it leaves.
  const spread = useTransform(p, [0.08, 0.48], [0, 1], { ease: easeOut });
  const leave = useTransform(p, [0.5, 1], [0, 1]);

  const cardY = useTransform(spread, [0, 1], ["9%", "0%"]);
  const cardScale = useTransform(spread, [0, 1], [0.965, 1]);
  const cardDrift = useTransform(leave, [0, 1], [0, compact ? -22 : -44]);

  return (
    <section
      aria-labelledby="life-title"
      className="relative overflow-x-clip bg-ivory pb-[calc(var(--section-y)*0.9)] pt-[calc(var(--section-y)*0.45)] lg:pb-[var(--section-y)] lg:pt-[calc(var(--section-y)*0.35)]"
    >
      <div className="wrap">
        <div
          ref={ref}
          className="relative mx-auto h-[clamp(34rem,142vw,37.5rem)] max-w-[34rem] md:h-[43rem] md:max-w-none lg:h-[clamp(36rem,47vw,44rem)]"
        >
          {deck.map((d, i) => (
            <Photo
              key={s.cards[i].label}
              card={s.cards[i]}
              d={d}
              z={i}
              spread={spread}
              leave={leave}
              compact={compact}
              still={reduced}
            />
          ))}

          {/* The green card: the stack's top layer. */}
          <motion.div
            className="absolute inset-x-[5%] top-[35%] z-10 md:inset-x-auto md:left-[22%] md:top-[27%] md:w-[56%] lg:left-[23%] lg:top-[34%] lg:w-[40%]"
            style={reduced ? undefined : { y: cardDrift }}
          >
            <motion.div
              className="relative overflow-hidden rounded-[26px] bg-green-deep p-6 text-ivory shadow-[0_40px_80px_-36px_rgb(10_42_33/0.65),0_2px_6px_rgb(10_42_33/0.18)] min-[400px]:p-7 md:rounded-[30px] md:p-10 lg:rounded-[34px] lg:p-12"
              style={reduced ? undefined : { y: cardY, scale: cardScale }}
            >
              <div
                aria-hidden
                className="geo pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-screen"
              />
              <div className="relative">
                <p className="eyebrow eyebrow-display text-gold">{life.eyebrow}</p>
                <h2
                  id="life-title"
                  className="display mt-4 text-[clamp(2.125rem,1.4rem+3.2vw,3.75rem)] leading-[1.02] md:mt-5"
                >
                  {s.heading}
                </h2>
                <p className="mt-4 max-w-[30em] text-[0.9375rem] leading-[1.6] text-ivory/80 md:mt-5 md:text-base">
                  {s.text}
                </p>
                <Link
                  href={s.cta.href}
                  className="group mt-5 inline-flex min-h-11 items-center gap-2.5 text-[0.9375rem] text-gold-soft md:mt-7"
                >
                  <span className="link-u">{s.cta.label}</span>
                  <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Photo({
  card,
  d,
  z,
  spread,
  leave,
  compact,
  still,
}: {
  card: Card;
  d: (typeof deck)[number];
  z: number;
  spread: MotionValue<number>;
  leave: MotionValue<number>;
  compact: boolean;
  still: boolean;
}) {
  const from = compact ? d.from : d.fromWide;
  const x = useTransform(spread, [0, 1], [`${from.x}%`, "0%"]);
  const y = useTransform(spread, [0, 1], [`${from.y}%`, "0%"]);
  const rotate = useTransform(spread, [0, 1], [from.r, compact ? d.rest * 0.7 : d.rest]);
  const inner = useTransform(spread, [0, 1], [1.12, 1]);
  const drift = useTransform(leave, [0, 1], [0, compact ? d.depth * 0.5 : d.depth]);

  return (
    <motion.div className={`absolute ${d.place}`} style={{ zIndex: z, ...(still ? {} : { y: drift }) }}>
      <motion.figure
        className="relative h-full w-full overflow-hidden rounded-[20px] bg-sand shadow-[0_28px_56px_-30px_rgb(10_42_33/0.5),0_1px_3px_rgb(10_42_33/0.12)] [clip-path:inset(0_round_20px)] md:rounded-[24px] md:[clip-path:inset(0_round_24px)] lg:rounded-[28px] lg:[clip-path:inset(0_round_28px)]"
        style={still ? { rotate: compact ? d.rest * 0.7 : d.rest } : { x, y, rotate }}
      >
        <motion.div className="absolute inset-0" style={still ? undefined : { scale: inner }}>
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 56vw"
            className="object-cover"
            style={{ objectPosition: card.image.position }}
          />
        </motion.div>
        <figcaption
          className={`absolute inset-x-0 ${d.label === "top" ? "top-0 bg-[linear-gradient(180deg,rgb(8_26_22/0.42),transparent)]" : "bottom-0 bg-[linear-gradient(0deg,rgb(8_26_22/0.42),transparent)]"} ${d.align} px-4 py-3.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ivory md:px-5 md:py-4 md:text-[0.6875rem]`}
        >
          {card.label}
        </figcaption>
      </motion.figure>
    </motion.div>
  );
}
