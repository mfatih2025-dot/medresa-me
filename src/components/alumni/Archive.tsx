"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { alumni as a, generations, type Generation } from "@/content/alumni";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Emerge, Numeral, PanoFrame, Thread, type PanoReveal } from "./AlumniMotion";
import { PanoViewer } from "./PanoViewer";

/*
 * Generacije: the living archive.
 *
 *   Index     the generations as an archival index of numerals (opening); a
 *             quiet vertical rail in the left margin (desktop) and a thin
 *             swipeable strip at the bottom (phones) follow the reading while
 *             the generations are on screen, the one in focus in gold
 *   Chapters  one per generation, composed from its position in a cycle of
 *             four (so later generations need only data):
 *               0  centred — the pano wide in the middle (never taller than
 *                  80% of the viewport, so it is seen whole), the numeral a faint
 *                  plane behind; the thread comes in from the left edge
 *               1  heading beside, pano bled right; the thread runs down the heading
 *               2  pano bled left, heading beside it; the thread comes in from the right
 *               3  pano edge to edge (phones) / full width, a large faint
 *                  numeral above; the thread falls to the pano's corner
 *   Viewer    any pano opens in PanoViewer (zoom, pan, swipe between generations)
 *
 * The pano is always whole (its own aspect ratio, object-contain); names and
 * faces are never covered.
 */

const roman = (g: Generation) => `${a.label} ${g.roman}`;
const id = (g: Generation) => `generacija-${g.number}`;
const two = (n: number) => String(n).padStart(2, "0");

/** Heading: „Generacija“ small, the numeral large; reads as „Generacija VIII“. */
function Heading({
  g,
  align = "left",
  className = "",
}: {
  g: Generation;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <h3 id={`${id(g)}-h`} className={`text-green ${align === "right" ? "text-right" : ""} ${className}`}>
      <span className="flex items-baseline gap-3 text-[0.8125rem] tracking-[0.18em] text-gold-deep uppercase md:text-[0.875rem]">
        <span aria-hidden className="tabular-nums tracking-[0.08em] text-ink-soft/80">
          {two(g.number)}
        </span>
        {a.label}
      </span>{" "}
      <span className="display mt-2 block text-[clamp(3.25rem,2rem+5.4vw,7.5rem)] leading-[0.86] tracking-[-0.035em]">
        <Emerge>{g.roman}</Emerge>
      </span>
    </h3>
  );
}

/** „Otvori pano“ — the source's link text, as the quiet action under each pano. */
function OpenLabel({
  g,
  onOpen,
  className = "",
}: {
  g: Generation;
  onOpen: (n: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(g.number)}
      className={`group mt-3 inline-flex min-h-11 touch-manipulation items-center gap-2.5 text-[0.9375rem] text-green md:mt-4 md:text-[1rem] ${className}`}
    >
      <span
        aria-hidden
        className="relative block size-3.5 transition-transform duration-200 ease-out group-hover:scale-110"
      >
        <span className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-gold-deep" />
        <span className="absolute right-0 top-0 h-1.5 w-1.5 border-r border-t border-gold-deep" />
        <span className="absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l border-gold-deep" />
        <span className="absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r border-gold-deep" />
      </span>
      <span className="underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-200 group-hover:decoration-gold">
        {a.open}
      </span>
      <span className="sr-only">: {roman(g)}</span>
    </button>
  );
}

function Chapter({
  g,
  i,
  onOpen,
  openN,
}: {
  g: Generation;
  i: number;
  onOpen: (n: number) => void;
  openN: number | null;
}) {
  const kind = i % 4;
  const frame = (reveal: PanoReveal, sizes: string, className = "") => (
    <PanoFrame
      generation={g}
      label={`${a.open}: ${roman(g)}`}
      sizes={sizes}
      reveal={reveal}
      priority={i === 0}
      hidden={openN === g.number}
      onOpen={onOpen}
      className={className}
    />
  );

  const body: Record<number, ReactNode> = {
    0: (
      <div className="relative">
        <Numeral className="-top-6 right-0 text-[38vw] text-green/[0.05] md:-top-10 lg:text-[18rem]">
          {g.roman}
        </Numeral>
        <div className="relative">
          <Heading g={g} />
        </div>
        <div className="relative mx-auto mt-7 md:mt-9 lg:max-w-[min(83.3333%,calc(80vh*1.42))]">
          <Thread axis="x" from="left" className="top-0 right-full w-[var(--edge)] lg:w-[50vw]" />
          {frame("center", "(min-width: 1024px) 70vw, 92vw")}
          <OpenLabel g={g} onOpen={onOpen} />
        </div>
      </div>
    ),
    1: (
      <div className="relative lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8">
        <div className="relative pl-5 lg:col-span-3 lg:pl-6">
          <Thread axis="y" from="top" className="left-0 top-1 bottom-1" />
          <Heading g={g} />
        </div>
        <div className="-mr-[var(--edge)] ml-[6%] mt-7 md:ml-[12%] md:mt-9 lg:col-span-9 lg:ml-0 lg:mt-1">
          {frame("right", "(min-width: 1024px) 75vw, 94vw")}
          <OpenLabel g={g} onOpen={onOpen} />
        </div>
      </div>
    ),
    2: (
      <div className="relative lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
        <div className="relative lg:order-2 lg:col-span-3">
          <Thread
            axis="x"
            from="right"
            className="-top-5 left-[40%] right-[calc(-1*var(--edge))] lg:left-0"
          />
          <Heading
            g={g}
            align="right"
            className="lg:text-left [&>span:first-child]:justify-end lg:[&>span:first-child]:justify-start"
          />
        </div>
        <div className="-ml-[var(--edge)] mr-[6%] mt-7 md:mr-[12%] md:mt-9 lg:order-1 lg:col-span-9 lg:mr-0 lg:mt-0">
          {frame("left", "(min-width: 1024px) 75vw, 94vw")}
          <OpenLabel g={g} onOpen={onOpen} className="ml-[var(--edge)] lg:ml-[calc(var(--edge)+0px)]" />
        </div>
      </div>
    ),
    3: (
      <div className="relative">
        <Numeral className="-top-8 left-[-2vw] text-[44vw] text-green/[0.045] md:-top-12 lg:left-[-1rem] lg:text-[22rem]">
          {g.roman}
        </Numeral>
        <div className="relative lg:ml-[33.3333%]">
          <Heading g={g} />
        </div>
        <div className="relative mt-7 md:mt-9">
          <Thread axis="y" from="top" className="-top-24 left-0 h-24 hidden lg:block" />
          <div className="-mx-[var(--edge)] md:mx-0 lg:mr-auto lg:max-w-[calc(80vh*1.42)]">
            {frame("up", "(min-width: 1024px) 92vw, 100vw")}
          </div>
          <OpenLabel g={g} onOpen={onOpen} />
        </div>
      </div>
    ),
  };

  return (
    <section
      id={id(g)}
      aria-labelledby={`${id(g)}-h`}
      data-generation={g.number}
      className="scroll-mt-24 md:scroll-mt-32"
    >
      {body[kind]}
    </section>
  );
}

