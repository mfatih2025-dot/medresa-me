"use client";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda } from "next/font/google";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowRight, DocumentIcon } from "@/components/ui/icons";

/*
 * The hero's own display face: Bodoni Moda (SIL Open Font License), a
 * high-contrast Didone with an optical-size axis, so the large name gets its
 * finest hairlines. Latin Extended covers č ć š ž đ. Loaded by this component
 * only; the rest of the site keeps its typography.
 */
const display = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-hero",
  display: "swap",
});

/** CSS entrance timing (see .hero-in in globals.css): delay and duration in seconds. */
const enter = (delay: number, duration?: number) =>
  ({ "--in-delay": `${delay}s`, ...(duration ? { "--in-dur": `${duration}s` } : {}) }) as CSSProperties;

/**
 * Editorial cover. The real campus photograph fills the frame; the sky over it
 * brightens toward the horizon, where the identity stands as a monumental
 * serif: MEDRESA, then MEHMED / FATIH, then the signature. A faint mihrab
 * outline (the footer's arch language) rises at the side. The admissions
 * results float as dark green glass over the lower photograph.
 *
 * Entrance (CSS, so nothing stays hidden if scripts fail): MEDRESA → MEHMED →
 * FATIH → signature → results. Scroll adds restrained depth only: the
 * photograph scales and drifts, the type lifts away, the glass settles out.
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const { hero } = dict;
  const [first, ...rest] = hero.name.split(" ");
  const second = rest.join(" ");
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start start", "end start"]);
  // Known on the first client render, unlike useMotionProfile (settles after hydration).
  const prefersReduced = useReducedMotion();
  const still = reduced || prefersReduced === true;

  const imgScale = useTransform(p, [0, 1], [1, compact ? 1.06 : 1.1]);
  const imgY = useTransform(p, [0, 1], ["0%", compact ? "8%" : "14%"]);
  // Depth separation: the photograph sinks, the name rises a little, the lines
  // around it rise least. Opacity holds, then eases out late. Phones move less.
  const nameY = useTransform(p, [0, 1], ["0vh", compact ? "-5vh" : "-10vh"]);
  const nameOpacity = useTransform(p, [0.22, 0.62], [1, 0]);
  const lineY = useTransform(p, [0, 1], ["0vh", compact ? "-3vh" : "-6vh"]);
  const lineOpacity = useTransform(p, [0.14, 0.48], [1, 0]);
  const glassY = useTransform(p, [0, 1], [0, compact ? 30 : 60]);
  const glassOpacity = useTransform(p, [0, 0.45], [1, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className={`hero-frame ${display.variable} relative isolate overflow-hidden bg-[linear-gradient(180deg,#a9c6de_0%,#c9dbe8_14%,#e6ecef_26%,#dfe8ee_40%)]`}
      style={{ height: "max(36rem, 100svh)" }}
    >
      {/* The photograph, full bleed: the architecture fills the lower frame. */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-[11svh] -z-20 will-change-transform md:top-[12svh] lg:top-0"
        style={still ? undefined : { scale: imgScale, y: imgY }}
      >
        <div className="hero-photo-in absolute inset-0 [mask-image:linear-gradient(180deg,transparent_0%,#000_24%)] lg:[mask-image:none]">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-[31%_100%] md:object-[34%_100%] lg:object-[46%_62%]"
          />
        </div>
      </motion.div>

      {/* Light. The sky brightens toward the horizon where the name stands (the
          photograph stays visible under the header); on wide screens the light also
          comes from the left, leaving the architecture clear. A low warm glow at the
          side, and soft shade under the glass. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(247_246_240/0.18)_0%,rgb(247_246_240/0.72)_14%,rgb(247_246_240/0.86)_27%,rgb(247_246_240/0.6)_40%,rgb(247_246_240/0.16)_51%,rgb(247_246_240/0)_60%)] md:bg-[linear-gradient(180deg,rgb(247_246_240/0.18)_0%,rgb(247_246_240/0.74)_15%,rgb(247_246_240/0.86)_32%,rgb(247_246_240/0.66)_44%,rgb(247_246_240/0)_58%)] lg:bg-[radial-gradient(46%_44%_at_20%_37%,rgb(247_246_240/0.9)_0%,rgb(247_246_240/0.78)_45%,rgb(247_246_240/0)_100%),linear-gradient(180deg,rgb(247_246_240/0.3)_0%,rgb(247_246_240/0)_24%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_42%_at_100%_30%,rgb(255_222_160/0.32)_0%,rgb(255_222_160/0)_100%)] mix-blend-soft-light lg:bg-[radial-gradient(48%_55%_at_96%_28%,rgb(255_222_160/0.4)_0%,rgb(255_222_160/0)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-[linear-gradient(0deg,rgb(8_26_22/0.4)_0%,rgb(8_26_22/0)_100%)]"
      />

      {/* The mihrab outline: two concentric pointed arches, hairline, fading downward. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-14%] top-[clamp(7.5rem,15svh,9rem)] -z-10 h-[46svh] w-[58%] md:right-[-6%] md:top-[clamp(10rem,15svh,12rem)] md:w-[44%] lg:right-[9%] lg:top-[clamp(7.5rem,13svh,9.5rem)] lg:h-[52svh] lg:w-[24%]"
        style={still ? undefined : { y: lineY }}
      >
        <svg
          viewBox="0 0 400 640"
          preserveAspectRatio="xMidYMin meet"
          className="hero-arch h-full w-full [mask-image:linear-gradient(180deg,#000_45%,transparent_92%)]"
        >
          <path d="M40 640 V300 A320 320 0 0 1 200 22.9 A320 320 0 0 1 360 300 V640" pathLength={1} />
          <path d="M66 640 V300 A268 268 0 0 1 200 68 A268 268 0 0 1 334 300 V640" pathLength={1} />
        </svg>
      </motion.div>

      {/* Identity (MEDRESA, the name on two lines, the signature) above, the
          admissions results at the foot of the same column. */}
      <div className="absolute inset-x-[max(var(--gutter),calc((100%-var(--max))/2+var(--gutter)))] bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] top-[clamp(8rem,16.5svh,10rem)] flex flex-col md:bottom-[clamp(2rem,5svh,3rem)] md:top-[clamp(11rem,17svh,13.5rem)] lg:bottom-[clamp(1.75rem,4svh,2.75rem)] lg:top-[clamp(9.5rem,20svh,12.5rem)]">
        <h1 id="hero-title" className="w-fit max-w-full">
          <motion.span className="block" style={still ? undefined : { y: lineY, opacity: lineOpacity }}>
            <span className="hero-in flex items-center gap-3 md:gap-4" style={enter(0.15)}>
              <span aria-hidden className="h-px w-9 bg-gold md:w-14 lg:w-16" />
              <span className="text-[0.8125rem] font-normal uppercase tracking-[0.46em] text-gold-deep md:text-[1.0625rem] lg:text-[clamp(1rem,0.7rem+0.45vw,1.375rem)]">
                {hero.pre}
              </span>
            </span>
          </motion.span>{" "}
          <motion.span
            className="mt-2.5 block md:mt-4"
            style={still ? undefined : { y: nameY, opacity: nameOpacity }}
          >
            <span className="hero-name block font-[family-name:var(--font-hero)] text-[clamp(3.5rem,18.5cqw,6.25rem)] font-semibold uppercase leading-[0.9] tracking-[-0.012em] md:text-[clamp(6rem,15.5cqw,9.5rem)] lg:text-[clamp(6.5rem,9.4cqw,11.5rem)]">
              <span className="hero-in relative block w-fit text-green-deep" style={enter(0.35, 1.3)}>
                {first}
                <span aria-hidden className="hero-sheen absolute inset-0">
                  {first}
                </span>
              </span>{" "}
              {second && (
                <span className="hero-in relative block w-fit" style={enter(0.5, 1.3)}>
                  <span className="hero-gilt">{second}</span>
                  <span
                    aria-hidden
                    className="hero-sheen absolute inset-0"
                    style={{ animationDelay: "2.75s" }}
                  >
                    {second}
                  </span>
                </span>
              )}
            </span>
          </motion.span>{" "}
          <motion.span
            className="mt-3.5 block md:mt-6"
            style={still ? undefined : { y: lineY, opacity: lineOpacity }}
          >
            <span
              className="hero-in block pl-[0.1em] text-[0.75rem] font-normal uppercase tracking-[0.42em] text-ink min-[400px]:text-[0.8125rem] md:text-[1rem] lg:text-[clamp(0.9375rem,0.6rem+0.42vw,1.25rem)]"
              style={enter(0.85)}
            >
              {hero.signature}
            </span>
          </motion.span>
        </h1>

        {/* Admissions results: dark green glass over the photograph. */}
        <motion.div
          className="mt-auto w-full md:w-[30rem] lg:w-[min(34rem,max(30rem,40vw))]"
          style={still ? undefined : { y: glassY, opacity: glassOpacity }}
        >
          <div className="hero-in" style={enter(1.1, 1.1)}>
            <Link
              href={hero.admissions.href}
              className="group flex items-center gap-3 rounded-[22px] border border-gold-soft/35 bg-[linear-gradient(135deg,rgb(30_52_38/0.74),rgb(12_34_27/0.66))] py-3.5 pl-4 pr-3 text-ivory shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_44px_-22px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-[1.2] transition-[background-color,border-color,translate,scale] duration-300 ease-out hover:-translate-y-0.5 hover:border-gold-soft/55 active:scale-[0.985] md:gap-5 md:rounded-[26px] md:py-4 md:pl-6 md:pr-4 lg:py-5 lg:pl-7 lg:pr-5"
            >
              <span aria-hidden className="hidden shrink-0 text-gold-soft min-[360px]:block">
                <DocumentIcon width={26} height={26} className="md:size-7" />
              </span>
              <span
                aria-hidden
                className="mr-0.5 hidden h-10 w-px shrink-0 bg-gold-soft/30 min-[360px]:block md:h-12"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-gold-soft md:text-xs">
                  {hero.admissions.kicker}
                </span>
                <span className="mt-1 line-clamp-2 font-[family-name:var(--font-hero)] text-[0.9375rem] font-medium leading-[1.15] text-ivory min-[380px]:text-[1.0625rem] min-[410px]:text-[1.125rem] min-[428px]:text-[1.1875rem] md:text-[1.5rem] lg:text-[clamp(1.375rem,0.9rem+0.55vw,1.625rem)]">
                  {hero.admissions.label}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-full border border-gold-soft/55 text-ivory transition-[background-color,border-color] duration-300 ease-out group-hover:border-gold-soft group-hover:bg-gold-soft/10 md:size-12"
              >
                <ArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
