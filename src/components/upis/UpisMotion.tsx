"use client";

import { motion, useInView, useTransform } from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/*
 * The page is typography; this is how it moves.
 *
 *   Letters  a line of type rising out of its mask while its letters close up
 *            from wide spacing, like type being set. Letters only move to the
 *            right of their resting place and the mask clips vertically only,
 *            so nothing is cut sideways. Transforms only: no layout change,
 *            no shift of anything around it.
 *   Depth    a block that trails the scroll by a few pixels: lines of one
 *            title read at slightly different rates
 *   Line     a gold run drawn once from one end
 *   Path     a vertical gold run drawn by reading
 *   Soft     a quiet block appearing once (opacity + a small rise)
 *
 * Everything resolves and then stays still. Reduced motion: in place.
 */

const draw = [0.65, 0, 0.35, 1] as const;
const settle = [0.23, 1, 0.32, 1] as const;
const view = { once: true, margin: "0px 0px -12% 0px" } as const;

/**
 * A stage that opens `after` seconds from mount: motion inside waits for it, so
 * a passage already in the first viewport plays after the title, not with it.
 * Reached later by scrolling, the stage is long open and adds no delay.
 */
const StageOpen = createContext(true);
export function Stage({ after, children }: { after: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), after * 1000);
    return () => window.clearTimeout(id);
  }, [after]);
  return <StageOpen.Provider value={open}>{children}</StageOpen.Provider>;
}

export function Letters({
  text,
  delay = 0,
  duration = 1.05,
  spread = 0.045,
  immediate = false,
  className = "",
}: {
  text: string;
  delay?: number;
  duration?: number;
  /** How far apart (em, per letter) the letters start. */
  spread?: number;
  immediate?: boolean;
  className?: string;
}) {
  const { reduced } = useMotionProfile();
  const mask = useRef<HTMLSpanElement>(null);
  const seen = useInView(mask, view);
  const stage = useContext(StageOpen);
  const shown = (immediate || seen) && stage;
  if (reduced) return <span className={`block ${className}`}>{text}</span>;
  const chars = [...text];
  return (
    <span
      ref={mask}
      className={`-my-[0.12em] block py-[0.12em] [overflow-x:visible] [overflow-y:clip] ${className}`}
    >
      <motion.span
        className="block whitespace-pre"
        initial={{ y: "108%" }}
        animate={{ y: shown ? "0%" : "108%" }}
        transition={{ duration, delay, ease: settle }}
      >
        {chars.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ x: `${i * spread}em` }}
            animate={{ x: shown ? "0em" : `${i * spread}em` }}
            transition={{ duration: duration + 0.4, delay, ease: settle }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
        ))}
      </motion.span>
    </span>
  );
}

/** Trails the scroll by up to `px` pixels across the element's pass (desktop and phones). */
export function Depth({
  children,
  px = 24,
  className = "",
  offset = ["start end", "end start"],
}: {
  children: ReactNode;
  px?: number;
  className?: string;
  offset?: ["start end", "end start"] | ["start start", "end start"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, offset);
  const y = useTransform(p, [0, 1], [0, compact ? px * 0.6 : px]);
  return (
    <motion.div ref={ref} className={className} style={reduced ? { y: 0 } : { y }}>
      {children}
    </motion.div>
  );
}

export function Line({
  origin = "left",
  delay = 0,
  duration = 1,
  immediate = false,
  fade,
  className = "",
  style,
}: {
  origin?: "left" | "right" | "top";
  delay?: number;
  duration?: number;
  immediate?: boolean;
  fade?: "left" | "right";
  className?: string;
  style?: CSSProperties;
}) {
  const { reduced } = useMotionProfile();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, view);
  const stage = useContext(StageOpen);
  const vertical = origin === "top";
  const fill = fade
    ? { background: `linear-gradient(to ${fade}, var(--color-gold) 45%, transparent)` }
    : undefined;
  // Literal class names (Tailwind only generates what it can read).
  const shape = vertical ? "w-px origin-top" : origin === "right" ? "h-px origin-right" : "h-px origin-left";
  const base = `pointer-events-none absolute block ${fade ? "" : "bg-gold"} ${shape} ${className}`;
  if (reduced) return <span aria-hidden className={base} style={{ ...style, ...fill }} />;
  const from = vertical ? { scaleY: 0 } : { scaleX: 0 };
  const to = vertical ? { scaleY: 1 } : { scaleX: 1 };
  return (
    <motion.span
      ref={ref}
      aria-hidden
      className={base}
      style={{ ...style, ...fill }}
      initial={from}
      animate={(immediate || seen) && stage ? to : from}
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

export function Soft({
  children,
  delay = 0,
  duration = 1,
  y = 12,
  immediate = false,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  immediate?: boolean;
  className?: string;
}) {
  const { reduced, compact } = useMotionProfile();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, view);
  const stage = useContext(StageOpen);
  if (reduced) return <div className={className}>{children}</div>;
  const from = { opacity: 0, transform: `translate3d(0, ${compact ? y * 0.6 : y}px, 0)` };
  const to = { opacity: 1, transform: "translate3d(0, 0px, 0)" };
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={from}
      animate={(immediate || seen) && stage ? to : from}
      transition={{ duration, delay, ease: settle }}
    >
      {children}
    </motion.div>
  );
}
