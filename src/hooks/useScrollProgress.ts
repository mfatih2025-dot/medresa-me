"use client";

import { useMotionValue, useMotionValueEvent, useScroll, type MotionValue } from "framer-motion";
import { useEffect, type RefObject } from "react";

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];
type Options = {
  /**
   * Re-measure whenever the page's height changes, not only on scroll and
   * resize. For layouts that must never be read from stale positions: content
   * above (fonts, images, live data) can settle and move the target with no
   * scroll event at all, leaving its progress where it was.
   */
  trackContentSize?: boolean;
};

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
  options: Options = {},
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset, ...options });
  const progress = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => progress.set(v));
  useEffect(() => {
    progress.set(scrollYProgress.get());
  }, [progress, scrollYProgress]);
  return progress;
}
