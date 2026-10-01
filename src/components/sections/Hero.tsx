"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ArrowDown, ArrowRight, PlayIcon } from "@/components/ui/icons";
import { LineReveal } from "@/components/ui/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero({ dict }: { dict: Dictionary }) {
  const { hero, ui } = dict;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const scrollYProgress = useScrollProgress(ref, ["start start", "end start"]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", compact ? "9%" : "16%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.04, compact ? 1.12 : 1.2]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", compact ? "-6%" : "-14%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const still = reduced;

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

      {/* Legibility + warm grade. Two gentle layers only: left/bottom for type, top for the header. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgb(8_30_23/0.9)_0%,rgb(8_30_23/0.62)_45%,rgb(8_30_23/0.12)_78%)] md:bg-[linear-gradient(95deg,rgb(8_30_23/0.86)_0%,rgb(8_30_23/0.5)_45%,rgb(8_30_23/0)_72%),linear-gradient(0deg,rgb(8_30_23/0.55)_0%,rgb(8_30_23/0)_40%)]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gold/10 mix-blend-soft-light" />

      <motion.div
        className="wrap relative pb-[clamp(5.5rem,12vh,8rem)] pt-44 md:pt-56"
        style={still ? undefined : { y: copyY, opacity: copyOpacity }}
      >
        <motion.p
          className="eyebrow mb-5 flex flex-wrap gap-x-4 gap-y-1 min-[400px]:gap-x-2.5 text-[clamp(0.5625rem,2.6vw,0.6875rem)] tracking-[0.14em] text-ivory/90 md:mb-7 md:gap-x-3 md:text-xs md:tracking-[0.28em]"
          initial={still ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease }}
        >
          {hero.eyebrow.map((w, i) => (
            <span key={w}>
              {i > 0 && (
                <span aria-hidden className="mr-2.5 hidden text-gold min-[400px]:inline md:mr-3">
                  ·
                </span>
              )}
              {w}
            </span>
          ))}
        </motion.p>

        <LineReveal
          as="h1"
          id="hero-title"
          immediate
          delay={0.35}
          lines={hero.lines}
          accentIndex={hero.accent}
          accentClass="text-gold-soft"
          className="display h-hero max-w-[12ch] md:max-w-[14ch]"
        />

        <motion.p
          className="lead mt-6 max-w-[30ch] text-ivory/90 md:mt-8 md:max-w-[36ch]"
          initial={still ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.95, ease }}
        >
          {hero.lead}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-10"
          initial={still ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.1, ease }}
        >
          <Link href={hero.primary.href} className="btn btn-gold">
            {hero.primary.label}
            <ArrowRight />
          </Link>
          <a
            href={hero.secondary.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-12 items-center gap-3 text-[0.9375rem]"
          >
            <span className="grid size-12 place-items-center rounded-full border border-ivory/60 transition-colors duration-500 group-hover:bg-ivory group-hover:text-green-deep">
              <PlayIcon className="ml-0.5" />
            </span>
            {hero.secondary.label}
          </a>
        </motion.div>
      </motion.div>

      <a
        href="#glance"
        aria-label={ui.scrollDown}
        className="absolute bottom-5 left-1/2 hidden size-12 -translate-x-1/2 place-items-center rounded-full border border-ivory/40 text-ivory/90 transition-colors hover:bg-ivory/10 md:grid"
      >
        <ArrowDown />
      </a>
    </section>
  );
}
