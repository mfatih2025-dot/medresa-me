"use client";

import { motion, type MotionValue } from "framer-motion";
import { useLayoutEffect } from "react";

export type AnniversaryWords = {
  /** Phones: two words, one each side of the emblem. */
  short: readonly [string, string];
  /** Tablets and desktops, where there is room: the full message, split by the emblem. */
  full: readonly [string, string];
};

/*
 * 18 godina postojanja: a quiet anniversary line in the top bar, in the space the
 * bar already has. The two halves sit either side of the emblem (phones and tablets)
 * or, once the navigation stands beside the emblem (xl), next to the search and menu
 * buttons. Every 25 s (see .anniv in globals.css): a gold hairline draws out from the
 * emblem, the words fade in with one slow gold sheen, hold 4 s and fade away. Nothing
 * scales or moves; the bar, the emblem and the buttons keep their places and sizes.
 *
 * The header checks each variant's real box (useAnniversaryFit) and shows the full
 * message, the short one, or none, so the words never touch a button, a link or the
 * emblem. Reduced motion: the line stands still, without the cycle.
 */
export function AnniversaryPiece({
  side,
  place,
  words,
  x,
}: {
  side: "left" | "right";
  place: "inner" | "outer";
  words: AnniversaryWords;
  x: MotionValue<number>;
}) {
  const i = side === "left" ? 0 : 1;
  // Beside the emblem the words lean on it; beside a button they lean on the button's side.
  const anchor = (side === "left") === (place === "inner") ? "right-0" : "left-0";
  // The line draws from the end nearest the emblem.
  const toward = side === "left" ? "origin-right" : "origin-left";
  const position =
    place === "inner"
      ? `${side === "left" ? "right-0 md:right-2.5" : "left-0 md:left-2.5"} xl:hidden`
      : `${side === "left" ? "left-[4.25rem]" : "right-[4.25rem]"} hidden xl:block`;
  return (
    <motion.span
      aria-hidden
      data-anniv-piece={`${place}-${side}`}
      className={`anniv pointer-events-none absolute top-1/2 -translate-y-1/2 ${position}`}
      style={{ x }}
    >
      {(["short", "full"] as const).map((v) => (
        <span key={v} data-variant={v} className={`anniv-variant anniv-${v} ${anchor}`}>
          <span className="anniv-text">{words[v][i]}</span>
          <span className={`anniv-line ${toward}`} />
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Which message fits the bar right now — full, short or none — written to the header as
 * data-anniv. Checked on load, on resize and once the fonts are in, in the bar's top state
 * (its widest emblem; the compact bar only has more room).
 */
export function useAnniversaryFit() {
  useLayoutEffect(() => {
    const h = document.querySelector<HTMLElement>(".medresa-header");
    if (!h) return;
    const fit = () => {
      // Every variant is laid out (only hidden), so its real box can be checked against
      // everything it must not touch: the buttons, the navigation, the emblem and the bar's ends.
      // Clear of the navigation by more than of a button, so the words never read as a link.
      const keep = [...h.querySelectorAll(".header-row button, .header-row nav, .header-logo")]
        .map((e) => ({ q: e.getBoundingClientRect(), gap: e.tagName === "NAV" ? 20 : 6 }))
        .filter(({ q }) => q.width > 0);
      const bar = h.querySelector(".header-row")?.getBoundingClientRect();
      if (!bar) return;
      const gap = 6;
      const fits = (v: "short" | "full") =>
        [...h.querySelectorAll(`[data-anniv-piece] [data-variant="${v}"]`)]
          .filter((el) => getComputedStyle(el.parentElement as Element).display !== "none")
          .every((el) => {
            const q = el.getBoundingClientRect();
            const inside = q.left >= bar.left + gap && q.right <= bar.right - gap;
            return inside && keep.every((o) => q.right + o.gap <= o.q.left || q.left - o.gap >= o.q.right);
          });
      const phone = window.innerWidth < 768;
      h.dataset.anniv = !phone && fits("full") ? "full" : fits("short") ? "short" : "off";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(h);
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, []);
}
