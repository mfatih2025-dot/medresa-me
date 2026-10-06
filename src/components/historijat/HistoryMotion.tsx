"use client";

import { motion, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/**
 * A period marker (2008, 2015, Danas …): set very large, it drifts a little
 * slower than the page as its chapter passes — the period stays in view a
 * moment longer than the text beside it. Decorative (the date itself is in the
 * chapter's text as a <time>); transform only. Reduced motion: still.
 */
export function Marker({
  children,
  className = "",
  travel = 56,
}: {
  children: ReactNode;
  className?: string;
  /** Total drift in px on desktop (half on phones). */
  travel?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();
  const p = useScrollProgress(ref, ["start end", "end start"]);
  const t = compact ? travel / 2 : travel;
  const y = useTransform(p, [0, 1], [-t / 2, t / 2]);
  return (
    <div ref={ref} aria-hidden className={className}>
      <motion.div className="will-change-transform" style={reduced ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * A rule that draws from the left as it enters (the line the thread arrives
 * at). Once, on view; scale only. Reduced motion: drawn.
 */
export function DrawRule({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  const { reduced } = useMotionProfile();
  if (reduced) return <span aria-hidden className={`block h-px origin-left ${className}`} />;
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={{ duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }}
    />
  );
}
