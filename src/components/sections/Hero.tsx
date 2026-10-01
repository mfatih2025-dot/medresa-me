"use client";

import Image from "next/image";
import Link from "next/link";
import {
  cubicBezier,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowUpRight } from "@/components/ui/icons";

const ease = [0.16, 1, 0.3, 1] as const;
/** Portal expansion easing: unhurried start, long soft landing. */
const portalEase = cubicBezier(0.55, 0, 0.25, 1);
/** Share of the pinned scroll spent opening the portal; the rest holds the full image. */
const OPEN_END = 0.8;

/** Resting geometry of the portal, measured from CSS (see .hero-stage in globals.css). */
type Geo = {
  w: number; // stage size
  h: number;
  left: number; // arch sides at rest
  right: number;
  apex: number; // y of the arch apex at rest
  k: number; // arc radius as a fraction of the arch width
  shift: number; // photo offset at rest, px
};

/** Two-centred pointed arch (the profile of the building's entrance), grounded below the stage. */
function archPath(g: Geo, e: number) {
  const xL = g.left * (1 - e);
  const xR = g.right + (g.w - g.right) * e;
  const width = xR - xL;
  const r = g.k * width;
  const rise = Math.sqrt(r * r - (r - width / 2) ** 2);
  // Springing line at rest sits one "rise" under the apex; it travels up to the
  // top edge, so the opening finally exceeds the frame and the camera passes through.
  const rest = g.right - g.left;
  const r0 = g.k * rest;
  const spring0 = g.apex + Math.sqrt(r0 * r0 - (r0 - rest / 2) ** 2);
  // The lift lags the widening slightly so the opening is felt before it clears the frame.
  const ys = spring0 * (1 - Math.pow(e, 1.5));
  const f = (n: number) => n.toFixed(2);
  const b = g.h + 2;
  return `path('M ${f(xL)} ${f(b)} L ${f(xL)} ${f(ys)} A ${f(r)} ${f(r)} 0 0 1 ${f((xL + xR) / 2)} ${f(ys - rise)} A ${f(r)} ${f(r)} 0 0 1 ${f(xR)} ${f(ys)} L ${f(xR)} ${f(b)} Z')`;
}

