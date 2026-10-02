"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import type { Dictionary } from "@/content";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight, PauseIcon, PlayIcon } from "@/components/ui/icons";

type Generation = Dictionary["alumni"]["items"][number];

/*
 * Three tracks, each drifting left at its own pace and starting at its own
 * offset, so the wall never moves as one block. Durations are per loop (one
 * set of five generations); desktop loops are longer because each one is wider.
 */
const tracks = [
  "[--d:42s] [--delay:0s] lg:[--d:70s]",
  "[--d:35s] [--delay:calc(var(--d)*-0.08)] lg:[--d:60s]",
  "[--d:49s] [--delay:calc(var(--d)*-0.17)] lg:[--d:82s]",
] as const;

/* Tile rhythm inside a track: proportion and a small vertical offset. */
const rhythm = [
  { aspect: "aspect-[4/5] md:aspect-square lg:aspect-[6/5]", offset: "mt-0" },
  { aspect: "aspect-square md:aspect-[6/5] lg:aspect-[5/4]", offset: "mt-3 md:mt-5" },
  { aspect: "aspect-[5/6] md:aspect-[5/4] lg:aspect-[4/3]", offset: "mt-1.5 md:mt-2.5" },
] as const;

/**
 * Generacije: the official generation panels as a living wall behind one
 * rounded stage. Three tracks of panels drift slowly and continuously to the
 * left, each at its own speed; every track holds its panels twice, so the loop
 * is seamless. Panels enter and leave at the stage's rounded edges.
 *
 * The motion is a CSS animation on the compositor — no per-frame JavaScript. It
 * runs only while the stage is on screen, pauses while a panel has keyboard
 * focus, and can be paused with the button in the corner. With reduced motion
 * the wall stands still and each track scrolls natively instead.
 */
export function Alumni({ dict }: { dict: Dictionary }) {
  const a = dict.alumni;
  const stage = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Run only while the stage is visible (an attribute, not React state).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) delete el.dataset.offscreen;
      else el.dataset.offscreen = "";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

        <Reveal y={20} className="mt-7 md:mt-10 lg:mt-12">
          {/* The stage: one rounded, clipped window onto the wall. */}
          <div
            ref={stage}
            data-paused={paused ? "" : undefined}
            onFocus={keepInView}
            className="gen-stage relative overflow-clip rounded-[32px] bg-[var(--color-stage)] py-5 [clip-path:inset(0_round_32px)] md:rounded-[44px] md:py-7 md:[clip-path:inset(0_round_44px)] lg:rounded-[56px] lg:py-9 lg:[clip-path:inset(0_round_56px)]"
          >
            <div
              role="list"
              aria-label={a.galleryLabel}
              className="flex flex-col gap-y-3 md:gap-y-5 lg:gap-y-6"
            >
              {rows.map((items, r) => (
                <div key={r} className="gen-row">
                  <div className={`gen-track flex w-max ${tracks[r]}`}>
                    {[0, 1].map((copy) => (
                      <div
                        key={copy}
                        // The second copy only closes the loop: hidden from assistive tech and focus.
                        aria-hidden={copy === 1 || undefined}
                        inert={copy === 1}
                        className={`flex items-start gap-x-3 pr-3 md:gap-x-4 md:pr-4 lg:gap-x-6 lg:pr-6 ${copy === 1 ? "gen-copy" : ""}`}
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
      className={`w-[calc((100vw-2*var(--gutter))/2.3)] shrink-0 md:w-[calc((100vw-2*var(--gutter))/3.4)] lg:w-[min(15.5rem,calc((min(100vw,var(--max))-2*var(--gutter))/4.6))] ${offset}`}
    >
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
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            draggable={false}
            sizes="(min-width: 1024px) 15.5rem, (min-width: 768px) 28vw, 44vw"
            className="object-cover transition-[scale] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045] motion-reduce:group-hover:scale-100"
          />
        </div>

        {/* Numeral on a tab cut into the photograph's lower-left corner; it travels with the panel. */}
        <div className="flex items-end justify-between gap-3">
          <span
            aria-hidden
            className="relative -mt-[0.62em] bg-[var(--color-stage)] pr-[0.32em] pt-[0.1em] text-[clamp(1.625rem,1.25rem+1.3vw,2.5rem)] font-normal leading-[0.9] tracking-[-0.02em] text-green"
          >
            {item.numeral}
          </span>
          <span
            aria-hidden
            className="flex items-center gap-2 pt-2 text-[0.625rem] font-medium tabular-nums tracking-[0.14em] text-ink-soft transition-colors duration-300 group-hover:text-gold-deep md:text-[0.6875rem]"
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
 * Keyboard focus pauses the wall (CSS :focus-within). If the focused panel sits
 * outside the stage, move that track's animation forward or back just enough
 * to bring it fully into view.
 */
function keepInView(e: FocusEvent<HTMLDivElement>) {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const track = target.closest<HTMLElement>(".gen-track");
  const animation = track?.getAnimations()[0];
  if (!track || !animation) return;
  const r = target.getBoundingClientRect();
  const s = e.currentTarget.getBoundingClientRect();
  const margin = Math.min(40, s.width * 0.06);
  const delta =
    r.right > s.right - margin
      ? r.right - s.right + margin
      : r.left < s.left + margin
        ? r.left - s.left - margin
        : 0;
  const timing = animation.effect?.getComputedTiming();
  const duration = Number(timing?.duration) || 0;
  const progress = Number(timing?.progress) || 0;
  const loop = track.offsetWidth / 2;
  if (!delta || !duration || !loop) return;
  // Moving the track left by `delta` px = advancing delta / loop of a cycle. Stay within
  // the current cycle: wrapping would show the hidden copy instead of the focused panel.
  const next = Math.min(0.999, Math.max(0.001, progress + delta / loop));
  let time = Number(animation.currentTime ?? 0) + (next - progress) * duration;
  // A negative time reads as "not started"; whole cycles later is the same position.
  while (time < 0) time += duration;
  animation.currentTime = time;
}
