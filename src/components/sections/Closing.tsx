"use client";

import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { LineReveal } from "@/components/ui/Reveal";

export function Closing({ dict }: { dict: Dictionary }) {
  const { closing } = dict;
  const ref = useRef<HTMLElement>(null);
  const { reduced, compact } = useMotionProfile();
  const scrollYProgress = useScrollProgress(ref, ["start end", "end start"]);
  const clip = useTransform(
    scrollYProgress,
    [0, 0.38],
    compact
      ? ["inset(10% 5% 10% 5%)", "inset(0% 0% 0% 0%)"]
      : ["inset(14% 10% 14% 10%)", "inset(0% 0% 0% 0%)"],
  );
  const scale = useTransform(scrollYProgress, [0, 0.6], [1.22, 1.04]);
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "8%"]);

  return (
    <section
      ref={ref}
      aria-label={closing.line.join(" ")}
      className="relative isolate grid min-h-[34rem] place-items-center overflow-hidden bg-green-deep text-center text-ivory"
      style={{ height: "max(34rem, 92svh)" }}
    >
      <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { clipPath: clip }}>
        <motion.div
          className="absolute inset-[-8%] will-change-transform"
          style={reduced ? undefined : { scale, y }}
        >
          <Image
            src={closing.image.src}
            alt={closing.image.alt}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: closing.image.position }}
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_50%,rgb(10_42_33/0.72),rgb(10_42_33/0.45))]"
        />
      </motion.div>

      <div className="wrap">
        <span aria-hidden className="mx-auto mb-8 block h-16 w-px bg-gold md:h-24" />
        <LineReveal
          lines={closing.line}
          accentIndex={2}
          accentClass="italic text-gold-soft"
          className="display text-[clamp(2.75rem,1.2rem+7vw,8rem)] leading-[1]"
          as="p"
        />
      </div>
    </section>
  );
}
