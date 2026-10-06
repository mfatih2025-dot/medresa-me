"use client";

import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { useRef } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * The page's one device: a gold line that gives direction, then horizon.
 *
 *   Line      draws once as it enters, from a chosen origin (left, top, centre)
 *   Horizon   the source's own sky photograph; the vertical line of the mission
 *             meets it and divides along the horizon, left and right
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
 * The horizon: the sky photograph drifts a little slower than the page; its
 * white fade is multiplied into the cream, so the sky dissolves into the page.
 * At its foot the line arriving from the mission divides, left and right.
 */
export function Horizon({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start end", "end start"]);
  // Drifts down a little as the page rises past it; the top overhang keeps it covered.
  const y = useTransform(p, [0, 1], compact ? ["0%", "4%"] : ["0%", "7%"]);
  return (
    <div ref={ref} className="relative">
      {/* The sky fades in from the page at the top; the photograph's own fade to
          white (multiplied into the cream) dissolves it at the foot. */}
      <div className="mis-sky relative aspect-[2.4/1] overflow-hidden md:aspect-[3.2/1] lg:aspect-[3.76/1]">
        <motion.div
          className="absolute inset-x-0 -top-[8%] bottom-0 will-change-transform"
          style={reduced ? undefined : { y }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="100vw"
            className="h-full w-full object-cover object-bottom mix-blend-multiply"
          />
        </motion.div>
      </div>
      {/* The junction is the mission's axis: the content edge of .wrap. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px">
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
    </div>
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
