"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * Two streams of knowledge, drawn as thin gold lines that later converge.
 *
 *   Line      one straight run, drawn once from a chosen end as it enters
 *   Stream    a long vertical run drawn by reading (scroll-linked length)
 *   Aperture  the page's one photograph: a contained frame that opens to its
 *             full width as it rises into view, a gold line above it tracing
 *             exactly the width that is open; the photo settles 1.03 → 1 and
 *             drifts a little slower than the page
 *   Depth     large type set a few pixels deeper than the page (desktop)
 *
 * transform / clip-path only. Reduced motion: drawn, open and still.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const view = { once: true, margin: "0px 0px -10% 0px" } as const;

type Origin = "left" | "right" | "top" | "bottom" | "center";

const originClass: Record<Origin, string> = {
  left: "origin-left",
  right: "origin-right",
  top: "origin-top",
  bottom: "origin-bottom",
  center: "origin-center",
};

export function Line({
  origin = "left",
  vertical,
  delay = 0,
  duration = 1,
  fade,
  className = "",
  style,
}: {
  origin?: Origin;
  /** Only needed for origin "center": which way the run goes. */
  vertical?: boolean;
  delay?: number;
  duration?: number;
  /** The run dissolves toward this side (an open end). */
  fade?: "left" | "right" | "top" | "bottom";
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const isVertical = vertical ?? (origin === "top" || origin === "bottom");
  const fill = fade
    ? { background: `linear-gradient(to ${fade}, var(--color-gold) 35%, transparent)` }
    : undefined;
  const base = `pointer-events-none absolute block ${fade ? "" : "bg-gold"} ${isVertical ? "w-px" : "h-px"} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={{ ...style, ...fill }} />;
  return (
    <motion.span
      aria-hidden
      className={`${base} ${originClass[origin]}`}
      style={{ ...style, ...fill }}
      initial={isVertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={isVertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={view}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

/** A long vertical run whose length follows the reading through its own span. */
export function Stream({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 82%", "end 65%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block w-px origin-top bg-gold ${className}`}
      style={reduced ? style : { ...style, scaleY: p }}
    />
  );
}

/** Large type a few pixels deeper than the page: it trails the scroll slightly (desktop). */
export function Depth({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const y = useTransform(p, [0, 1], [18, -18]);
  return (
    <motion.div ref={ref} className={className} style={reduced || compact ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

const inset = (side: number, top: number) => `inset(${top}% ${side}% ${top}% ${side}%)`;

export function Aperture({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Gives the frame its size (an aspect ratio): no layout shift. */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  // Opening: from the frame's top entering the view until it reaches the upper third,
  // so the photograph is whole while most of it is still in view.
  const open = useScrollProgress(ref, ["start 95%", "start 30%"]);
  // Drift: across the whole pass through the view.
  const pass = useScrollProgress(ref, ["start end", "end start"]);

  const side = compact ? 9 : 15;
  const top = compact ? 4 : 6;
  const clip = useTransform(open, (v: number) => {
    const k = 1 - Math.min(1, Math.max(0, v));
    return inset(side * k, top * k);
  });
  // The tracer is exactly as wide as the opening.
  const trace = useTransform(open, [0, 1], [1 - (2 * side) / 100, 1]);
  const scale = useTransform(open, [0, 1], [1.03, 1]);
  // The photo is 10% taller than its frame and moves ±4% of its height: slower than the page.
  const y = useTransform(pass, [0, 1], ["-4%", "4%"]);

  const photo = <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;

  if (reduced)
    return (
      <div ref={ref} className={`relative ${className}`}>
        <Tracer />
        <div className="absolute inset-0 overflow-hidden bg-sand">{photo}</div>
      </div>
    );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <Tracer scaleX={trace} />
      <motion.div className="absolute inset-0 overflow-hidden bg-sand" style={{ clipPath: clip }}>
        <motion.div className="absolute inset-x-0 -inset-y-[5%] will-change-transform" style={{ y, scale }}>
          {photo}
        </motion.div>
      </motion.div>
    </div>
  );
}

/** The gold line above the photograph, centred on the stream that leads into it. */
function Tracer({ scaleX }: { scaleX?: MotionValue<number> }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-5 block h-px origin-center bg-gold md:-top-7"
      style={scaleX ? { scaleX } : undefined}
    />
  );
}
