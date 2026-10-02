"use client";

import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";

/**
 * Hero → Vijesti takeover. The hero is held in place (CSS sticky) while the
 * sections after it scroll up over it like a new sheet; Vijesti's ivory surface,
 * with rounded top corners, is the leading edge. Native scrolling throughout —
 * the only scripted value is a faint dimming of the hero as it is covered.
 *
 * The held hero is released only at the end of this group (Vijesti + Generacije),
 * long after it is fully covered, so the release is never seen.
 * Reduced motion: no hold — the hero scrolls away normally.
 */
export function HeroStage({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  const { reduced } = useMotionProfile();
  const { scrollY } = useScroll();
  const vh = useMotionValue(800);
  useEffect(() => {
    const set = () => vh.set(window.innerHeight);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [vh]);
  // Dims from nothing to a quiet 0.3 over the first screen of scroll (while it is covered).
  const dim = useTransform(() => Math.min(1, Math.max(0, scrollY.get() / vh.get())) * 0.3);

  return (
    <div className="relative">
      <div className="sticky top-0 z-0 motion-reduce:relative">
        {hero}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[rgb(6_18_15)]"
          style={{ opacity: reduced ? 0 : dim }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
