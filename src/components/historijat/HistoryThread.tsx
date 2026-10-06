"use client";

import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";

/*
 * The thread of history: one thin gold line drawn through the whole page, like
 * a line on an architect's sheet. It leaves the opening, runs down a margin,
 * turns at each chapter to arrive at its rule, and continues to the next one;
 * photographs sit above it, so it passes behind them.
 *
 * Its route is not drawn by hand: every element marked [data-thread] in the
 * layout is a point the line must reach (in document order, ignoring hidden
 * ones), so the same line simplifies on phones — where the anchors share one
 * margin — and becomes expressive on desktop, where they move across the grid.
 *
 * The drawn length follows the reading line (62% down the viewport): as that
 * line passes a point, the thread has reached it. A horizontal turn is spread
 * over the 140px before the point, so the line never jumps. Scroll is only
 * read (MotionValues, no React state per frame). A faint full track sits
 * beneath, so the route is legible before it is drawn. Reduced motion: the
 * complete line, static.
 */

type Pt = { x: number; y: number };

const RADIUS = 22;
const TURN = 140;

/** Orthogonal route through the points: down, then across to each next point. */
function route(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  points.forEach((p, i) => {
    if (i === 0) return out.push(p);
    const prev = out[out.length - 1];
    if (prev.x !== p.x && prev.y !== p.y) out.push({ x: prev.x, y: p.y });
    out.push(p);
  });
  return out.filter((p, i) => i === 0 || p.x !== out[i - 1].x || p.y !== out[i - 1].y);
}

/** SVG path for a polyline with softened corners. */
function toPath(pts: Pt[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const next = pts[i + 1];
    if (!next) {
      d += ` L${p.x} ${p.y}`;
      break;
    }
    const prev = pts[i - 1];
    const r = Math.min(RADIUS, dist(prev, p) / 2, dist(p, next) / 2);
    const a = toward(p, prev, r);
    const b = toward(p, next, r);
    d += ` L${a.x} ${a.y} Q${p.x} ${p.y} ${b.x} ${b.y}`;
  }
  return d;
}
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const toward = (from: Pt, to: Pt, r: number) => {
  const d = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / d) * r, y: from.y + ((to.y - from.y) / d) * r };
};

/** Reading-line positions (y) and the fraction of the line drawn at each. */
function schedule(pts: Pt[]) {
  const ys: number[] = [];
  const ls: number[] = [];
  let length = 0;
  pts.forEach((p, i) => {
    if (i > 0) length += dist(pts[i - 1], p);
    let y = p.y;
    // A horizontal run is drawn while the reading line covers the TURN px above it.
    if (i > 0 && pts[i - 1].y === p.y) {
      ys[ys.length - 1] = Math.max(p.y - TURN, (ys[ys.length - 2] ?? -Infinity) + 1);
    }
    if (ys.length && y <= ys[ys.length - 1]) y = ys[ys.length - 1] + 1;
    ys.push(y);
    ls.push(length);
  });
  return { ys, ls: ls.map((l) => (length ? l / length : 0)) };
}

export function HistoryThread({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotionProfile();
  const [shape, setShape] = useState<{ d: string; w: number; h: number } | null>(null);
  const plan = useRef<{ ys: number[]; ls: number[]; top: number }>({ ys: [0], ls: [0], top: 0 });
  const viewport = useMotionValue(800);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const anchors = [...el.querySelectorAll<HTMLElement>("[data-thread]")].filter(
        (a) => a.offsetParent !== null,
      );
      const pts = anchors.map((a) => {
        const r = a.getBoundingClientRect();
        return { x: Math.round(r.left - box.left), y: Math.round(r.top - box.top + r.height / 2) };
      });
      const path = route(pts);
      const s = schedule(path);
      plan.current = { ...s, top: box.top + window.scrollY };
      viewport.set(window.innerHeight);
      setShape({ d: toPath(path), w: Math.round(box.width), h: Math.round(box.height) });
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(queue);
    ro.observe(el);
    window.addEventListener("resize", queue);
    // Late images/fonts can move anchors without resizing the container.
    window.addEventListener("load", queue);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", queue);
      window.removeEventListener("load", queue);
      cancelAnimationFrame(frame);
    };
  }, [viewport]);

  const { scrollY } = useScroll();
  const drawn = useTransform(() => {
    const { ys, ls, top } = plan.current;
    const y = scrollY.get() + viewport.get() * 0.62 - top;
    if (y <= ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) {
      if (y < ys[i]) return ls[i - 1] + ((y - ys[i - 1]) / (ys[i] - ys[i - 1])) * (ls[i] - ls[i - 1]);
    }
    return 1;
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {shape && (
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible"
          width={shape.w}
          height={shape.h}
          viewBox={`0 0 ${shape.w} ${shape.h}`}
          fill="none"
        >
          <path d={shape.d} stroke="var(--color-gold)" strokeOpacity={0.22} strokeWidth={1} />
          <motion.path
            d={shape.d}
            stroke="var(--color-gold)"
            strokeWidth={1.25}
            strokeLinecap="round"
            style={{ pathLength: reduced ? 1 : drawn }}
          />
        </svg>
      )}
      {children}
    </div>
  );
}

/** A point the thread must reach: an invisible 1px mark, positioned by its parent's layout. */
export function ThreadPoint({ className = "" }: { className?: string }) {
  return <span aria-hidden data-thread className={`block h-px w-px ${className}`} />;
}
