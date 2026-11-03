"use client";

import { useId } from "react";

/** The mihrab's two arches, closed at their feet: the band between them carries the lattice. */
const OUTER = "M40 640 V300 A320 320 0 0 1 200 22.9 A320 320 0 0 1 360 300 V640 Z";
const INNER = "M66 640 V300 A268 268 0 0 1 200 68 A268 268 0 0 1 334 300 V640 Z";
const ARCHES = [OUTER.slice(0, -2), INNER.slice(0, -2)];

/** The crescent's place in the arch (its 400 x 640 drawing), and its cut. */
const MOON = { x: 200, y: 222, r: 42, cut: { dx: 19, dy: -13, r: 36 } };

/*
 * Ramadan edition, inside the hero's mihrab (both the phone arch and the tablet /
 * desktop one draw in the same 400 x 640 space, so this sits in either and moves
 * with it). Hidden unless data-seasonal-theme="ramadan" (src/seasonal/ramadan.css):
 *
 *   - a soft champagne light along each arch, drawn with the arches;
 *   - a fine eight-point lattice in the band between them, fading in once drawn;
 *   - a golden crescent: a glow appears, the crescent rises into place and its
 *     light widens, once; then only a very slow breath of that light.
 *
 * Gradients and opacity only: no blur filter over the film.
 */
export function RamadanArch() {
  const id = useId();
  const ref = (name: string) => `${id}${name}`;
  return (
    <g className="rmd rmd-arch" aria-hidden>
      <defs>
        <pattern id={ref("lattice")} width="24" height="24" patternUnits="userSpaceOnUse">
          <path className="rmd-lattice-tile" d="M5 5H19V19H5Z M12 2.1 L21.9 12 L12 21.9 L2.1 12Z" />
        </pattern>
        <clipPath id={ref("band")}>
          <path d={`${OUTER} ${INNER}`} clipRule="evenodd" />
        </clipPath>
        <radialGradient id={ref("light")}>
          <stop offset="0" stopColor="rgb(255 236 196)" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="rgb(240 205 140)" stopOpacity="0.3" />
          <stop offset="1" stopColor="rgb(232 190 120)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ref("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.45" stopColor="#f1d595" />
          <stop offset="1" stopColor="#c99a4f" />
        </linearGradient>
        <mask id={ref("cut")} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="640">
          <rect width="400" height="640" fill="#fff" />
          <circle cx={MOON.x + MOON.cut.dx} cy={MOON.y + MOON.cut.dy} r={MOON.cut.r} fill="#000" />
        </mask>
      </defs>

      {/* Light along the arches, drawn with them (.hero-arch path / .hero-arch-phone path). */}
      {ARCHES.map((d) => (
        <path key={d} className="rmd-arch-glow" d={d} pathLength={1} />
      ))}
      <rect className="rmd-lattice" width="400" height="640" fill={`url(#${ref("lattice")})`} clipPath={`url(#${ref("band")})`} />

      <g className="rmd-moon">
        <circle className="rmd-moon-halo" cx={MOON.x} cy={MOON.y} r={MOON.r * 3.4} fill={`url(#${ref("light")})`} />
        <circle className="rmd-moon-glow" cx={MOON.x} cy={MOON.y} r={MOON.r * 1.9} fill={`url(#${ref("light")})`} />
        <g className="rmd-moon-body">
          <circle cx={MOON.x} cy={MOON.y} r={MOON.r} fill={`url(#${ref("gold")})`} mask={`url(#${ref("cut")})`} />
        </g>
      </g>
    </g>
  );
}
