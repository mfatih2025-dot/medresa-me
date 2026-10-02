"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import type { Dictionary } from "@/content";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

type Generation = Dictionary["alumni"]["items"][number];

const ease = [0.16, 1, 0.3, 1] as const;

/*
 * Column rhythm, repeating every three columns: a vertical offset, the two tile
 * proportions, and how far the column drifts against the scroll (depth). The
 * gallery reads as three interleaved columns rather than a grid.
 */
const rhythm = [
  { offset: "mt-0", tiles: ["aspect-[4/5]", "aspect-square"], depth: 14 },
  { offset: "mt-8 md:mt-14", tiles: ["aspect-square", "aspect-[4/5]"], depth: -18 },
  { offset: "mt-3 md:mt-6", tiles: ["aspect-[5/6]", "aspect-[6/5]"], depth: 6 },
] as const;

/**
 * Generacije: the official generation panels as a moving gallery.
 *
 * The gallery is wider than the page and seen through a clipped viewport. While
 * the section passes through the screen, normal vertical scrolling drifts it
 * sideways (it enters from the right and leaves to the left); scroll is never
 * held or redirected. The gallery is also a native horizontal scroller: swipe
 * on touch, trackpad or drag with a mouse. The column nearest the centre comes
 * forward a little — its photograph and numeral — while the others recede.
 */
