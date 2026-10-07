"use client";

import Image from "next/image";
import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { alumniContent, type Generation } from "@/content/alumni";
import { useLocale } from "@/i18n/client";
import { ArrowRight, CloseIcon } from "@/components/ui/icons";

/*
 * The archival viewer: a pano opened for reading names and faces.
 *
 *   Opening   FLIP from the frame on the page (uniform scale + a clip matching
 *             the frame), 420ms ease-out; closing runs back to the frame.
 *   Reading   the page's preview shows at once; the high-resolution file
 *             (≤ 6000px) loads behind it and fades in when ready.
 *   Zoom      pinch, wheel (at the cursor), double-tap / double-click (at the
 *             point), and +/−/fit controls; up to the file's own resolution.
 *             Once open the pano is unclipped, so zooming uses the whole
 *             screen; drag pans until its edges meet the screen's.
 *   Between   swipe (when not zoomed), arrow keys, or the side arrows.
 *   Keys      Esc closes; ←/→ change generation (or pan when zoomed);
 *             + / − zoom; 0 fits. Focus stays inside and returns to the frame.
 *
 * The pano is shown whole and untouched (object-contain, no filter). Reduced
 * motion: fades and instant zoom changes.
 */

const ease = [0.32, 0.72, 0, 1] as const;

type Rect = { x: number; y: number; w: number; h: number };

function targetRect(g: Generation): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = vw < 768;
  const padX = phone ? 0 : Math.round(vw * 0.05);
  const top = phone ? 60 : 72;
  const bottom = phone ? 88 : 92;
  const s = Math.min((vw - padX * 2) / g.pano.width, (vh - top - bottom) / g.pano.height);
  const w = Math.round(g.pano.width * s);
  const h = Math.round(g.pano.height * s);
  return { x: Math.round((vw - w) / 2), y: Math.round(top + (vh - top - bottom - h) / 2), w, h };
}

function fromTile(tile: DOMRect, t: Rect) {
  const s = Math.max(tile.width / t.w, tile.height / t.h);
  const cw = tile.width / s;
  const ch = tile.height / s;
  const ix = ((t.w - cw) / 2 / t.w) * 100;
  const iy = ((t.h - ch) / 2 / t.h) * 100;
  return {
    x: tile.left + tile.width / 2 - (t.x + t.w / 2),
    y: tile.top + tile.height / 2 - (t.y + t.h / 2),
    scale: s,
    clip: `inset(${iy}% ${ix}% ${iy}% ${ix}%)`,
  };
}

const tileOf = (n: number) => document.querySelector<HTMLElement>(`[data-pano="${n}"]`);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** How far a pano zoomed to `s` may move: until its edges meet the screen's edges. */
function limits(s: number, r: Rect) {
  return {
    ex: Math.max(0, (s * r.w - window.innerWidth) / 2 + 24),
    ey: Math.max(0, (s * r.h - window.innerHeight) / 2 + 24),
  };
}

type Gesture =
  | { kind: "pan"; px: number; py: number; x0: number; y0: number; moved: number }
  | { kind: "pinch"; d0: number; s0: number; cx: number; cy: number }
  | { kind: "swipe"; px: number; moved: number }
  | null;

