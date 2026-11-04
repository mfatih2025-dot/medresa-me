"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/*
 * The Golden Light Trail (Ramadan edition), reusable: laid over a frame (a
 * photograph, a stage), it waits until the frame comes into view, then once
 * traces its edge with a fine champagne-gold line, a small light running ahead,
 * and leaves the line as the frame's golden edge. Optionally, four restrained
 * eight-point stars are set on the line where each rounded corner turns, once the
 * line is drawn.
 *
 * The parent must be positioned (it is laid at inset 1px). `radius` follows the
 * frame's own rounding, in px, from phones up: [base, md, lg]. Hidden, and never
 * observed, unless data-seasonal-theme="ramadan" (src/seasonal/ramadan.css).
 */
export function GoldenTrail({ radius = [0], corners = false }: { radius?: number[]; corners?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // A hidden trail (theme off) never intersects, so it is never lit.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.setAttribute("data-lit", "");
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [base, md = base, lg = md] = radius;
  return (
    <span
      ref={ref}
      aria-hidden
      className="rmd rmd-trail"
      // Corner stars sit on the rounded edge itself, where it turns (45°): 0.293 r in from both sides.
      style={{ "--rmd-corner": `${(base * 0.293 - 7).toFixed(1)}px`, "--rmd-corner-md": `${(md * 0.293 - 8).toFixed(1)}px`, "--rmd-corner-lg": `${(lg * 0.293 - 9).toFixed(1)}px` } as CSSProperties}
    >
      <svg className="rmd-trail-svg">
        {/* One rect per rounding, shown at its breakpoint (rx as an attribute works everywhere). */}
        {(
          [
            ["base", base],
            ["md", md],
            ["lg", lg],
          ] as const
        ).map(([at, r]) => (
          <g key={at} className="rmd-trail-at" data-at={at}>
            <rect className="rmd-trail-line" width="100%" height="100%" rx={Math.max(0, r - 1)} pathLength={1} />
            <rect className="rmd-trail-spark" width="100%" height="100%" rx={Math.max(0, r - 1)} pathLength={1} />
          </g>
        ))}
      </svg>
      {corners &&
        ["tl", "tr", "bl", "br"].map((c) => (
          <svg key={c} className="rmd-trail-corner" data-corner={c} viewBox="0 0 24 24">
            <circle className="rmd-corner-bg" cx="12" cy="12" r="8.6" />
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M12 4.2 19.8 12 12 19.8 4.2 12z" />
            <circle cx="12" cy="12" r="1.3" />
          </svg>
        ))}
    </span>
  );
}
