"use client";

import Image from "next/image";
import { motion, useInView, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import type { OiuImage } from "@/content/oiu";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * The page's device: a thin gold line read as a building's plan — it runs,
 * turns at corners, stops at a threshold and resumes, frames a room, and
 * passes behind the photographs (which sit on a plane above it).
 *
 *   Line    one straight run, drawn once from a chosen end as it enters
 *   Plate   a photograph: a mask opens from one side while the photo settles
 *           1.03 → 1; inside the frame it drifts a few % with scroll (depth)
 *
 * transform / clip-path only. Reduced motion: everything drawn and still.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;
const view = { once: true, margin: "0px 0px -10% 0px" } as const;

type Origin = "left" | "right" | "top" | "bottom";

const originClass: Record<Origin, string> = {
  left: "origin-left",
  right: "origin-right",
  top: "origin-top",
  bottom: "origin-bottom",
};

export function Line({
  origin = "left",
  delay = 0,
  duration = 1,
  fade,
  className = "",
  style,
}: {
  /** The end it is drawn from; horizontal for left/right, vertical for top/bottom. */
  origin?: Origin;
  delay?: number;
  duration?: number;
  /** The run dissolves toward this end instead of stopping (an open end). */
  fade?: Origin;
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const horizontal = origin === "left" || origin === "right";
  const fill = fade
    ? { background: `linear-gradient(to ${fade}, var(--color-gold) 30%, transparent)` }
    : undefined;
  const base = `pointer-events-none absolute block ${fade ? "" : "bg-gold"} ${horizontal ? "h-px" : "w-px"} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={{ ...style, ...fill }} />;
  return (
    <motion.span
      aria-hidden
      className={`${base} ${originClass[origin]}`}
      style={{ ...style, ...fill }}
      initial={horizontal ? { scaleX: 0 } : { scaleY: 0 }}
      whileInView={horizontal ? { scaleX: 1 } : { scaleY: 1 }}
      viewport={view}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

const closed: Record<Origin, string> = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  top: "inset(0% 0% 100% 0%)",
  bottom: "inset(100% 0% 0% 0%)",
};
const open = "inset(0% 0% 0% 0%)";

export function Plate({
  image,
  sizes,
  from = "bottom",
  travel = 5,
  delay = 0,
  priority = false,
  immediate = false,
  className = "",
}: {
  image: OiuImage;
  sizes: string;
  /** The side the mask opens from. */
  from?: Origin;
  /** Drift of the photo inside its frame, in % of the frame's height (each way). */
  travel?: number;
  delay?: number;
  priority?: boolean;
  /** Reveal on mount (above the fold) instead of on entering view. */
  immediate?: boolean;
  /** Must give the frame its size (an aspect ratio or a height): no layout shift. */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const seen = useInView(ref, view);
  const shown = immediate || seen;
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const t = compact ? travel * 0.6 : travel;
  // The photo is taller than its frame by 2t%; its own translate is relative to that height.
  const y = useTransform(p, [0, 1], [`${(-t / (100 + 2 * t)) * 100}%`, `${(t / (100 + 2 * t)) * 100}%`]);

  const photo = (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      style={{ objectPosition: image.position }}
    />
  );

  if (reduced)
    return (
      <div ref={ref} className={`relative overflow-hidden bg-sand ${className}`}>
        {photo}
      </div>
    );

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden bg-sand ${className}`}
      initial={{ clipPath: closed[from] }}
      animate={{ clipPath: shown ? open : closed[from] }}
      transition={{ duration: 1.15, delay, ease: draw }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.03 }}
        animate={{ scale: shown ? 1 : 1.03 }}
        transition={{ duration: 1.6, delay, ease: settle }}
      >
        <motion.div
          className="absolute inset-x-0 will-change-transform"
          style={{ top: `${-t}%`, bottom: `${-t}%`, y }}
        >
          {photo}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * A long vertical run drawn by reading: its length follows the scroll through
 * its own span (transform only), so the plan unrolls at the reader's pace.
 */
export function Wall({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 85%", "end 62%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block w-px origin-top bg-gold ${className}`}
      style={reduced ? style : { ...style, scaleY: p }}
    />
  );
}

/** A dimension tick: the short oblique stroke that marks a measure on a plan. */
export function Tick({
  delay = 0,
  className = "",
  style,
}: {
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const base = `pointer-events-none absolute block h-4 w-px -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold-deep ${className}`;
  if (reduced) return <span aria-hidden className={base} style={style} />;
  return (
    <motion.span
      aria-hidden
      className={base}
      style={style}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={view}
      transition={{ duration: 0.4, delay, ease: settle }}
    />
  );
}