export function Archive() {
  const { reduced } = useMotionProfile();
  const [active, setActive] = useState<number>(generations[0].number);
  const [inArchive, setInArchive] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const archive = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  // Which generation is in focus (the one crossing the middle of the viewport).
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-generation]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-generation")));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const io2 = new IntersectionObserver(([e]) => setInArchive(e.isIntersecting), {
      rootMargin: "-30% 0px -30% 0px",
    });
    if (archive.current) io2.observe(archive.current);
    return () => {
      io.disconnect();
      io2.disconnect();
    };
  }, []);

  // Keep the focused numeral visible in the phone strip.
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    const box = strip.current;
    if (!el || !box) return;
    box.scrollTo({
      left: el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [active, reduced]);

  const jump = useCallback(
    (n: number) => {
      document
        .getElementById(`generacija-${n}`)
        ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    },
    [reduced],
  );
  const onOpen = useCallback((n: number) => setOpen(generations.findIndex((g) => g.number === n)), []);
  const openN = open === null ? null : (generations[open]?.number ?? null);

  const numeral = (g: Generation, cls: string) => (
    <a
      key={g.number}
      href={`#${id(g)}`}
      data-index={g.number}
      aria-label={roman(g)}
      aria-current={active === g.number && inArchive ? "true" : undefined}
      onClick={(e) => {
        e.preventDefault();
        jump(g.number);
      }}
      className={cls}
    >
      {g.roman}
    </a>
  );

  return (
    <>
      {/* The archival index. */}
      <nav aria-label={a.generationsHeading} className="wrap mt-8 md:mt-10">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-y border-ink/12 py-5 md:gap-x-8 md:py-6 lg:gap-x-10">
          {generations.map((g) =>
            numeral(
              g,
              "group relative display touch-manipulation py-1 text-[clamp(1.5rem,1.15rem+1.4vw,2.5rem)] leading-none tracking-[-0.02em] text-green/45 transition-colors duration-200 hover:text-green aria-[current=true]:text-gold-deep",
            ),
          )}
        </div>
      </nav>

      <div ref={archive} className="wrap mt-16 md:mt-24 lg:mt-28">
        {generations.map((g, i) => (
          <div key={g.number} className={i === 0 ? "" : "mt-24 md:mt-32 lg:mt-40"}>
            <Chapter g={g} i={i} onOpen={onOpen} openN={openN} />
          </div>
        ))}
      </div>

      {/* Desktop: a quiet rail in the left margin while the generations are on screen. */}
      <nav
        aria-label={`${a.generationsHeading} (indeks)`}
        className={`fixed left-[max(0.5rem,calc(var(--edge)/2-1rem))] top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1.5 transition-opacity duration-300 lg:flex ${
          inArchive && open === null ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {generations.map((g) =>
          numeral(
            g,
            "relative min-w-8 py-0.5 text-center text-[0.6875rem] tracking-[0.08em] text-ink-soft/55 transition-colors duration-200 hover:text-green aria-[current=true]:text-gold-deep aria-[current=true]:after:absolute aria-[current=true]:after:-left-2 aria-[current=true]:after:top-1/2 aria-[current=true]:after:h-px aria-[current=true]:after:w-1.5 aria-[current=true]:after:bg-gold",
          ),
        )}
      </nav>

      {/* Phones: a thin strip at the bottom, within thumb reach. */}
      <nav
        aria-label={`${a.generationsHeading} (indeks)`}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-transform duration-300 ease-out lg:hidden ${
          inArchive && open === null ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          ref={strip}
          className="flex snap-x overflow-x-auto overscroll-x-contain px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {generations.map((g) =>
            numeral(
              g,
              "relative grid min-h-12 min-w-12 shrink-0 snap-center touch-manipulation place-items-center px-2 text-[1rem] tracking-[0.04em] text-ink-soft/70 transition-colors duration-200 aria-[current=true]:text-gold-deep aria-[current=true]:after:absolute aria-[current=true]:after:inset-x-3 aria-[current=true]:after:bottom-2 aria-[current=true]:after:h-px aria-[current=true]:after:bg-gold",
            ),
          )}
        </div>
      </nav>

      {open !== null && (
        <PanoViewer
          list={generations}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          reduced={reduced}
        />
      )}
    </>
  );
}
