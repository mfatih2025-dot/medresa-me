"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import type { Dictionary } from "@/content";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight, PauseIcon, PlayIcon } from "@/components/ui/icons";

type Generation = Dictionary["alumni"]["items"][number];

/*
 * The wall's established pace, in px per second per track (the three tracks
 * drift at slightly different speeds), and where each track starts in its loop.
 * Pinned in px/s so tile size changes never change how fast it feels.
 */
const SPEEDS = [19.5, 23.3, 16.7];
const STARTS = [0, 0.08, 0.17];
/* Copies of each track's panels: enough to cover the stage at every point in the loop. */
const COPIES = 3;

/* Tile rhythm inside a track: proportion and a small vertical offset. */
const rhythm = [
  { aspect: "aspect-[6/7] md:aspect-square lg:aspect-[6/5]", offset: "mt-0" },
  { aspect: "aspect-square md:aspect-[6/5] lg:aspect-[5/4]", offset: "mt-2.5 md:mt-4" },
  { aspect: "aspect-[8/9] md:aspect-[5/4] lg:aspect-[4/3]", offset: "mt-1 md:mt-2" },
] as const;

/**
 * Generacije: the official generation panels as a living wall behind one
 * rounded stage. Three tracks of panels drift slowly and continuously to the
 * left, each at its own speed; each track repeats its panels, so the loop is
 * seamless. Panels enter and leave at the stage's rounded edges.
 *
 * The wall can be grabbed: touch or press and it stops under the finger, drag
 * sideways and it follows, release and it coasts briefly, then eases back into
 * the same drift from where it was left. Vertical swipes still scroll the page.
 * The drift runs as Web Animations on the compositor; drag only sets their
 * current time, never React state. It runs only while on screen, pauses while a
 * panel has keyboard focus, and has a pause button. With reduced motion the
 * wall stands still and each track scrolls natively instead.
 */
