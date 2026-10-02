"use client";

import { useMotionValue, useMotionValueEvent, useScroll, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

/**
 * Scroll progress of `target` as a plain MotionValue.
 *
 * Re-publishing `scrollYProgress` through our own value keeps every derived
 * transform on the JS path. Framer would otherwise try to hand them to a native
 * scroll timeline, which disagrees with sticky stages.
 */
export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  offset: Offset,
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => progress.set(v));
  useEffect(() => {
    progress.set(scrollYProgress.get());
  }, [progress, scrollYProgress]);
  return progress;
}