/**
 * THE ARCHITECTURAL PORTAL. An ivory editorial opening with the institution's
 * name; the campus photograph lives inside a tall pointed arch taken from the
 * building's own entrance. A pinned, scroll-driven sequence (normal scrolling,
 * nothing intercepted) widens and lifts the arch until it passes beyond the
 * frame — the visitor enters through it — and only then offers the admissions
 * results. All motion is motion values → clip-path / transform / opacity.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const { hero } = dict;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLAnchorElement>(null);
  const { reduced, compact } = useMotionProfile();

  const progress = useScrollProgress(sectionRef, ["start start", "end end"]);
  const rest = useMotionValue(0);
  const p = reduced ? rest : progress;
  const geo = useMotionValue<Geo | null>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const target = targetRef.current;
    if (!stage || !target) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const cs = getComputedStyle(stage);
      const left = t.left - s.left;
      geo.set({
        w: s.width,
        h: s.height,
        left,
        right: t.right - s.left,
        apex: t.top - s.top,
        k: parseFloat(cs.getPropertyValue("--arch-k")) || 0.66,
        shift: (parseFloat(cs.getPropertyValue("--portal-shift")) || 0) * left,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [geo]);

  // e: eased opening of the portal (0 = at rest, 1 = beyond the frame).
  const e = useTransform(p, [0, OPEN_END], [0, 1], { ease: portalEase, clamp: true });
  const clip = useTransform([e, geo] as MotionValue[], ([v, g]) =>
    g ? archPath(g as Geo, v as number) : "inset(100% 0 0 0)",
  );
  // Depth: the scene behind the portal grows more slowly than the opening.
  const imgScale = useTransform(e, [0, 1], [1, compact ? 1.06 : 1.1]);
  const imgX = useTransform([e, geo] as MotionValue[], ([v, g]) =>
    g ? (g as Geo).shift * (1 - (v as number)) : 0,
  );
  const endShade = useTransform(e, [0.6, 1], [0, 1]);

  // Typography recedes behind the opening portal.
  const typeY = useTransform(e, [0, 0.45], [0, compact ? -36 : -64]);
  const typeOpacity = useTransform(e, [0, 0.32], [1, 0]);

  // Admissions strip arrives only once the visitor is inside.
  const shown = useMotionValue(1);
  const stripIn = useTransform(p, [OPEN_END + 0.01, 0.93], [0, 1], { clamp: true });
  const stripOpacity = reduced ? shown : stripIn;
  const stripY = useTransform(stripOpacity, [0, 1], [10, 0]);
  useMotionValueEvent(stripOpacity, "change", (v) => {
    if (stripRef.current) stripRef.current.style.pointerEvents = v > 0.6 ? "auto" : "none";
  });

  // Keyboard users tabbing to the strip are carried to the end of the sequence.
  const revealStrip = () => {
    const s = sectionRef.current;
    if (reduced || !s || stripOpacity.get() > 0.6) return;
    const top = s.getBoundingClientRect().top + window.scrollY + s.offsetHeight - window.innerHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative h-[210svh] bg-ivory md:h-[240svh] lg:h-[270svh] motion-reduce:h-auto md:motion-reduce:h-auto lg:motion-reduce:h-auto"
    >
      <div
        ref={stageRef}
        className="hero-stage sticky top-0 h-svh min-h-[34rem] overflow-hidden motion-reduce:relative"
      >
        <div ref={targetRef} className="portal-target" aria-hidden />

        {/* Identity on the ivory page. Sits beneath the portal, which rises over it. */}
        <motion.div
          className="absolute inset-x-[var(--gutter)] bottom-[calc(100cqh-var(--portal-top)+1.75rem)] lg:bottom-[calc(100cqh-var(--portal-spring))] lg:right-auto"
          style={{ y: typeY, opacity: typeOpacity }}
        >
          <h1 id="hero-title" className="relative text-green-deep">
            <motion.span
              className="block text-[clamp(0.75rem,0.66rem+0.45vw,1.0625rem)] font-light uppercase tracking-[0.4em] text-ink-soft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 1.1, delay: 0.25, ease }}
            >
              {hero.pre}
            </motion.span>
            <span className="line-mask mt-1.5 md:mt-2.5">
              <motion.span
                className="block whitespace-nowrap text-[min(4.5rem,calc((100cqw-2*var(--gutter))/6.9))] font-medium uppercase leading-[1.04] tracking-[-0.012em] lg:text-[min(8.75rem,calc((var(--portal-left)-var(--gutter)-3.5cqw)/6.5))]"
                initial={{ y: "108%" }}
                animate={{ y: "0%" }}
                transition={reduced ? { duration: 0 } : { duration: 1.3, delay: 0.38, ease }}
              >
                {hero.name}
              </motion.span>
            </span>
            <motion.span
              className="mt-2.5 block text-[0.6875rem] font-normal uppercase tracking-[0.32em] text-gold-deep md:mt-3.5 md:text-xs lg:absolute lg:top-full lg:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 1.2, delay: 0.85, ease }}
            >
              {hero.signature}
            </motion.span>
          </h1>
        </motion.div>

        {/* The portal: the photograph, clipped to the arch. */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: clip }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 1.4, delay: 0.15, ease }}
        >
          <motion.div className="absolute inset-0 will-change-transform" style={{ x: imgX, scale: imgScale }}>
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="100vw"
              quality={80}
              className="object-cover object-[30%_50%] lg:object-[50%_55%]"
            />
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(0deg,rgb(8_30_23/0.45)_0%,rgb(8_30_23/0)_32%)]"
            style={{ opacity: endShade }}
          />
        </motion.div>

        {/* Admissions results: a quiet strip, revealed once inside. */}
        <motion.div
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 lg:bottom-[clamp(1.5rem,4cqh,2.75rem)] lg:left-auto lg:right-[calc(var(--gutter)+1.25rem)] lg:translate-x-0"
          style={{ opacity: stripOpacity, y: stripY }}
        >
          <Link
            ref={stripRef}
            href={hero.admissions.href}
            onFocus={revealStrip}
            style={{ pointerEvents: reduced ? "auto" : "none" }}
            className="group flex items-center gap-4 whitespace-nowrap rounded-[14px] border border-white/20 bg-[rgb(10_42_33/0.3)] py-2.5 pl-4 pr-3.5 text-ivory backdrop-blur-xl backdrop-saturate-150 transition-[background-color,scale] duration-300 ease-out hover:bg-[rgb(10_42_33/0.42)] active:scale-[0.985] md:gap-5 md:py-3 md:pl-5 md:pr-4"
          >
            <span className="flex flex-col min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:gap-4 md:gap-5">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-soft">
                {hero.admissions.kicker}
              </span>
              <span className="text-[0.9375rem] font-normal leading-snug">{hero.admissions.label}</span>
            </span>
            <ArrowUpRight
              aria-hidden
              className="shrink-0 text-ivory/90 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
