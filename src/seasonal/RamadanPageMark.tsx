"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { pathFor } from "@/i18n/routes";
import { useLocale } from "@/i18n/client";

/*
 * Ramadan edition, on every inner page: a small mark at the right of the row just
 * below the header (where „← Početna“ stands at the left), clear of every page's
 * own title and content. Its motif follows the kind of page:
 *
 *   news (archive and articles)   a ribbon of eight-point stars, fading out to the left
 *   gallery and alumni            three stars on a fine line, a small constellation
 *   every other page              a crescent with a star, on a fine line
 *
 * The homepage has the hero's crescent instead. On tablets, Upis sets its title in
 * that row, so the mark stays out of it there (data-tall-title). Hidden unless
 * data-seasonal-theme="ramadan" (src/seasonal/ramadan.css).
 */
type Motif = "ribbon" | "stars" | "crescent";

export function RamadanPageMark() {
  const locale = useLocale();
  usePathname(); // re-render on every navigation
  // The address as the visitor sees it, read in the browser only: the server works on
  // rewritten paths (/bs/…, Albanian and English slugs mapped to their routes), so the
  // mark is added once the page is live, never in the server HTML.
  const live = useSyncExternalStore(noop, () => location.pathname, () => null);
  if (live === null) return null;
  const pathname = live.replace(/\/$/, "") || "/";
  if (pathname === pathFor(null, locale)) return null;
  const under = (id: "vijesti" | "galerija" | "alumni" | "upis") =>
    pathname === pathFor(id, locale) || pathname.startsWith(pathFor(id, locale) + "/");
  const motif: Motif = under("vijesti") ? "ribbon" : under("galerija") || under("alumni") ? "stars" : "crescent";
  return (
    <div aria-hidden className="rmd rmd-mark wrap" data-motif={motif} data-tall-title={under("upis") || undefined}>
      <svg viewBox="0 0 160 24" className="rmd-mark-svg">
        <defs>
          <linearGradient id="rmd-mark-line" x1="0" x2="1">
            <stop offset="0" stopColor="#d8b673" stopOpacity="0" />
            <stop offset="1" stopColor="#d8b673" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="rmd-mark-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f1d595" />
            <stop offset="1" stopColor="#b8873d" />
          </linearGradient>
        </defs>
        {motif === "ribbon" ? (
          <g fill="none" stroke="url(#rmd-mark-line)" strokeWidth="0.9">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <g key={i} transform={`translate(${8 + i * 21} 3)`} opacity={0.25 + i * 0.125}>
                <path d="M4 4h10v10H4z" />
                <path d="M9 0.5 17.5 9 9 17.5 0.5 9z" />
              </g>
            ))}
          </g>
        ) : (
          <>
            <path d="M0 12H118" stroke="url(#rmd-mark-line)" strokeWidth="0.9" />
            {motif === "stars" ? (
              <g fill="url(#rmd-mark-gold)">
                {[
                  [124, 12, 2.6],
                  [138, 7, 3.6],
                  [152, 13, 2.2],
                ].map(([x, y, r]) => (
                  <path key={x} d={star(x, y, r)} />
                ))}
              </g>
            ) : (
              <g>
                <path
                  d="M144.5 3.2a8.8 8.8 0 1 0 6.2 15.2 7.4 7.4 0 0 1-6.2-15.2Z"
                  fill="url(#rmd-mark-gold)"
                />
                <path d={star(129, 9, 2.6)} fill="url(#rmd-mark-gold)" />
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

const noop = () => () => {};

/** A four-point star (a slim sparkle) of radius r at (x, y). */
function star(x: number, y: number, r: number) {
  const w = r * 0.28;
  return `M${x} ${y - r}L${x + w} ${y - w}L${x + r} ${y}L${x + w} ${y + w}L${x} ${y + r}L${x - w} ${y + w}L${x - r} ${y}L${x - w} ${y - w}Z`;
}
