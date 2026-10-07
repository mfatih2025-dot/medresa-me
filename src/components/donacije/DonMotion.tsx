"use client";

import Image from "next/image";
import { motion, useInView, useTransform } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * Motion that carries the page's one idea, good that continues:
 *
 *   Line     a straight run drawn once from one end as it enters
 *   Chain    a vertical run drawn by reading: the reasons hang from it
 *   Emerge   a line of type rising out of its own mask (the support list,
 *            the closing), once, in sequence
 *   Settle   a quiet block settling once (the payment details: calm, no show)
 *   Slit     the photograph: first only a narrow column around the minaret,
 *            opening to the whole sky as it rises into view; the photo settles
 *            1.03 → 1 and drifts a little slower than the page
 *
 * transform / clip-path / opacity only. Reduced motion: everything in place,
 * with explicit resting values.
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

export function Line({
  origin = "left",
  delay = 0,
  duration = 1,
  fade,
  immediate = false,
  className = "",
  style,
}: {
  origin?: Origin;
  delay?: number;
  duration?: number;
  /** The run dissolves toward this side: an open end. */
  fade?: "left" | "right";
  /** Draw on mount (above the fold). */
  immediate?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const vertical = origin === "top" || origin === "bottom";
  const fill = fade
    ? { background: `linear-gradient(to ${fade}, var(--color-gold) 45%, transparent)` }
    : undefined;
  const base = `pointer-events-none absolute block ${fade ? "" : "bg-gold"} ${vertical ? "w-px" : "h-px"} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={{ ...style, ...fill }} />;
  const from = vertical ? { scaleY: 0 } : { scaleX: 0 };
  const to = vertical ? { scaleY: 1 } : { scaleX: 1 };
  return (
    <motion.span
      aria-hidden
      className={`${base} ${originClass[origin]}`}
      style={{ ...style, ...fill }}
      initial={from}
      {...(immediate ? { animate: to } : { whileInView: to, viewport: view })}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

export function Chain({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 80%", "end 60%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block w-px origin-top bg-gold ${className}`}
      style={reduced ? { ...style, scaleY: 1 } : { ...style, scaleY: p }}
    />
  );
}

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
  const shown = immediate || seen;
  if (reduced) return <span className={`block ${className}`}>{children}</span>;
  return (
    <span ref={mask} className={`-mb-[0.14em] block overflow-hidden pb-[0.14em] ${className}`}>
      <motion.span
        className="block"
        initial={{ transform: "translateY(105%)" }}
        animate={{ transform: shown ? "translateY(0%)" : "translateY(105%)" }}
        transition={{ duration: 0.85, delay, ease: settle }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Settle({
  children,
  delay = 0,
  duration = 0.7,
  y = 14,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}) {
  const { reduced, compact } = useMotionProfile();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: `translate3d(0, ${compact ? y * 0.6 : y}px, 0)` }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
      viewport={view}
      transition={{ duration, delay, ease: settle }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The photograph opens from a narrow column around the minaret to the whole
 * frame. `slit` is the starting inset (top right bottom left, %), separately for
 * phones and wider screens, chosen so the minaret is what shows first.
 */
export function Slit({
  src,
  alt,
  sizes,
  position,
  slit,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  position: string;
  slit: { compact: [number, number, number, number]; wide: [number, number, number, number] };
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const open = useScrollProgress(ref, ["start 92%", "start 22%"]);
  const pass = useScrollProgress(ref, ["start end", "end start"]);
  const from = compact ? slit.compact : slit.wide;
  const clip = useTransform(open, (v: number) => {
    const k = 1 - Math.min(1, Math.max(0, v));
    // Ease the opening so it lingers on the narrow frame, then widens.
    const e = k * k * (3 - 2 * k);
    return `inset(${from.map((f) => `${(f * e).toFixed(3)}%`).join(" ")})`;
  });
  const scale = useTransform(open, [0, 1], [1.03, 1]);
  const y = useTransform(pass, [0, 1], ["-3.5%", "3.5%"]);

  const photo = (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
      style={{ objectPosition: position }}
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
      style={{ clipPath: clip }}
    >
      <motion.div className="absolute inset-x-0 -inset-y-[4%] will-change-transform" style={{ y, scale }}>
        {photo}
      </motion.div>
    </motion.div>
  );
}