export function PanoViewer({
  list,
  index,
  onIndex,
  onClose,
  reduced,
}: {
  list: readonly Generation[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  reduced: boolean;
}) {
  const a = alumniContent[useLocale()];
  const g = list[index];
  const [rect, setRect] = useState<Rect>(() => targetRect(g));
  const [phase, setPhase] = useState<"open" | "idle" | "closing">(() =>
    reduced || !tileOf(g.number) ? "idle" : "open",
  );
  const [ready, setReady] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const firstN = useRef(g.number);

  // The FLIP layer (opening / closing) and the reading layer (zoom / pan / swipe).
  const backdrop = useMotionValue(0);
  const fx = useMotionValue(0);
  const fy = useMotionValue(0);
  const fs = useMotionValue(1);
  const clip = useMotionValue("inset(0% 0% 0% 0%)");
  const zs = useMotionValue(1);
  const zx = useMotionValue(0);
  const zy = useMotionValue(0);
  const sx = useMotionValue(0);

  const maxScale = Math.min(10, Math.max(1, g.pano.fullWidth / rect.w));

  useLayoutEffect(() => {
    const t = targetRect(list[index]);
    const tile = tileOf(firstN.current);
    if (reduced || !tile) {
      clip.set("none");
      animate(backdrop, 1, { duration: 0.2 });
      return;
    }
    const f = fromTile(tile.getBoundingClientRect(), t);
    fx.set(f.x);
    fy.set(f.y);
    fs.set(f.scale);
    clip.set(f.clip);
    const o = { duration: 0.42, ease };
    animate(backdrop, 1, { duration: 0.3, ease: "easeOut" });
    animate(fx, 0, o);
    animate(fy, 0, o);
    animate(fs, 1, o);
    animate(clip, "inset(0% 0% 0% 0%)", o).then(() => {
      // Open: no clip, so a zoomed pano can use the whole screen.
      clip.set("none");
      setPhase("idle");
    });
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      setRect(targetRect(list[index]));
      zs.set(1);
      zx.set(0);
      zy.set(0);
      setZoomed(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [list, index, zs, zx, zy]);

  /** Zoom to `s`, keeping the content under the viewport point (px, py) in place. */
  const zoomTo = useCallback(
    (s: number, px: number, py: number, animated: boolean) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const s0 = zs.get();
      const s1 = clamp(s, 1, maxScale);
      const ux = (px - cx - zx.get()) / s0;
      const uy = (py - cy - zy.get()) / s0;
      const { ex: mx, ey: my } = limits(s1, rect);
      const x1 = s1 === 1 ? 0 : clamp(px - cx - ux * s1, -mx, mx);
      const y1 = s1 === 1 ? 0 : clamp(py - cy - uy * s1, -my, my);
      if (animated && !reduced) {
        const o = { duration: 0.32, ease };
        animate(zs, s1, o);
        animate(zx, x1, o);
        animate(zy, y1, o);
      } else {
        zs.set(s1);
        zx.set(x1);
        zy.set(y1);
      }
      setZoomed(s1 > 1.01);
    },
    [rect, maxScale, zs, zx, zy, reduced],
  );
  const center = () => [rect.x + rect.w / 2, rect.y + rect.h / 2] as const;

  const close = useCallback(() => {
    if (phase === "closing") return;
    setPhase("closing");
    clip.set("inset(0% 0% 0% 0%)");
    zs.set(1);
    zx.set(0);
    zy.set(0);
    sx.set(0);
    const t = targetRect(list[index]);
    const tile = tileOf(list[index].number);
    const r = tile?.getBoundingClientRect();
    const onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
    animate(backdrop, 0, { duration: 0.32, ease: "easeOut" });
    if (reduced || !r || !onScreen) {
      animate(fs, 0.97, { duration: 0.2 });
      animate(clip, "inset(0% 0% 0% 0%)", { duration: 0.2 }).then(onClose);
      return;
    }
    const f = fromTile(r, t);
    const o = { duration: 0.38, ease };
    animate(fx, f.x, o);
    animate(fy, f.y, o);
    animate(fs, f.scale, o);
    animate(clip, f.clip, o).then(onClose);
  }, [phase, list, index, backdrop, fx, fy, fs, clip, zs, zx, zy, sx, reduced, onClose]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (phase !== "idle") return;
      const n = index + d;
      if (n < 0 || n >= list.length) {
        animate(sx, 0, { duration: 0.25, ease });
        return;
      }
      zs.set(1);
      zx.set(0);
      zy.set(0);
      setZoomed(false);
      sx.set(reduced ? 0 : d * 60);
      animate(sx, 0, { duration: 0.32, ease });
      setRect(targetRect(list[n]));
      onIndex(n);
    },
    [phase, index, list, onIndex, zs, zx, zy, sx, reduced],
  );

  // Keys, scroll lock, focus.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      const [cx, cy] = center();
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const d = e.key === "ArrowRight" ? 1 : -1;
        if (zs.get() > 1.01) zoomTo(zs.get(), cx + d * 120, cy, true);
        else go(d);
      } else if (e.key === "+" || e.key === "=") zoomTo(zs.get() * 1.6, cx, cy, true);
      else if (e.key === "-") zoomTo(zs.get() / 1.6, cx, cy, true);
      else if (e.key === "0") zoomTo(1, cx, cy, true);
      else if (e.key === "Tab") {
        const f = dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!f?.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
      opener?.focus({ preventScroll: true });
    };
    // center() reads the current rect; the handlers below are rebuilt with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [close, go, zoomTo]);

  // Wheel zoom at the cursor (non-passive, so the page never scrolls behind).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (phase !== "idle") return;
      zoomTo(zs.get() * Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomTo, zs, phase]);

  // Pointers: pinch, pan, swipe, double tap.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  const startFrom = (map: Map<number, { x: number; y: number }>) => {
    const pts = [...map.values()];
    if (pts.length >= 2) {
      const [p, q] = pts;
      const [cx, cy] = center();
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      gesture.current = {
        kind: "pinch",
        d0: Math.hypot(p.x - q.x, p.y - q.y) || 1,
        s0: zs.get(),
        cx: (mx - cx - zx.get()) / zs.get(),
        cy: (my - cy - zy.get()) / zs.get(),
      };
    } else if (pts.length === 1) {
      const [p] = pts;
      gesture.current =
        zs.get() > 1.01
          ? { kind: "pan", px: p.x, py: p.y, x0: zx.get(), y0: zy.get(), moved: 0 }
          : { kind: "swipe", px: p.x, moved: 0 };
    } else gesture.current = null;
  };

  const onDown = (e: React.PointerEvent) => {
    if (phase !== "idle" || (e.target as HTMLElement).closest("button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startFrom(pointers.current);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const gst = gesture.current;
    if (!gst) return;
    const [cx, cy] = center();
    if (gst.kind === "pinch") {
      const [p, q] = [...pointers.current.values()];
      if (!q) return;
      const s1 = clamp((gst.s0 * Math.hypot(p.x - q.x, p.y - q.y)) / gst.d0, 1, maxScale);
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      const { ex, ey } = limits(s1, rect);
      zs.set(s1);
      zx.set(s1 === 1 ? 0 : clamp(mx - cx - gst.cx * s1, -ex, ex));
      zy.set(s1 === 1 ? 0 : clamp(my - cy - gst.cy * s1, -ey, ey));
      setZoomed(s1 > 1.01);
    } else if (gst.kind === "pan") {
      const { ex, ey } = limits(zs.get(), rect);
      gst.moved = Math.max(gst.moved, Math.hypot(e.clientX - gst.px, e.clientY - gst.py));
      zx.set(clamp(gst.x0 + e.clientX - gst.px, -ex, ex));
      zy.set(clamp(gst.y0 + e.clientY - gst.py, -ey, ey));
    } else {
      const dx = e.clientX - gst.px;
      gst.moved = Math.max(gst.moved, Math.abs(dx));
      // Resistance past the first and last generation.
      const edge = (dx > 0 && index === 0) || (dx < 0 && index === list.length - 1);
      sx.set(edge ? dx * 0.25 : dx);
    }
  };
  const onUp = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const gst = gesture.current;
    pointers.current.delete(e.pointerId);
    if (gst?.kind === "swipe" && pointers.current.size === 0) {
      const dx = sx.get();
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      else animate(sx, 0, { duration: 0.25, ease });
    }
    // A tap (no travel): two in quick succession toggle zoom at that point.
    const travel = gst && "moved" in gst ? gst.moved : 99;
    if (pointers.current.size === 0 && gst?.kind !== "pinch" && travel < 8) {
      const now = performance.now();
      const lt = lastTap.current;
      if (lt && now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
        lastTap.current = null;
        if (zs.get() > 1.01) zoomTo(1, e.clientX, e.clientY, true);
        else zoomTo(Math.min(2.6, maxScale), e.clientX, e.clientY, true);
      } else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
    startFrom(pointers.current);
  };

  if (typeof document === "undefined") return null;
  const [cx, cy] = center();
  const name = `${a.label} ${g.roman}`;

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`${a.ui.pano}: ${name}`}
      className="fixed inset-0 z-[100]"
    >
      <motion.div aria-hidden className="absolute inset-0 bg-[#0c110f]" style={{ opacity: backdrop }} />

      <div
        ref={stage}
        className={`absolute inset-0 touch-none select-none ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <motion.div
          className="absolute will-change-transform"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            x: fx,
            y: fy,
            scale: fs,
            clipPath: clip,
          }}
        >
          <motion.div className="absolute inset-0" style={{ x: sx }}>
            <motion.div
              className="absolute inset-0 will-change-transform"
              style={{ x: zx, y: zy, scale: zs }}
            >
              <Image
                key={`p${g.number}`}
                src={g.pano.src}
                alt={`${a.ui.pano}: ${name}`}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={g.pano.blur}
                className="pointer-events-none object-contain"
                draggable={false}
              />
              {/* The high-resolution file, for reading names; it replaces the preview once loaded. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`f${g.number}`}
                src={g.pano.full}
                alt=""
                aria-hidden
                decoding="async"
                draggable={false}
                onLoad={() => setReady(g.number)}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
                style={{ opacity: ready === g.number ? 1 : 0 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Controls: minimal, out of the pano's way. */}
      <motion.div className="pointer-events-none absolute inset-0 text-white" style={{ opacity: backdrop }}>
        {/* While zoomed the pano can pass under the controls: a quiet scrim keeps them legible. */}
        <span
          aria-hidden
          className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0c110f]/80 to-transparent transition-opacity duration-200 ${zoomed ? "opacity-100" : "opacity-0"}`}
        />
        <span
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0c110f]/80 to-transparent transition-opacity duration-200 ${zoomed ? "opacity-100" : "opacity-0"}`}
        />
        <p className="absolute left-4 top-4 text-[0.875rem] tracking-[0.04em] text-white/80 md:left-6 md:top-6 md:text-[0.9375rem]">
          {name}
          <span className="ml-3 tabular-nums text-gold-soft/80">
            {index + 1} / {list.length}
          </span>
        </p>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label={a.ui.close}
          className="pointer-events-auto absolute right-2 top-1.5 grid size-12 place-items-center text-white/75 transition-colors duration-150 hover:text-white md:right-4 md:top-3"
        >
          <CloseIcon />
        </button>

        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label={a.ui.prev}
          className="pointer-events-auto absolute left-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center text-white/60 transition-[color,transform,opacity] duration-150 hover:-translate-x-0.5 hover:text-white disabled:opacity-0 md:grid lg:left-5"
        >
          <ArrowRight className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === list.length - 1}
          aria-label={a.ui.next}
          className="pointer-events-auto absolute right-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center text-white/60 transition-[color,transform,opacity] duration-150 hover:translate-x-0.5 hover:text-white disabled:opacity-0 md:grid lg:right-5"
        >
          <ArrowRight />
        </button>

        <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center border border-white/15 md:bottom-6">
          <button
            type="button"
            onClick={() => zoomTo(zs.get() / 1.6, cx, cy, true)}
            disabled={!zoomed}
            aria-label={a.ui.zoomOut}
            className="grid size-11 place-items-center text-white/80 transition-colors hover:text-white disabled:text-white/25"
          >
            <span aria-hidden className="block h-px w-3.5 bg-current" />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(1, cx, cy, true)}
            disabled={!zoomed}
            aria-label={a.ui.fit}
            className="grid h-11 place-items-center border-x border-white/15 px-3 text-[0.75rem] tabular-nums tracking-[0.06em] text-white/80 transition-colors hover:text-white disabled:text-white/40"
          >
            <span aria-hidden className="block size-3.5 border border-current" />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(zs.get() * 1.6, cx, cy, true)}
            disabled={zs.get() >= maxScale - 0.01 && zoomed}
            aria-label={a.ui.zoomIn}
            className="grid size-11 place-items-center text-white/80 transition-colors hover:text-white disabled:text-white/25"
          >
            <span aria-hidden className="relative block size-3.5">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
            </span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
