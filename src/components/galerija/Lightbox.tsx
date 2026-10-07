"use client";

import Image from "next/image";
import { AnimatePresence, animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/content/galerija";
import { ArrowRight, CloseIcon } from "@/components/ui/icons";

/*
 * The viewer: the photograph is the interface.
 *
 * Opening is a FLIP from the tile: the full photograph is laid out at its final
 * size, then started at the tile's position and scale (uniform, so nothing
 * distorts) with a clip that matches the tile's crop; both resolve together
 * (420ms, ease-out). Closing runs the same path back to the tile of the photo
 * now shown. Between photographs: a short slide + fade in the direction of
 * travel. Swipe on touch, arrow keys, Esc; focus stays inside and returns to
 * the tile. No captions: the source has none. Reduced motion: fades only.
 */

const ease = [0.32, 0.72, 0, 1] as const;

type Rect = { x: number; y: number; w: number; h: number };

/** The photograph's final rectangle: contained in the viewport, with room for controls. */
function targetRect(photo: Photo): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padX = vw < 768 ? 0 : Math.round(vw * 0.06);
  const padY = vw < 768 ? 64 : 72;
  const s = Math.min((vw - padX * 2) / photo.width, (vh - padY * 2) / photo.height);
  const w = Math.round(photo.width * s);
  const h = Math.round(photo.height * s);
  return { x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2), w, h };
}

/** Where (and how) the full photograph sits so that it exactly covers the tile's crop. */
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

const tileOf = (id: string) => document.querySelector<HTMLElement>(`[data-gal="${id}"]`);

export function Lightbox({
  list,
  index,
  onIndex,
  onClose,
  reduced,
}: {
  list: readonly Photo[];
  index: number;
  onIndex: (i: number) => void;
  /** Called when the closing transition has finished. */
  onClose: () => void;
  reduced: boolean;
}) {
  const photo = list[index];
  // The viewer mounts only in the browser, after a tap: its layout is known at once.
  const [rect, setRect] = useState<Rect>(() => targetRect(photo));
  const [phase, setPhase] = useState<"open" | "idle" | "closing">(() =>
    reduced || !tileOf(photo.id) ? "idle" : "open",
  );
  const [dir, setDir] = useState(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const backdrop = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const clip = useMotionValue("inset(0% 0% 0% 0%)");
  const firstId = useRef(photo.id);

  // Lay out at the final size, start at the tile, resolve.
  useLayoutEffect(() => {
    const t = targetRect(list[index]);
    const tile = tileOf(firstId.current);
    if (reduced || !tile) {
      animate(backdrop, 1, { duration: 0.2 });
      return;
    }
    const f = fromTile(tile.getBoundingClientRect(), t);
    x.set(f.x);
    y.set(f.y);
    scale.set(f.scale);
    clip.set(f.clip);
    const o = { duration: 0.42, ease };
    animate(backdrop, 1, { duration: 0.3, ease: "easeOut" });
    animate(x, 0, o);
    animate(y, 0, o);
    animate(scale, 1, o);
    animate(clip, "inset(0% 0% 0% 0%)", o).then(() => setPhase("idle"));
    // Run once, on open: later photographs change by sliding, not by this path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the layout right if the viewport changes while open.
  useEffect(() => {
    const onResize = () => setRect(targetRect(list[index]));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [list, index]);

  const close = useCallback(() => {
    if (phase === "closing") return;
    setPhase("closing");
    const t = targetRect(list[index]);
    const tile = tileOf(list[index].id);
    const r = tile?.getBoundingClientRect();
    const onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
    animate(backdrop, 0, { duration: 0.32, ease: "easeOut" });
    if (reduced || !r || !onScreen) {
      animate(scale, 0.97, { duration: 0.2 });
      animate(clip, "inset(0% 0% 0% 0%)", { duration: 0.2 }).then(onClose);
      return;
    }
    const f = fromTile(r, t);
    const o = { duration: 0.38, ease };
    animate(x, f.x, o);
    animate(y, f.y, o);
    animate(scale, f.scale, o);
    animate(clip, f.clip, o).then(onClose);
  }, [phase, list, index, backdrop, x, y, scale, clip, reduced, onClose]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (phase !== "idle") return;
      const n = (index + d + list.length) % list.length;
      setDir(d);
      setRect(targetRect(list[n]));
      onIndex(n);
    },
    [phase, index, list, onIndex],
  );

  // Keys, scroll lock, focus.
  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        const f = dialog.current?.querySelectorAll<HTMLElement>("button");
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
      root.style.overflow = prevOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, [close, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotografija ${index + 1} od ${list.length}`}
      className="fixed inset-0 z-[100]"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[#0c110f]"
        style={{ opacity: backdrop }}
        onClick={close}
      />

      {
        <motion.div
          className="absolute will-change-transform"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, x, y, scale, clipPath: clip }}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={photo.id}
              custom={dir}
              className="absolute inset-0 touch-pan-y"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: reduced ? 0 : d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              drag={phase === "idle" && list.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={photo.blur}
                className="pointer-events-none select-none object-contain"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      }

      {/* Controls: minimal, out of the photograph's way. */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: backdrop }}>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Zatvori"
          className="pointer-events-auto absolute right-2 top-2 grid size-12 place-items-center text-white/75 transition-colors duration-150 hover:text-white md:right-5 md:top-4"
        >
          <CloseIcon />
        </button>
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Prethodna fotografija"
              className="pointer-events-auto absolute left-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center text-white/60 transition-[color,transform] duration-150 hover:-translate-x-0.5 hover:text-white md:grid lg:left-6"
            >
              <ArrowRight className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Sljedeća fotografija"
              className="pointer-events-auto absolute right-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center text-white/60 transition-[color,transform] duration-150 hover:translate-x-0.5 hover:text-white md:grid lg:right-6"
            >
              <ArrowRight />
            </button>
          </>
        )}
        <p className="absolute inset-x-0 bottom-4 text-center text-[0.8125rem] tabular-nums tracking-[0.08em] text-white/55 md:bottom-6">
          <span className="text-gold-soft/90">{index + 1}</span> / {list.length}
        </p>
      </motion.div>
    </div>,
    document.body,
  );
}
