"use client";

import Image from "next/image";
import { motion, useInView, useTransform } from "framer-motion";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { alumniContent, type Generation } from "@/content/alumni";
import { useLocale } from "@/i18n/client";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * Motion for the archive. The pano is a historical document, so it never moves
 * inside its frame and is never cropped: it only appears (a mask opening from
 * the chapter's side, the whole sheet settling 1.02 → 1). Depth comes from the
 * typography around it:
 *
 *   Emerge     a heading rising out of its mask, once
 *   Numeral    a very faint background numeral on a slower plane
 *   Thread     a thin gold line whose length follows the reading through its
 *              chapter — continuity from one generation to the next
 *   PanoFrame  the pano as a button that opens the viewer
 *
 * transform / clip-path / opacity only. Reduced motion: everything in place.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;
const view = { once: true, margin: "0px 0px -10% 0px" } as const;

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
  const mask = useRef<HTMLSpanElement>(null);
  const seen = useInView(mask, view);
  if (reduced) return <span className={`block ${className}`}>{children}</span>;
  return (
    <span ref={mask} className={`-mb-[0.12em] block overflow-hidden pb-[0.12em] ${className}`}>
      <motion.span
        className="block"
        initial={{ transform: "translateY(105%)" }}
        animate={{ transform: seen ? "translateY(0%)" : "translateY(105%)" }}
        transition={{ duration: 0.9, delay, ease: settle }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** A faint numeral behind the chapter that trails the scroll (a slower plane). */
export function Numeral({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const y = useTransform(p, [0, 1], compact ? ["-6%", "6%"] : ["-14%", "14%"]);
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute select-none display leading-[0.8] tracking-[-0.04em] ${className}`}
      style={reduced ? undefined : { y }}
    >
      {children}
    </motion.span>
  );
}

export function Thread({
  axis,
  from,
  className = "",
  style,
}: {
  axis: "x" | "y";
  from: "left" | "right" | "top";
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const p = useScrollProgress(ref, ["start 88%", "end 45%"]);
  const origin = from === "left" ? "origin-left" : from === "right" ? "origin-right" : "origin-top";
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block bg-gold/75 ${axis === "x" ? "h-px" : "w-px"} ${origin} ${className}`}
      style={reduced ? { ...style } : { ...style, ...(axis === "x" ? { scaleX: p } : { scaleY: p }) }}
    />
  );
}

export type PanoReveal = "center" | "left" | "right" | "up";

const closed: Record<PanoReveal, string> = {
  center: "inset(0% 50% 0% 50%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  up: "inset(100% 0% 0% 0%)",
};

export function PanoFrame({
  generation,
  label,
  sizes,
  reveal,
  priority = false,
  hidden = false,
  onOpen,
  className = "",
}: {
  generation: Generation;
  /** The button's accessible name, e.g. „Otvori pano: Generacija VIII“. */
  label: string;
  sizes: string;
  reveal: PanoReveal;
  priority?: boolean;
  /** Hidden while this pano is open in the viewer. */
  hidden?: boolean;
  onOpen: (n: number) => void;
  className?: string;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLButtonElement>(null);
  const { reduced } = useMotionProfile();
  const seen = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const { pano } = generation;
  const image = (
    <Image
      src={pano.src}
      alt={`${alumniContent[locale].ui.pano}: ${label}`}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={pano.blur}
      className="object-contain"
    />
  );
  const base = `group relative block w-full cursor-zoom-in overflow-hidden bg-sand text-left focus-visible:outline-offset-4 ${className}`;
  const style: CSSProperties = {
    aspectRatio: `${pano.width} / ${pano.height}`,
    opacity: hidden ? 0 : 1,
    transition: "opacity 120ms linear",
  };
  if (reduced)
    return (
      <button
        ref={ref}
        type="button"
        data-pano={generation.number}
        aria-label={label}
        onClick={() => onOpen(generation.number)}
        className={base}
        style={style}
      >
        {image}
      </button>
    );
  return (
    <motion.button
      ref={ref}
      type="button"
      data-pano={generation.number}
      aria-label={label}
      onClick={() => onOpen(generation.number)}
      className={base}
      style={style}
      initial={{ clipPath: closed[reveal] }}
      animate={{ clipPath: seen ? "inset(0% 0% 0% 0%)" : closed[reveal] }}
      transition={{ duration: 1.1, ease: draw }}
    >
      <motion.span
        className="absolute inset-0 block"
        initial={{ scale: 1.02 }}
        animate={{ scale: seen ? 1 : 1.02 }}
        transition={{ duration: 1.5, ease: settle }}
      >
        {image}
      </motion.span>
      {/* Hover: a fine gold frame resolves at the edges (the pano itself is untouched). */}
      <span className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-300 group-hover:border-gold/60" />
    </motion.button>
  );
}
