"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
 * Ramadan edition: light along the site's own gold lines. On every page, the fine
 * gold hairlines the design already has (rules under titles, columns, dividers;
 * the hero excepted) are found once and marked data-rmd-line ("h" or "v"); as each
 * comes into view it is marked data-lit, and one soft glint travels along it, once
 * (src/seasonal/ramadan.css). Lines that already carry an image of their own are
 * left alone. Does nothing unless data-seasonal-theme="ramadan".
 */
export function SeasonalLights() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.seasonalTheme !== "ramadan") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-lit", "");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.6 },
    );
    const scan = () => {
      for (const el of document.querySelectorAll<HTMLElement>(
        'main [class*="bg-gold"]:not([data-rmd-line]), body > footer [class*="bg-gold"]:not([data-rmd-line])',
      )) {
        if (el.closest(".hero-frame, .rmd")) continue;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const dir = h > 0 && h <= 2 && w >= 24 ? "h" : w > 0 && w <= 2 && h >= 24 ? "v" : null;
        if (!dir || getComputedStyle(el).backgroundImage !== "none") continue;
        el.dataset.rmdLine = dir;
        io.observe(el);
      }
    };
    scan();
    // Pages that build parts of themselves later (lists, sliders) are scanned again.
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    const main = document.querySelector("main");
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
