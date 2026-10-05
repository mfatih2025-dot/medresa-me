"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/*
 * The footer's background drawing: a fragment of one large construction drawing,
 * after the Medresa seal (a double ring) and the geometry of its arches. Centred
 * off the top-right of the footer and cropped by its edges.
 *
 * Sequence, once, as the footer comes into view: the horizontal axis → the
 * vertical axis → their intersection → the double ring → the eight-point star
 * (two squares) → its {8/3} star → the pointed arch inside it. Then one quiet
 * continuation: a dashed construction circle turning very slowly (paused while
 * the footer is off screen). It is not redrawn on re-entry: a drawing, once
 * made, stays made.
 *
 * Every stroke has pathLength=1 and is drawn with stroke-dashoffset; the
 * observer only sets data attributes on the footer, never React state.
 * Reduced motion: the complete composition, static (see globals.css).
 */

const C = 500;
const R = 440;
/** Point k of eight on the star's circle, from the top, clockwise. */
const pt = (k: number, r = R) => {
  const a = (k * Math.PI) / 4 - Math.PI / 2;
  return `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
};
const poly = (ks: number[]) => `M${ks.map((k) => pt(k)).join(" L")} Z`;

// Equilateral pointed arch: springing at y=560, span 240 (380 → 620).
const ARCH = "M380 760 L380 560 A240 240 0 0 1 500 352.2 A240 240 0 0 1 620 560 L620 760";

/** Timing of one stroke: delay and duration in seconds. */
const at = (t: number, d: number) => ({ "--t": `${t}s`, "--d": `${d}s` }) as CSSProperties;

const gold = "var(--color-gold)";
const ivory = "var(--color-ivory)";

export function FooterLines() {
  const ref = useRef<SVGSVGElement>(null);

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

  const line = { fill: "none", vectorEffect: "non-scaling-stroke", pathLength: 1 } as const;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-[58%] -top-20 aspect-square w-[150%] md:-right-[30%] md:-top-48 md:w-[95%] lg:-right-[32%] lg:top-[-24vw] lg:w-[64%]"
    >
      <svg
        ref={ref}
        viewBox="0 0 1000 1000"
        className="absolute inset-0 size-full overflow-visible"
        strokeWidth={1}
      >
        {/* 1. Axes, running far past the drawing (cropped by the footer). */}
        <line
          {...line}
          className="fl-line"
          style={at(0.15, 1.8)}
          x1={-2400}
          y1={C}
          x2={3400}
          y2={C}
          stroke={ivory}
          strokeOpacity={0.09}
        />
        <line
          {...line}
          className="fl-line"
          style={at(0.75, 1.6)}
          x1={C}
          y1={-1400}
          x2={C}
          y2={2600}
          stroke={ivory}
          strokeOpacity={0.09}
        />
        {/* Diagonals of the square grid. */}
        <line
          {...line}
          className="fl-line"
          style={at(2.6, 2.2)}
          x1={-400}
          y1={-400}
          x2={1400}
          y2={1400}
          stroke={ivory}
          strokeOpacity={0.05}
        />
        <line
          {...line}
          className="fl-line"
          style={at(2.8, 2.2)}
          x1={1400}
          y1={-400}
          x2={-400}
          y2={1400}
          stroke={ivory}
          strokeOpacity={0.05}
        />

        {/* 2. The intersection. */}
        <g className="fl-mark" style={at(1.55, 0.6)} stroke={gold} strokeOpacity={0.4} fill="none">
          <circle cx={C} cy={C} r={7} vectorEffect="non-scaling-stroke" />
        </g>

        {/* 3. The double ring of the seal, drawn from the top. */}
        <g transform={`rotate(-90 ${C} ${C})`} stroke={gold}>
          <circle
            {...line}
            className="fl-line"
            style={at(1.8, 2.6)}
            cx={C}
            cy={C}
            r={470}
            strokeOpacity={0.2}
          />
          <circle
            {...line}
            className="fl-line"
            style={at(2.1, 2.6)}
            cx={C}
            cy={C}
            r={R}
            strokeOpacity={0.16}
          />
          <circle
            {...line}
            className="fl-line"
            style={at(4.6, 2)}
            cx={C}
            cy={C}
            r={170}
            strokeOpacity={0.12}
          />
        </g>

        {/* 4. The eight-point star: two squares on the inner ring. */}
        <path
          {...line}
          className="fl-line"
          style={at(3.0, 2.4)}
          d={poly([0, 2, 4, 6])}
          stroke={gold}
          strokeOpacity={0.15}
        />
        <path
          {...line}
          className="fl-line"
          style={at(3.3, 2.4)}
          d={poly([1, 3, 5, 7])}
          stroke={gold}
          strokeOpacity={0.15}
        />
        {/* Its {8/3} star. */}
        <path
          {...line}
          className="fl-line"
          style={at(4.1, 3.2)}
          d={poly([0, 3, 6, 1, 4, 7, 2, 5])}
          stroke={gold}
          strokeOpacity={0.09}
        />

        {/* 5. The second structure: a pointed arch, as in the Medresa's arcades. */}
        <line
          {...line}
          className="fl-line"
          style={at(5.2, 1.2)}
          x1={300}
          y1={560}
          x2={700}
          y2={560}
          stroke={ivory}
          strokeOpacity={0.08}
        />
        <path
          {...line}
          className="fl-line"
          style={at(5.5, 2.6)}
          d={ARCH}
          stroke={gold}
          strokeOpacity={0.22}
        />
      </svg>

      {/* 6. Continuation: a dashed construction circle, turning very slowly. */}
      <svg viewBox="0 0 1000 1000" className="fl-turn absolute inset-0 size-full">
        <circle
          cx={C}
          cy={C}
          r={330}
          fill="none"
          stroke={gold}
          strokeOpacity={0.14}
          strokeWidth={1}
          strokeDasharray="2 10"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
