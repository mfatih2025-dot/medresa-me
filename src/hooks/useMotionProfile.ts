"use client";

import { useSyncExternalStore } from "react";

type Profile = { reduced: boolean; compact: boolean };

const queries = {
  reduced: "(prefers-reduced-motion: reduce)",
  // Phones and small tablets get lighter, shorter motion.
  compact: "(max-width: 767px), (pointer: coarse)",
};

function subscribe(cb: () => void) {
  const lists = Object.values(queries).map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", cb));
  return () => lists.forEach((l) => l.removeEventListener("change", cb));
}

let cache: Profile = { reduced: false, compact: false };
function getSnapshot(): Profile {
  const next = {
    reduced: window.matchMedia(queries.reduced).matches,
    compact: window.matchMedia(queries.compact).matches,
  };
  if (next.reduced !== cache.reduced || next.compact !== cache.compact) cache = next;
  return cache;
}
const server: Profile = { reduced: false, compact: false };

/** Central switch for every motion decision: reduced-motion + phone tuning. */
export function useMotionProfile(): Profile {
  return useSyncExternalStore(subscribe, getSnapshot, () => server);
}
