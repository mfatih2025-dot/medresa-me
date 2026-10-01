"use client";

import { useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";

/**
 * Soft response to scroll velocity: returns a value in [-amount, amount] that
 * eases back to 0 when scrolling stops. Used as a tiny extra offset on imagery.
 */
export function useScrollDrift(amount: number, enabled = true): MotionValue<number> {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { stiffness: 90, damping: 24, mass: 0.6 });
  return useTransform(smooth, [-3000, 0, 3000], enabled ? [-amount, 0, amount] : [0, 0, 0], {
    clamp: true,
  });
}
