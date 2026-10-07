"use client";

import { motion, useInView, useTransform, type MotionValue } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * Three planes, three kinds of motion:
 *
 *   Years        the strongest layer. Each numeral has its own way of arriving:
 *                from an edge, as a slower plane behind the text, out of the
 *                line it sits on, across empty space. As the reader moves on, a
 *                passed year recedes (slightly smaller, lighter) and the next
 *                one takes over.
 *   Achievements the quiet layer: one short settle per achievement, nothing more.
 *   Gold line    the continuity layer: drawn by reading, turning between years.
 *
 * transform / clip-path / opacity only, scroll-linked values on the JS path
 * (useScrollProgress). Reduced motion: every numeral in place, lines drawn.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;
const view = { once: true, margin: "0px 0px -10% 0px" } as const;

type Origin = "left" | "right" | "top" | "bottom" | "center";
const originClass: Record<Origin, string> = {
  left: "origin-left",
  right: "origin-right",
  top: "origin-top",
  bottom: "origin-bottom",
  center: "origin-center",
};

/** One straight run, drawn once from a chosen end as it enters. */
export function Line({
  origin = "left",
  delay = 0,
  duration = 1,
  fade,
  className = "",
  style,
}: {
  origin?: Origin;
  delay?: number;
  duration?: number;
  /** The run dissolves toward this side (an open end). */
  fade?: "left" | "right";
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const vertical = origin === "top" || origin === "bottom";
  const fill = fade
    ? { background: `linear-gradient(to ${fade}, var(--color-gold) 40%, transparent)` }
    : undefined;
  const base = `pointer-events-none absolute block ${fade ? "" : "bg-gold"} ${vertical ? "w-px" : "h-px"} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={{ ...style, ...fill }} />;
  return (
    <motion.span
      aria-hidden
      className={`${base} ${originClass[origin]}`}
      style={{ ...style, ...fill }}
      initial={vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={view}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

/** A vertical run whose length follows the reading through its own span. */
export function Stream({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 85%", "end 62%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block w-px origin-top bg-gold ${className}`}
      style={reduced ? { ...style, scaleY: 1 } : { ...style, scaleY: p }}
    />
  );
}

/**
 * How a year arrives:
 *   edge-right  slides in from beyond the right edge, rising out of its line
 *   layer       a slower plane behind the text (drifts down as the page goes up)
 *   line        unrolls along the line it sits on, left to right
 *   drift       crosses the empty space from right to left
 *   edge-left   slides in from beyond the left edge, rising out of its line
 */
export type Arrival = "edge-right" | "layer" | "line" | "drift" | "edge-left";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Numeral({
  children,
  arrival,
  className = "",
  id,
}: {
  children: ReactNode;
  arrival: Arrival;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mask = useRef<HTMLSpanElement>(null);
  const { reduced, compact } = useMotionProfile();
  const seen = useInView(mask, view);
  // The whole pass of the year through the viewport.
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const k = compact ? 0.55 : 1;

  const x = useTransform(p, (v: number) => {
    if (arrival === "edge-right") return `${9 * k * (1 - clamp01(v / 0.45))}%`;
    if (arrival === "edge-left") return `${-9 * k * (1 - clamp01(v / 0.45))}%`;
    if (arrival === "drift") return `${(14 - 20 * v) * k}%`;
    return "0%";
  });
  const y = useTransform(p, (v: number) => {
    if (arrival === "layer") return `${(-10 + 26 * v) * k}%`;
    if (arrival === "line") return `${(-3 + 8 * v) * k}%`;
    return "0%";
  });
  // A passed year recedes as the next takes over (not the background layer).
  const recede = arrival !== "layer";
  const scale = useTransform(p, (v: number) => (recede ? 1 - 0.06 * clamp01((v - 0.62) / 0.38) : 1));
  const opacity = useTransform(p, (v: number) => (recede ? 1 - 0.6 * clamp01((v - 0.62) / 0.38) : 1));

  const origin = arrival === "edge-left" || arrival === "line" ? "origin-left" : "origin-right";
  const text = (
    <span className="block tabular-nums" id={id}>
      {children}
    </span>
  );

  if (reduced)
    return (
      <div ref={ref} role="heading" aria-level={2} className={className}>
        <span ref={mask} className="block">
          {text}
        </span>
      </div>
    );

  // Rising out of the line (edge arrivals), or unrolling along it ("line").
  const hidden =
    arrival === "line" ? { clipPath: "inset(0% 100% 0% 0%)" } : arrival === "layer" ? {} : { y: "102%" };
  const shown =
    arrival === "line" ? { clipPath: "inset(0% 0% 0% 0%)" } : arrival === "layer" ? {} : { y: "0%" };

  return (
    <motion.div
      ref={ref}
      role="heading"
      aria-level={2}
      className={`${origin} ${className}`}
      style={{ x, y, scale, opacity }}
    >
      {/* The right pad keeps the last digit whole: tight tracking makes it overhang its box. */}
      <span ref={mask} className="-my-[0.08em] -mr-[0.06em] block overflow-hidden py-[0.08em] pr-[0.06em]">
        <motion.span
          className="block"
          initial={hidden}
          animate={seen ? shown : hidden}
          transition={{ duration: arrival === "line" ? 1.2 : 0.95, ease: arrival === "line" ? draw : settle }}
        >
          {text}
        </motion.span>
      </span>
    </motion.div>
  );
}

/** An achievement settling in once — the quiet layer. */
export function Settle({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { reduced, compact } = useMotionProfile();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: `translate3d(0, ${compact ? 10 : 16}px, 0)` }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
      viewport={view}
      transition={{ duration: 0.7, delay, ease: settle }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The closing categories resolve one after another as the reader moves through
 * them: each comes into full colour and position as it reaches reading height.
 */
export function Resolve({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLLIElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 94%", "start 64%"]);
  const opacity = useTransform(p, [0, 1], [0.22, 1]);
  const x: MotionValue<number> = useTransform(p, [0, 1], [compact ? -10 : -22, 0]);
  return (
    // Reduced motion sets the resting values explicitly: a dropped motion style would keep its last value.
    <motion.li ref={ref} className={className} style={reduced ? { opacity: 1, x: 0 } : { opacity, x }}>
      {children}
    </motion.li>
  );
}
