"use client";

import { motion, useInView, useTransform } from "framer-motion";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * Motion for a functional page: it establishes hierarchy, then gets out of the way.
 *
 *   Emerge  a heading rising out of its mask, once
 *   Row     a directory row: its rule draws first, then the row slides in a
 *           few pixels from the left (staggered by index) — reading order
 *   Line    a gold run drawn once from one end
 *   Path    a vertical gold run drawn by reading (the connection to Rožaje)
 *   Depth   a large place name trailing the scroll by a few pixels
 *   MapReveal  the map's frame opens from its horizontal centre line, then the
 *           clip is removed entirely so zoom, drag and controls are untouched
 *
 * transform / clip-path / opacity only; everything resolves into stillness.
 * Reduced motion: in place.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;
const view = { once: true, margin: "0px 0px -10% 0px" } as const;

export function Emerge({
  children,
  delay = 0,
  immediate = false,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  immediate?: boolean;
  className?: string;
}) {
  const { reduced } = useMotionProfile();
  const mask = useRef<HTMLSpanElement>(null);
  const seen = useInView(mask, view);
  if (reduced) return <span className={`block ${className}`}>{children}</span>;
  return (
    <span ref={mask} className={`-mb-[0.14em] block overflow-hidden pb-[0.14em] ${className}`}>
      <motion.span
        className="block"
        initial={{ transform: "translateY(105%)" }}
        animate={{ transform: immediate || seen ? "translateY(0%)" : "translateY(105%)" }}
        transition={{ duration: 0.85, delay, ease: settle }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Row({
  children,
  index = 0,
  gold = false,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  /** The row's rule in gold (the first row of a location) instead of ink. */
  gold?: boolean;
  className?: string;
}) {
  const { reduced, compact } = useMotionProfile();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, view);
  const rule = `absolute inset-x-0 top-0 block h-px origin-left ${gold ? "bg-gold" : "bg-ink/12"}`;
  if (reduced)
    return (
      <div ref={ref} className={`relative ${className}`}>
        <span aria-hidden className={rule} />
        {children}
      </div>
    );
  const d = index * 0.09;
  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.span
        aria-hidden
        className={rule}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: seen ? 1 : 0 }}
        transition={{ duration: 0.9, delay: d, ease: draw }}
      />
      <motion.div
        initial={{ opacity: 0, transform: `translate3d(${compact ? -8 : -14}px, 0, 0)` }}
        animate={
          seen
            ? { opacity: 1, transform: "translate3d(0px, 0, 0)" }
            : { opacity: 0, transform: `translate3d(${compact ? -8 : -14}px, 0, 0)` }
        }
        transition={{ duration: 0.7, delay: d + 0.22, ease: settle }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function Line({
  origin = "left",
  delay = 0,
  duration = 1,
  immediate = false,
  className = "",
  style,
}: {
  origin?: "left" | "right" | "top";
  delay?: number;
  duration?: number;
  immediate?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const vertical = origin === "top";
  const shape = vertical ? "w-px origin-top" : origin === "right" ? "h-px origin-right" : "h-px origin-left";
  const base = `pointer-events-none absolute block bg-gold ${shape} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={style} />;
  const from = vertical ? { scaleY: 0 } : { scaleX: 0 };
  const to = vertical ? { scaleY: 1 } : { scaleX: 1 };
  return (
    <motion.span
      aria-hidden
      className={base}
      style={style}
      initial={from}
      {...(immediate ? { animate: to } : { whileInView: to, viewport: view })}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

export function Path({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 82%", "end 58%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block w-px origin-top bg-gold ${className}`}
      style={reduced ? { ...style, scaleY: 1 } : { ...style, scaleY: p }}
    />
  );
}

export function Depth({
  children,
  px = 16,
  className = "",
}: {
  children: ReactNode;
  px?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const y = useTransform(p, [0, 1], [-(compact ? px * 0.5 : px), compact ? px * 0.5 : px]);
  return (
    <motion.div ref={ref} className={className} style={reduced ? { y: 0 } : { y }}>
      {children}
    </motion.div>
  );
}

/**
 * The map's reveal: a CSS clip transition (no transform on the map), removed
 * once it has opened so the embed behaves exactly as Google ships it.
 */
export function MapReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { reduced } = useMotionProfile();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [done, setDone] = useState(false);
  const style: CSSProperties | undefined =
    reduced || done
      ? undefined
      : {
          clipPath: seen ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)",
          transition: "clip-path 1.15s cubic-bezier(0.65, 0, 0.35, 1) 0.45s",
        };
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && seen) setDone(true);
      }}
    >
      {children}
    </div>
  );
}