export function Alumni({ dict }: { dict: Dictionary }) {
  const a = dict.alumni;
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const { reduced } = useMotionProfile();
  const wall = useWall(stage, reduced);
  useEffect(() => wall.current?.setUserPaused(paused), [wall, paused]);

  // Generation n goes to track (n - 1) % 3: the first column reads I, II, III.
  const rows: Generation[][] = [[], [], []];
  a.items.forEach((item, i) => rows[i % 3].push(item));

  return (
    <section
      aria-labelledby="alumni-title"
      className="relative border-t border-ink/10 bg-ivory pb-[calc(var(--section-y)*0.6)] pt-[calc(var(--section-y)*0.8)] lg:pt-[calc(var(--section-y)*0.7)]"
    >
      <div className="wrap">
        <div className="flex items-end justify-between gap-x-6">
          <div>
            <Reveal variant="label">
              <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{a.eyebrow}</p>
            </Reveal>
            <LineReveal
              id="alumni-title"
              lines={a.heading}
              className="display h-section text-green [text-wrap:balance]"
            />
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

        <Reveal
          y={20}
          className="mt-7 md:mt-10 lg:mt-12 [@media(max-width:767px)_and_(max-height:740px)]:mt-5"
        >
          {/* The stage: one rounded, clipped window onto the wall. */}
          <div
            ref={stage}
            className="gen-stage relative select-none overflow-clip rounded-[30px] bg-[var(--color-stage)] py-3.5 [clip-path:inset(0_round_30px)] md:rounded-[40px] md:py-6 md:[clip-path:inset(0_round_40px)] lg:rounded-[52px] lg:py-8 lg:[clip-path:inset(0_round_52px)]"
          >
            <div
              role="list"
              aria-label={a.galleryLabel}
              className="flex flex-col gap-y-2 md:gap-y-4 lg:gap-y-5"
            >
              {rows.map((items, r) => (
                <div key={r} className="gen-row">
                  <div className="gen-track flex w-max">
                    {Array.from({ length: COPIES }, (_, copy) => (
                      <div
                        key={copy}
                        // Copies only close the loop: hidden from assistive tech and focus.
                        aria-hidden={copy > 0 || undefined}
                        inert={copy > 0}
                        className={`flex items-start gap-x-2.5 pr-2.5 md:gap-x-3.5 md:pr-3.5 lg:gap-x-5 lg:pr-5 ${copy > 0 ? "gen-copy" : ""}`}
                      >
                        {items.map((item, k) => (
                          <Tile key={item.numeral} item={item} open={a.open} rhythm={rhythm[(k + r) % 3]} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Pokreni kretanje generacija" : "Zaustavi kretanje generacija"}
              className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-ivory/85 text-green shadow-[0_6px_20px_-10px_rgb(0_0_0/0.35)] ring-1 ring-ink/10 backdrop-blur-md transition-[scale,background-color] duration-150 ease-out hover:bg-ivory active:scale-[0.94] motion-reduce:hidden md:bottom-5 md:right-5 md:size-11"
            >
              {paused ? <PlayIcon className="translate-x-px" /> : <PauseIcon />}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Tile({
  item,
  open,
  rhythm: { aspect, offset },
}: {
  item: Generation;
  open: string;
  rhythm: (typeof rhythm)[number];
}) {
  return (
    <div
      role="listitem"
      className={`w-[max(7rem,calc((100vw-2*var(--gutter))/2.7))] shrink-0 min-[400px]:w-[calc((100vw-2*var(--gutter))/2.8)] min-[420px]:w-[calc((100vw-2*var(--gutter))/3)] md:w-[calc((100vw-2*var(--gutter))/4.6)] lg:w-[min(12rem,calc((min(100vw,var(--max))-2*var(--gutter))/6))] ${offset}`}
    >
      <a
        href={item.href}
        rel="noopener"
        draggable={false}
        aria-label={`Generacija ${item.numeral}, ${item.years} – ${open}`}
        className="group block select-none [-webkit-touch-callout:none]"
      >
        <div
          className={`relative overflow-hidden rounded-[14px] bg-sand [clip-path:inset(0_round_14px)] md:rounded-[17px] md:[clip-path:inset(0_round_17px)] lg:rounded-[20px] lg:[clip-path:inset(0_round_20px)] ${aspect}`}
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            draggable={false}
            sizes="(min-width: 1024px) 12rem, (min-width: 768px) 22vw, 37vw"
            className="object-cover transition-[scale] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045] motion-reduce:group-hover:scale-100"
          />
        </div>

        {/* Numeral on a tab cut into the photograph's lower-left corner; it travels with the panel. */}
        <div className="flex items-end justify-between gap-2 md:gap-3">
          <span
            aria-hidden
            className="relative -mt-[0.62em] rounded-tr-[0.3em] bg-[var(--color-stage)] pr-[0.32em] pt-[0.1em] text-[clamp(1.4375rem,1.1rem+1.15vw,2.25rem)] font-normal leading-[0.9] tracking-[-0.02em] text-green"
          >
            {item.numeral}
          </span>
          <span
            aria-hidden
            className="flex items-center gap-2 whitespace-nowrap pt-2 text-[0.625rem] font-medium tabular-nums tracking-[0.14em] text-ink-soft transition-colors duration-300 group-hover:text-gold-deep md:text-[0.6875rem]"
          >
            <span className="hidden h-px w-4 origin-right bg-gold/70 md:block transition-[scale] duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-150 md:w-5" />
            {item.years}
          </span>
        </div>
      </a>
    </div>
  );
}

type Track = { el: HTMLElement; anim: Animation; loop: number; speed: number };

const frames = (loop: number) => [
  { transform: "translate3d(0px, 0px, 0px)" },
  { transform: `translate3d(${-loop}px, 0px, 0px)` },
];

/** Where a track is in its loop, in px. */
const offsetOf = (t: Track) => (Number(t.anim.effect?.getComputedTiming().progress) || 0) * t.loop;

/** Put a track at `px` into its loop. Wrapping is invisible: the copies are identical. */
function setOffset(t: Track, px: number) {
  if (!t.loop) return;
  const wrapped = ((px % t.loop) + t.loop) % t.loop;
  t.anim.currentTime = (wrapped / t.loop) * ((t.loop / t.speed) * 1000);
}

/**
 * The wall's motion controller. Everything here is imperative and runs outside
 * React: the drift is three infinite Web Animations; grabbing pauses them and
 * scrubs their current time; release coasts with a decaying velocity, then the
 * drift resumes from that exact point with a short ease-in of its rate.
 */
function useWall(stageRef: RefObject<HTMLDivElement | null>, reduced: boolean) {
  const api = useRef<{ setUserPaused: (v: boolean) => void } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;

    const tracks: Track[] = [...stage.querySelectorAll<HTMLElement>(".gen-track")].map((el, i) => ({
      el,
      anim: el.animate(frames(1), { duration: 1000, iterations: Infinity, easing: "linear" }),
      loop: 0,
      speed: SPEEDS[i % SPEEDS.length],
    }));

    // Loop length = one copy of the panels (gap included). Re-measured on resize,
    // keeping each track's place in its loop.
    const measure = () =>
      tracks.forEach((t, i) => {
        const loop = (t.el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
        if (!loop || loop === t.loop) return;
        const share = t.loop ? offsetOf(t) / t.loop : STARTS[i % STARTS.length];
        t.loop = loop;
        (t.anim.effect as KeyframeEffect).setKeyframes(frames(loop));
        t.anim.effect?.updateTiming({ duration: (loop / t.speed) * 1000 });
        setOffset(t, share * loop);
      });
    measure();

    const flags = { offscreen: true, user: false, focus: false, hold: false };
    let ramp = 0;
    let coast = 0;

    const sync = () => {
      const run = !flags.offscreen && !flags.user && !flags.focus && !flags.hold;
      cancelAnimationFrame(ramp);
      if (!run) {
        tracks.forEach((t) => t.anim.pause());
        return;
      }
      // Ease the drift back in over ~0.6s instead of starting at full speed.
      const t0 = performance.now();
      tracks.forEach((t) => {
        t.anim.playbackRate = 0;
        t.anim.play();
      });
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 600);
        const rate = 1 - (1 - k) ** 3;
        tracks.forEach((t) => (t.anim.playbackRate = rate));
        if (k < 1) ramp = requestAnimationFrame(step);
      };
      ramp = requestAnimationFrame(step);
    };

    // --- Grab, drag, release ------------------------------------------------
    let drag: {
      id: number;
      x: number;
      y: number;
      start: number[];
      active: boolean;
      samples: { t: number; x: number }[];
    } | null = null;
    let suppressClick = false;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("button")) return;
      cancelAnimationFrame(coast);
      suppressClick = false;
      flags.hold = true;
      sync();
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        start: tracks.map(offsetOf),
        active: false,
        samples: [{ t: e.timeStamp, x: e.clientX }],
      };
      // Mouse: no text selection or native link/image drag while grabbing.
      if (e.pointerType === "mouse") e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.active) {
        // Only an intentional horizontal gesture takes the wall; vertical ones
        // stay with the page (touch-action: pan-y lets the browser scroll).
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        drag.active = true;
        stage.setPointerCapture(e.pointerId);
        stage.dataset.dragging = "";
      }
      tracks.forEach((t, i) => setOffset(t, drag!.start[i] - dx));
      drag.samples.push({ t: e.timeStamp, x: e.clientX });
      if (drag.samples.length > 6) drag.samples.shift();
    };

    const release = (e: PointerEvent, cancelled: boolean) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasDragging = drag.active;
      const samples = drag.samples;
      drag = null;
      delete stage.dataset.dragging;
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      if (!wasDragging || cancelled) {
        flags.hold = false;
        sync();
        return;
      }
      suppressClick = true;
      // Release velocity from the last ~100ms of movement, in px/ms.
      const last = samples[samples.length - 1];
      const first = samples.find((s) => last.t - s.t <= 100) ?? samples[0];
      const dt = last.t - first.t;
      let v = dt > 0 ? (last.x - first.x) / dt : 0;
      if (Math.abs(v) < 0.05) {
        flags.hold = false;
        sync();
        return;
      }
      v = Math.max(-2.5, Math.min(2.5, v));
      // Coast: velocity decays exponentially (≈ iOS scroll deceleration), then the drift resumes.
      let prev = performance.now();
      const step = (now: number) => {
        const elapsed = now - prev;
        prev = now;
        tracks.forEach((t) => setOffset(t, offsetOf(t) - v * elapsed));
        v *= Math.exp(-elapsed / 325);
        if (Math.abs(v) > 0.02) coast = requestAnimationFrame(step);
        else {
          flags.hold = false;
          sync();
        }
      };
      coast = requestAnimationFrame(step);
    };
    const onUp = (e: PointerEvent) => release(e, false);
    const onCancel = (e: PointerEvent) => release(e, true);
    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    // --- Keyboard: pause on focus, bring the focused panel fully into view ---
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest<HTMLElement>(".gen-track");
      const t = tracks.find((x) => x.el === el);
      if (!t || !target.matches(":focus-visible")) return;
      flags.focus = true;
      sync();
      const r = target.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const margin = Math.min(40, s.width * 0.06);
      const delta =
        r.right > s.right - margin
          ? r.right - s.right + margin
          : r.left < s.left + margin
            ? r.left - s.left - margin
            : 0;
      // Stay within the loop: the focused panel is in the first copy.
      if (delta) setOffset(t, Math.min(t.loop * 0.999, Math.max(0, offsetOf(t) + delta)));
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as HTMLElement | null;
      if (next?.closest(".gen-track") && stage.contains(next)) return;
      flags.focus = false;
      sync();
    };

    const io = new IntersectionObserver(([entry]) => {
      flags.offscreen = !entry.isIntersecting;
      sync();
    });
    io.observe(stage);
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onCancel);
    stage.addEventListener("click", onClick, true);
    stage.addEventListener("focusin", onFocusIn);
    stage.addEventListener("focusout", onFocusOut);
    api.current = {
      setUserPaused: (v) => {
        flags.user = v;
        sync();
      },
    };

    return () => {
      api.current = null;
      cancelAnimationFrame(ramp);
      cancelAnimationFrame(coast);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onCancel);
      stage.removeEventListener("click", onClick, true);
      stage.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
      tracks.forEach((t) => t.anim.cancel());
    };
  }, [stageRef, reduced]);

  return api;
}