export function Alumni({ dict }: { dict: Dictionary }) {
  const a = dict.alumni;
  const section = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const { reduced, compact } = useMotionProfile();

  const progress = useScrollProgress(section, ["start end", "end start"]);
  const { scrollX } = useScroll({ container: scroller });
  const viewW = useMotionValue(0);
  // Drift amplitude as a share of the viewport width (matches the track's end padding).
  const amp = useMotionValue(0.2);
  useEffect(() => amp.set(compact ? 0.22 : 0.24), [amp, compact]);
  const drift = useTransform(() => (0.5 - progress.get()) * 2 * amp.get() * viewW.get());

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => viewW.set(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewW]);

  const columns: Generation[][] = [];
  for (let i = 0; i < a.items.length; i += 2) columns.push(a.items.slice(i, i + 2));

  const drag = useMouseDragScroll(scroller);

  return (
    <section
      ref={section}
      aria-labelledby="alumni-title"
      className="relative overflow-x-clip border-t border-ink/10 bg-ivory pb-[calc(var(--section-y)*0.9)] pt-[calc(var(--section-y)*0.8)] lg:pt-[calc(var(--section-y)*0.7)]"
    >
      <div className="wrap flex items-end justify-between gap-x-6">
        <div>
          <Reveal variant="label">
            <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{a.eyebrow}</p>
          </Reveal>
          <LineReveal id="alumni-title" lines={a.heading} className="display h-section text-green [text-wrap:balance]" />
        </div>
        <Reveal className="shrink-0 pb-1 md:pb-2">
          <Link
            href={a.link.href}
            className="group link-u inline-flex min-h-11 items-center gap-2.5 text-[0.875rem] text-green md:text-[0.9375rem]"
          >
            {a.link.label}
            <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
          </Link>
        </Reveal>
      </div>

      {/* The viewport: full bleed, clipped; softly masked at the edges from tablet up. */}
      <div
        ref={scroller}
        {...drag}
        className="alumni-scroller mt-7 overflow-x-auto overflow-y-hidden overscroll-x-contain md:mt-10 md:[mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)] lg:mt-12"
      >
        <motion.div
          role="list"
          aria-label={a.galleryLabel}
          className="relative flex w-max items-start gap-x-3.5 py-5 pl-[calc(var(--gutter)+max(0px,(100%-var(--max))/2))] pr-[calc(var(--gutter)+22vw)] md:gap-x-5 md:pr-[calc(var(--gutter)+24vw)] lg:gap-x-7"
          style={reduced ? undefined : { x: drift }}
        >
          {columns.map((items, i) => (
            <Column
              key={items[0].numeral}
              index={i}
              items={items}
              open={a.open}
              reduced={reduced}
              compact={compact}
              progress={progress}
              drift={drift}
              scrollX={scrollX}
              viewW={viewW}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Column({
  index,
  items,
  open,
  reduced,
  compact,
  progress,
  drift,
  scrollX,
  viewW,
}: {
  index: number;
  items: Generation[];
  open: string;
  reduced: boolean;
  compact: boolean;
  progress: MotionValue<number>;
  drift: MotionValue<number>;
  scrollX: MotionValue<number>;
  viewW: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const r = rhythm[index % rhythm.length];

  // The column's centre in the track; measured on resize only, never per frame.
  const centre = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => centre.set(el.offsetLeft + el.offsetWidth / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [centre]);

  // 1 at the centre of the viewport, falling to 0 towards its edges.
  // Every value is read before any early return so all of them stay tracked.
  const focus = useTransform(() => {
    const w = viewW.get();
    const distance = Math.abs(centre.get() + drift.get() - scrollX.get() - w / 2);
    return w ? Math.max(0, 1 - distance / (w * 0.55)) : 1;
  });
  const depth = compact ? r.depth * 0.5 : r.depth;
  const y = useTransform(progress, [0, 1], [depth, -depth]);
  const scale = useTransform(focus, [0, 1], [1, 1.035]);
  const veil = useTransform(focus, [0, 1], [0.16, 0]);
  const numeral = useTransform(focus, [0, 1], [0.5, 1]);

  const enter = reduced
    ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, margin: "0px 0px -10% 0px" },
        transition: { duration: 0.9, delay: Math.min(index, 5) * 0.07, ease },
      };

  return (
    <motion.div
      ref={ref}
      className={`flex w-[calc((100vw-var(--gutter)-1.75rem)/2.3)] shrink-0 flex-col gap-y-6 md:w-[calc((100vw-var(--gutter))/3.6)] md:gap-y-8 lg:w-[min(16rem,calc(100vw/5.2))] 2xl:w-[17.5rem] ${r.offset}`}
      style={reduced ? undefined : { y }}
      {...enter}
    >
      {items.map((item, k) => (
        <Tile
          key={item.numeral}
          item={item}
          open={open}
          aspect={r.tiles[k]}
          motionStyle={reduced ? undefined : { scale, veil, numeral }}
        />
      ))}
    </motion.div>
  );
}

function Tile({
  item,
  open,
  aspect,
  motionStyle,
}: {
  item: Generation;
  open: string;
  aspect: string;
  motionStyle?: { scale: MotionValue<number>; veil: MotionValue<number>; numeral: MotionValue<number> };
}) {
  return (
    <div role="listitem">
      <a
        href={item.href}
        rel="noopener"
        draggable={false}
        aria-label={`Generacija ${item.numeral}, ${item.years} – ${open}`}
        className="group block select-none [-webkit-touch-callout:none]"
      >
        <div
          className={`relative overflow-hidden bg-sand transition-[scale] duration-150 ease-out group-active:scale-[0.98] ${aspect}`}
        >
          <motion.div className="absolute inset-0" style={motionStyle ? { scale: motionStyle.scale } : undefined}>
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              draggable={false}
              sizes="(min-width: 1536px) 17.5rem, (min-width: 1024px) 19vw, (min-width: 768px) 28vw, 44vw"
              className="object-cover transition-[scale] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045] motion-reduce:group-hover:scale-100"
            />
          </motion.div>
          {/* Recede: an ivory veil, thinnest at the centre of the viewport. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-ivory opacity-0"
            style={motionStyle ? { opacity: motionStyle.veil } : undefined}
          />
        </div>

        {/* Numeral on an ivory tab cut into the photograph's lower-left corner. */}
        <div className="flex items-end justify-between gap-3">
          <span
            aria-hidden
            className="relative -mt-[0.62em] bg-ivory pr-[0.32em] pt-[0.1em] text-[clamp(1.75rem,1.3rem+1.4vw,2.75rem)] font-normal leading-[0.9] tracking-[-0.02em] text-green"
          >
            <motion.span className="block" style={motionStyle ? { opacity: motionStyle.numeral } : undefined}>
              {item.numeral}
            </motion.span>
          </span>
          <span
            aria-hidden
            className="flex items-center gap-2 pt-2.5 text-[0.625rem] font-medium tabular-nums tracking-[0.14em] text-ink-soft transition-colors duration-300 group-hover:text-gold-deep md:text-[0.6875rem]"
          >
            <span className="h-px w-4 origin-right bg-gold/70 transition-[scale] duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-150 md:w-5" />
            {item.years}
          </span>
        </div>
      </a>
    </div>
  );
}

/**
 * Mouse users can drag the gallery like touch users swipe it. Touch and pen keep
 * the browser's own scrolling (momentum, rubber-banding); a drag never ends in a
 * click on the panel underneath.
 */
function useMouseDragScroll(ref: React.RefObject<HTMLDivElement | null>) {
  const state = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const moved = useRef(false);
  return {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
      state.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
      moved.current = false;
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const s = state.current;
      const el = ref.current;
      if (!s || !el) return;
      const dx = e.clientX - s.x;
      if (!s.moved && Math.abs(dx) > 4) {
        s.moved = moved.current = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = "";
      }
      if (s.moved) el.scrollLeft = s.left - dx;
    },
    onPointerUp(e: PointerEvent<HTMLDivElement>) {
      const el = ref.current;
      if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (el) delete el.dataset.dragging;
      state.current = null;
    },
    onPointerCancel() {
      if (ref.current) delete ref.current.dataset.dragging;
      state.current = null;
    },
    // Keyboard: keep the focused generation fully inside the viewport (drift included).
    onFocus(e: FocusEvent<HTMLDivElement>) {
      const el = ref.current;
      if (!el || !(e.target instanceof HTMLElement)) return;
      const r = e.target.getBoundingClientRect();
      const c = el.getBoundingClientRect();
      const margin = Math.min(48, c.width * 0.06);
      const delta =
        r.right > c.right - margin ? r.right - c.right + margin : r.left < c.left + margin ? r.left - c.left - margin : 0;
      if (delta) el.scrollBy({ left: delta, behavior: reducedMotion() ? "auto" : "smooth" });
    },
    onClickCapture(e: MouseEvent<HTMLDivElement>) {
      if (moved.current) {
        e.preventDefault();
        e.stopPropagation();
        moved.current = false;
      }
    },
  };
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
