"use client";

import Image from "next/image";
import { motion, useInView, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * The page's one device: a gold line that gives direction, then horizon.
 *
 *   Line      draws once as it enters, from a chosen origin (left, top, centre)
 *   Horizon   the vertical line of the mission meets it and divides along the
 *             horizon, left and right
 *   Signature the authentic PNG, revealed by a mask in the direction of writing
 *
 * transform/clip only, ease-in-out for drawn lines (they move on screen),
 * ease-out for reveals. Reduced motion: everything drawn and visible.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const view = { once: true, margin: "0px 0px -12% 0px" } as const;

export function Line({
  axis = "x",
  origin = "left",
  delay = 0,
  duration = 1.1,
  className = "",
}: {
  axis?: "x" | "y";
  origin?: "left" | "right" | "center" | "top";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const { reduced } = useMotionProfile();
  const from = axis === "x" ? { scaleX: 0 } : { scaleY: 0 };
  const to = axis === "x" ? { scaleX: 1 } : { scaleY: 1 };
  const originClass =
    origin === "left"
      ? "origin-left"
      : origin === "right"
        ? "origin-right"
        : origin === "top"
          ? "origin-top"
          : "origin-center";
  if (reduced) return <span aria-hidden className={`block bg-gold ${className}`} />;
  return (
    <motion.span
      aria-hidden
      className={`block bg-gold ${originClass} ${className}`}
      initial={from}
      whileInView={to}
      viewport={view}
      transition={{ duration, delay, ease: draw }}
    />
  );
}

/**
 * The horizon: the mission's axis meets it and divides, left and right, along
 * the full width of the page — the line that the vision then hangs from.
 */
export function HorizonLine() {
  return (
    <div aria-hidden className="relative h-px">
      {/* The junction is the mission's axis: the content edge of .wrap. */}
      <Line
        axis="x"
        origin="right"
        duration={1.2}
        className="absolute inset-y-0 left-0 w-[calc(var(--gutter)+max(0px,(100%-var(--max))/2))]"
      />
      <Line
        axis="x"
        origin="left"
        duration={1.2}
        className="absolute inset-y-0 right-0 left-[calc(var(--gutter)+max(0px,(100%-var(--max))/2))]"
      />
    </div>
  );
}

/**
 * Type that emerges from a line: the text sits in a mask whose top edge is the
 * line above it, and drops out from under it once — the heading visibly
 * belongs to that line. Reduced motion: in place.
 */
export function Emerge({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { reduced } = useMotionProfile();
  // Observe the mask (always in place), not the text, which starts outside it.
  const mask = useRef<HTMLSpanElement>(null);
  const inView = useInView(mask, view);
  if (reduced) return <span className={`block ${className}`}>{children}</span>;
  return (
    <span ref={mask} className={`block overflow-hidden pb-[0.12em] -mb-[0.12em] ${className}`}>
      <motion.span
        className="block"
        initial={{ transform: "translateY(-105%)" }}
        animate={{ transform: inView ? "translateY(0%)" : "translateY(-105%)" }}
        transition={{ duration: 0.75, delay, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * The mission's axis: drawn by reading. Its length follows the scroll through
 * the mission, reaching the horizon as the mission ends (transform only).
 */
export function Axis({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 82%", "end 70%"]);
  const scaleY = useTransform(p, [0, 1], [0, 1]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`block origin-top bg-gold ${className}`}
      style={reduced ? undefined : { scaleY }}
    />
  );
}

/** The signature, written into view: a mask opening left to right. */
export function Signature({
  src,
  alt,
  width,
  height,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  const { reduced } = useMotionProfile();
  const img = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes="(min-width: 768px) 260px, 210px"
      className="h-auto w-full"
    />
  );
  if (reduced) return <div className={className}>{img}</div>;
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
      viewport={view}
      transition={{ duration: 1.4, delay: 0.35, ease: draw }}
    >
      {img}
    </motion.div>
  );
}
