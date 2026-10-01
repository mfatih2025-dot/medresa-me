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
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowUpRight } from "@/components/ui/icons";

const ease = [0.16, 1, 0.3, 1] as const;
/** Expansion easing: a patient start, a long soft landing. */
const openEase = cubicBezier(0.6, 0, 0.2, 1);
/** Share of the pinned scroll spent expanding; the remainder holds the full photograph. */
const OPEN_END = 0.72;

type Tone = "ink" | "light";

/**
 * The identity, rendered twice: once in ink on the ivory canvas, once in ivory
 * inside the photo plane (clipped by the same rectangle). Wherever the
 * photograph sits behind the letters they read light, elsewhere dark — exact
 * per pixel, no colour tweening.
 */
function Identity({
  tone,
  hero,
  mastheadY,
  mastheadOpacity,
  nameY,
  nameOpacity,
  instant,
}: {
  tone: Tone;
  hero: Dictionary["hero"];
  mastheadY: MotionValue<number>;
  mastheadOpacity: MotionValue<number>;
  nameY: MotionValue<number>;
  nameOpacity: MotionValue<number>;
  instant: boolean;
}) {
  const light = tone === "light";
  const t = (delay: number, duration = 1.2) => (instant ? { duration: 0 } : { duration, delay, ease });
  const Name = light ? "p" : "h1";
  return (
    <div
      aria-hidden={light || undefined}
      className="absolute inset-x-[var(--gutter)] top-[var(--name-y)] h-0"
    >
      {/* Masthead: MEDRESA (and, on phones/tablets, the signature) above the name. */}
      <motion.div
        className={`absolute inset-x-0 bottom-[calc(var(--name-size)*0.56+1.5rem)] flex items-baseline justify-between gap-6 md:bottom-[calc(var(--name-size)*0.56+2rem)] ${light ? "text-ivory" : ""}`}
        style={{ y: mastheadY, opacity: mastheadOpacity }}
      >
        <motion.span
          className={`text-[clamp(0.75rem,0.62rem+0.5vw,1.375rem)] font-light uppercase tracking-[0.42em] ${light ? "" : "text-ink-soft"}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.25, 1)}
        >
          {hero.pre}
        </motion.span>
        <motion.span
          className={`text-[0.625rem] font-normal uppercase tracking-[0.3em] md:text-[0.6875rem] lg:hidden ${light ? "" : "text-gold-deep"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={t(0.8)}
        >
          {hero.signature}
        </motion.span>
      </motion.div>

      <motion.div className="absolute inset-x-0 top-0" style={{ y: nameY, opacity: nameOpacity }}>
        <Name
          id={light ? undefined : "hero-title"}
          className={`-translate-y-1/2 ${light ? "text-ivory" : "text-green-deep"}`}
        >
          <span className="line-mask">
            <motion.span
              className="block whitespace-nowrap text-[length:var(--name-size)] font-medium uppercase leading-[1] tracking-[-0.014em]"
              initial={{ y: "108%" }}
              animate={{ y: "0%" }}
              transition={t(0.35, 1.35)}
            >
              {hero.name}
            </motion.span>
          </span>
          {/* Signature: in the h1 for assistive tech everywhere, shown under the name on desktop. */}
          <motion.span
            className={`hidden text-xs font-normal uppercase tracking-[0.3em] lg:mt-5 lg:block min-[1800px]:mt-7 min-[1800px]:text-sm ${light ? "" : "text-gold-deep"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.8)}
          >
            {hero.signature}
          </motion.span>
          {!light && <span className="sr-only lg:hidden"> – {hero.signature}</span>}
        </Name>
      </motion.div>
    </div>
  );
}

/**
 * EDITORIAL COVER → PHOTOGRAPH. A warm ivory cover with the institution's name
 * and a clean rectangular photo plane set into it. Pinned, scroll-driven (native
 * scrolling, nothing intercepted): the plane's insets shrink to zero until the
 * photograph fills the frame, the name recedes, and only then the admissions
 * results appear. Motion values drive one CSS variable (--e) plus transforms.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const { hero } = dict;
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLAnchorElement>(null);
  const { reduced, compact } = useMotionProfile();

  const progress = useScrollProgress(sectionRef, ["start start", "end end"]);
  const rest = useMotionValue(0);
  const p = reduced ? rest : progress;
  const e = useTransform(p, [0, OPEN_END], [0, 1], { ease: openEase, clamp: true });

  // Photo offset at rest (desktop/tablet slide the building into the plane), measured per resize.
  const shift0 = useMotionValue(0);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const w = stage.getBoundingClientRect().width;
      shift0.set(w >= 1024 ? 0.2 * w : w >= 768 ? 0.1 * w : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [shift0]);

  // Restrained depth inside the photograph.
  const imgScale = useTransform(e, [0, 1], [compact ? 1.05 : 1.08, 1]);
  const imgY = useTransform(e, [0, 1], ["2.5%", "0%"]);
  const imgX = useTransform([e, shift0] as MotionValue[], ([v, s]) => (s as number) * (1 - (v as number)));
  const endShade = useTransform(e, [0.55, 1], [0, 1]);

  // Typography: the masthead leaves first, the name lingers then clears.
  const mastheadY = useTransform(e, [0, 0.5], [0, compact ? -28 : -48]);
  const mastheadOpacity = useTransform(e, [0.05, 0.38], [1, 0]);
  const nameY = useTransform(e, [0, 1], [0, compact ? -40 : -72]);
  const nameOpacity = useTransform(e, [0.42, 0.86], [1, 0]);

  // Results control: arrives once the photograph owns the frame.
  const shown = useMotionValue(1);
  const stripIn = useTransform(p, [OPEN_END + 0.05, 0.92], [0, 1], { clamp: true });
  const stripOpacity = reduced ? shown : stripIn;
  const stripY = useTransform(stripOpacity, [0, 1], [10, 0]);
  useMotionValueEvent(stripOpacity, "change", (v) => {
    if (stripRef.current) stripRef.current.style.pointerEvents = v > 0.6 ? "auto" : "none";
  });
  const revealStrip = () => {
    const s = sectionRef.current;
    if (reduced || !s || stripOpacity.get() > 0.6) return;
    const top = s.getBoundingClientRect().top + window.scrollY + s.offsetHeight - window.innerHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const identity = { hero, mastheadY, mastheadOpacity, nameY, nameOpacity, instant: reduced };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative h-[185svh] bg-ivory md:h-[220svh] lg:h-[240svh] motion-reduce:h-auto md:motion-reduce:h-auto lg:motion-reduce:h-auto"
    >
      <div
        ref={stageRef}
        className="hero-stage sticky top-0 h-svh min-h-[34rem] overflow-hidden motion-reduce:relative"
      >
        <Identity tone="ink" {...identity} />

        {/* The photo plane: a plain rectangle that grows to the full frame. */}
        <motion.div
          className="hero-plane absolute inset-0"
          style={{ "--e": e } as unknown as CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 1.2, delay: 0.1, ease }}
        >
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{ x: imgX, y: imgY, scale: imgScale }}
          >
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
          {/* Quiet shade along the name's line, so the ivory letters hold on bright walls. */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_calc(var(--name-y)-20cqh),rgb(8_30_23/0.42)_var(--name-y),transparent_calc(var(--name-y)+24cqh))]"
            style={{ opacity: nameOpacity }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(0deg,rgb(8_30_23/0.42)_0%,rgb(8_30_23/0)_30%)]"
            style={{ opacity: endShade }}
          />
          <Identity tone="light" {...identity} />
        </motion.div>

        {/* Admissions results: a compact glass control. */}
        <motion.div
          className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 lg:bottom-[clamp(1.5rem,4cqh,2.75rem)] lg:left-auto lg:right-[var(--gutter)] lg:translate-x-0"
          style={{ opacity: stripOpacity, y: stripY }}
        >
          <Link
            ref={stripRef}
            href={hero.admissions.href}
            onFocus={revealStrip}
            style={{ pointerEvents: reduced ? "auto" : "none" }}
            className="group flex items-center gap-4 whitespace-nowrap rounded-[18px] border border-white/25 bg-[rgb(10_42_33/0.28)] py-2.5 pl-4 pr-3.5 text-ivory backdrop-blur-2xl backdrop-saturate-150 transition-[background-color,scale] duration-300 ease-out hover:bg-[rgb(10_42_33/0.4)] active:scale-[0.985] md:py-3 md:pl-5 md:pr-4"
          >
            <span className="flex flex-col min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:gap-2.5">
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-soft">
                {hero.admissions.kicker}
              </span>
              <span aria-hidden className="hidden text-ivory/50 min-[400px]:inline">
                ·
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
