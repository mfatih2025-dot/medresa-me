"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/*
 * The footer's background drawing: a fragment of a large mihrab, after the
 * Medresa's own arches. A rectangular frame (alfiz) around three nested pointed
 * arches, running past the footer's edges so only part of it is seen, and a
 * low arcade of small pointed arches along the footer's base.
 *
 * Sequence, once, as the footer comes into view: the frame → the outer arch,
 * rising from both jambs to meet at its apex → the second arch → the niche →
 * the arcade, travelling across the base. Then only the niche breathes, very
 * slowly, while the footer is on screen. Not redrawn on re-entry.
 *
 * Every stroke has pathLength=1 and is drawn with stroke-dashoffset; the
 * observer only sets data attributes on the footer, never React state.
 * Reduced motion: the complete drawing, static (see globals.css).
 */

const CX = 500;
const SPRING = 600;
const BASE = 2000;

/**
 * The two halves of an equilateral pointed arch over jambs at ±half (centres on
 * the outer arch's jambs, so nested arches stay concentric), from the foot of
 * each jamb up to the apex.
 */
function arch(half: number, radius = 600) {
  const l = CX - half;
  const r = CX + half;
  const apex = (SPRING - Math.sqrt(radius ** 2 - 300 ** 2)).toFixed(1);
  return [
    `M${l} ${BASE} L${l} ${SPRING} A${radius} ${radius} 0 0 1 ${CX} ${apex}`,
    `M${r} ${BASE} L${r} ${SPRING} A${radius} ${radius} 0 0 0 ${CX} ${apex}`,
  ];
}

/** A row of small equilateral pointed arches on columns, from x=0 to `width`. */
function arcade(width: number, span: number, rise: number, foot: number) {
  const h = (span * Math.sqrt(3)) / 2;
  let d = `M0 ${foot}`;
  for (let x = 0; x < width; x += span) {
    d += ` L${x} ${foot - rise} A${span} ${span} 0 0 1 ${x + span / 2} ${(foot - rise - h).toFixed(1)}`;
    d += ` A${span} ${span} 0 0 1 ${x + span} ${foot - rise} L${x + span} ${foot}`;
  }
  return d;
}

/** Timing of one stroke: delay and duration in seconds. */
const at = (t: number, d: number) => ({ "--t": `${t}s`, "--d": `${d}s` }) as CSSProperties;

const gold = "var(--color-gold)";
const ivory = "var(--color-ivory)";
const line = { fill: "none", vectorEffect: "non-scaling-stroke", pathLength: 1 } as const;

export function FooterLines() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = ref.current?.closest("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) footer.dataset.drawn = "";
        footer.toggleAttribute("data-live", entry.isIntersecting);
      },
      // Starts once the footer is a little way into the viewport.
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const [outerL, outerR] = arch(300);
  const [secondL, secondR] = arch(264, 564);
  const [nicheL, nicheR] = arch(190, 490);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {/* The mihrab: off the right edge, taller than the footer. */}
      <svg
        viewBox="0 0 1000 2000"
        className="absolute -right-[46%] -top-6 w-[112%] overflow-visible md:-right-[16%] md:-top-10 md:w-[62%] lg:-right-[4%] lg:-top-16 lg:w-[44%] xl:w-[40%]"
        strokeWidth={1}
      >
        {/* Alfiz: the rectangular frame, top first, then down both sides. */}
        <path
          {...line}
          className="fl-line"
          style={at(0.2, 1.6)}
          d="M100 0 H900"
          stroke={ivory}
          strokeOpacity={0.08}
        />
        <path
          {...line}
          className="fl-line"
          style={at(0.6, 2)}
          d={`M100 0 V${BASE}`}
          stroke={gold}
          strokeOpacity={0.14}
        />
        <path
          {...line}
          className="fl-line"
          style={at(0.6, 2)}
          d={`M900 0 V${BASE}`}
          stroke={gold}
          strokeOpacity={0.14}
        />

        {/* The arches rise from both jambs and meet at the apex. */}
        <path
          {...line}
          className="fl-line"
          style={at(1.2, 2.6)}
          d={outerL}
          stroke={gold}
          strokeOpacity={0.22}
        />
        <path
          {...line}
          className="fl-line"
          style={at(1.2, 2.6)}
          d={outerR}
          stroke={gold}
          strokeOpacity={0.22}
        />
        <path
          {...line}
          className="fl-line"
          style={at(1.7, 2.6)}
          d={secondL}
          stroke={gold}
          strokeOpacity={0.12}
        />
        <path
          {...line}
          className="fl-line"
          style={at(1.7, 2.6)}
          d={secondR}
          stroke={gold}
          strokeOpacity={0.12}
        />

        {/* Impost: the springing line, drawn across the jambs. */}
        <path
          {...line}
          className="fl-line"
          style={at(3.2, 1.4)}
          d={`M100 ${SPRING} H900`}
          stroke={ivory}
          strokeOpacity={0.06}
        />

        {/* The niche: the last arch, which keeps breathing. */}
        <g className="fl-breathe">
          <path
            {...line}
            className="fl-line"
            style={at(3.6, 2.4)}
            d={nicheL}
            stroke={gold}
            strokeOpacity={0.18}
          />
          <path
            {...line}
            className="fl-line"
            style={at(3.6, 2.4)}
            d={nicheR}
            stroke={gold}
            strokeOpacity={0.18}
          />
        </g>
      </svg>

      {/* The arcade along the base, travelling across the footer. */}
      <svg
        viewBox="0 0 3600 120"
        className="absolute bottom-0 left-0 h-[5.5rem] w-[165rem] overflow-visible md:h-[7.5rem] md:w-[225rem]"
        strokeWidth={1}
      >
        <path
          {...line}
          className="fl-line"
          style={at(4.4, 4.5)}
          d={arcade(3600, 60, 34, 120)}
          stroke={gold}
          strokeOpacity={0.1}
        />
      </svg>
    </div>
  );
}
