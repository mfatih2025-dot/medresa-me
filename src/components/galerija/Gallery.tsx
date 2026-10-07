"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  archive,
  galerija as g,
  photos,
  story,
  type Photo,
  type Row,
  type RowKind,
} from "@/content/galerija";
import { ArrowDown } from "@/components/ui/icons";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Frame, Guide, type Reveal } from "./GalMotion";
import { Lightbox } from "./Lightbox";

/*
 * The photographic journey, then the archive.
 *
 * Rows are art-directed by kind (each with its own geometry and reveal):
 *   cinema       edge to edge, wide crop, drifting a little slower (parallax)
 *   wide         a large frame bled to the left edge (right: wideRight)
 *   pair         two landscapes, 7/5, the second set lower
 *   pairPortrait a portrait beside a landscape, bottom-aligned
 *   pairSquare   a square detail beside a landscape bled right
 *   portrait     one tall frame with space around it
 *   closing      the last photograph, set to the right
 * Fine gold rules separate three chapters. The archive (revealed by
 * „Prikaži cijelu galeriju“) uses the same row language, assigned by each
 * photograph's orientation, with quieter reveals; its images load lazily only
 * once it is opened.
 */

const isPortrait = (p: Photo) => p.height > p.width * 1.05;
const ratio = (p: Photo) => ({ aspectRatio: `${p.width} / ${p.height}` });

type OpenFn = (id: string, el: HTMLElement) => void;

/** Rows for the archive: portraits pair with the next landscape; landscapes pair; every fourth row is single and wide. */
function archiveRows(ids: readonly string[]): Row[] {
  const rows: Row[] = [];
  const list = [...ids];
  let n = 0;
  while (list.length) {
    const a = list.shift() as string;
    const pa = photos[a];
    if (n % 4 === 3 && !isPortrait(pa)) {
      rows.push({ kind: n % 8 === 3 ? "wide" : "wideRight", ids: [a] });
    } else if (isPortrait(pa)) {
      const j = list.findIndex((id) => !isPortrait(photos[id]));
      const b = j >= 0 ? list.splice(j, 1)[0] : list.shift();
      rows.push({ kind: b ? "pairPortrait" : "portrait", ids: b ? [a, b] : [a] });
    } else {
      const j = list.findIndex((id) => !isPortrait(photos[id]));
      const b = j >= 0 ? list.splice(j, 1)[0] : undefined;
      rows.push(b ? { kind: "pair", ids: [a, b] } : { kind: "wide", ids: [a] });
    }
    n++;
  }
  return rows;
}

function RowView({
  row,
  n,
  onOpen,
  openId,
  quiet = false,
  first = false,
}: {
  row: Row;
  n: number;
  onOpen: OpenFn;
  openId: string | null;
  quiet?: boolean;
  first?: boolean;
}) {
  const [a, b] = row.ids.map((id) => photos[id]);
  const flip = n % 2 === 1;
  const f = (
    p: Photo,
    o: {
      sizes: string;
      reveal: Reveal;
      duration?: number;
      className?: string;
      delay?: number;
      travel?: number;
      position?: string;
      style?: React.CSSProperties;
    },
  ) => (
    <Frame
      photo={p}
      sizes={o.sizes}
      reveal={quiet ? (o.reveal === "fade" ? "fade" : "up") : o.reveal}
      delay={o.delay}
      duration={o.duration}
      travel={quiet ? 0 : o.travel}
      position={o.position}
      priority={first}
      hidden={openId === p.id}
      onOpen={onOpen}
      className={o.className}
    />
  );
  // Phones: pairs become an offset sequence (a larger frame bled to one edge, the
  // second smaller on the other side) so no photograph is shrunk to a thumbnail;
  // from md up they sit side by side.
  const kinds: Record<RowKind, () => ReactNode> = {
    // The threshold: the first photograph, edge to edge at every size, opening
    // vertically from a narrow band and drifting a little deeper than the rest.
    threshold: () => (
      <div className="mx-[calc(-1*var(--edge))]">
        {f(a, {
          sizes: "100vw",
          reveal: "threshold",
          duration: 1.5,
          travel: 9,
          className: "aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]",
        })}
      </div>
    ),
    cinema: () => (
      <div className="mx-[calc(-1*var(--edge))]">
        {f(a, {
          sizes: "100vw",
          reveal: "center",
          travel: 6,
          className: "aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]",
        })}
      </div>
    ),
    wide: () => (
      <div className="ml-[calc(-1*var(--edge))] mr-[6%] md:mr-[20%] lg:mr-[33.3333%]">
        <div style={ratio(a)}>
          {f(a, { sizes: "(min-width: 1024px) 70vw, 95vw", reveal: "left", travel: 4, className: "h-full" })}
        </div>
      </div>
    ),
    wideRight: () => (
      <div className="ml-[6%] mr-[calc(-1*var(--edge))] md:ml-[20%] lg:ml-[33.3333%]">
        <div style={ratio(a)}>
          {f(a, { sizes: "(min-width: 1024px) 70vw, 95vw", reveal: "right", travel: 4, className: "h-full" })}
        </div>
      </div>
    ),
    pair: () => (
      <div
        className={`md:grid md:items-start md:gap-6 lg:gap-8 ${flip ? "md:grid-cols-[5fr_7fr]" : "md:grid-cols-[7fr_5fr]"}`}
      >
        <div className={flip ? "ml-[16%] md:ml-0" : "mr-[8%] md:mr-0"} style={ratio(a)}>
          {f(a, {
            sizes: "(min-width: 1024px) 55vw, (min-width: 768px) 55vw, 92vw",
            reveal: "up",
            className: "h-full",
          })}
        </div>
        <div
          className={`mt-3 md:mt-[18%] ${flip ? "mr-[22%] md:mr-0" : "ml-[30%] md:ml-0"}`}
          style={ratio(b)}
        >
          {f(b, {
            sizes: "(min-width: 1024px) 40vw, (min-width: 768px) 42vw, 70vw",
            reveal: "up",
            delay: 0.14,
            className: "h-full",
          })}
        </div>
      </div>
    ),
    pairPortrait: () => (
      <div className="md:grid md:grid-cols-[5fr_7fr] md:items-end md:gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="w-[64%] md:w-auto lg:col-span-4 lg:col-start-2" style={ratio(a)}>
          {f(a, {
            sizes: "(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 64vw",
            reveal: "down",
            className: "h-full",
          })}
        </div>
        <div
          className="-mr-[var(--edge)] ml-[14%] mt-3 md:mx-0 md:mt-0 lg:col-span-6 lg:col-start-6"
          style={ratio(b)}
        >
          {f(b, {
            sizes: "(min-width: 1024px) 48vw, (min-width: 768px) 58vw, 90vw",
            reveal: "left",
            delay: 0.12,
            className: "h-full",
          })}
        </div>
      </div>
    ),
    pairSquare: () => (
      <div className="md:grid md:grid-cols-[5fr_7fr] md:items-center md:gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="aspect-square w-[60%] md:w-auto lg:col-span-4">
          {f(a, {
            sizes: "(min-width: 1024px) 30vw, (min-width: 768px) 40vw, 60vw",
            reveal: "center",
            className: "h-full",
          })}
        </div>
        <div
          className="-mr-[var(--edge)] ml-[10%] mt-3 md:ml-0 md:mt-0 lg:col-span-8 lg:col-start-5"
          style={ratio(b)}
        >
          {f(b, {
            sizes: "(min-width: 1024px) 65vw, (min-width: 768px) 62vw, 95vw",
            reveal: "right",
            delay: 0.12,
            className: "h-full",
          })}
        </div>
      </div>
    ),
    portrait: () => (
      <div className="ml-[8%] w-[78%] md:ml-[20%] md:w-[52%] lg:ml-[33.3333%] lg:w-[36%]">
        {f(a, {
          sizes: "(min-width: 1024px) 36vw, 78vw",
          reveal: "down",
          position: "50% 50%",
          className: "aspect-[4/5]",
        })}
      </div>
    ),
    closing: () => (
      <div className="ml-auto w-[72%] md:w-[48%] lg:mr-[8.3333%] lg:w-[34%]" style={ratio(a)}>
        {f(a, { sizes: "(min-width: 1024px) 34vw, 72vw", reveal: "up", travel: 3, className: "h-full" })}
      </div>
    ),
  };
  return kinds[row.kind]();
}

/** A fine gold rule between chapters. */
function Chapter() {
  return <span aria-hidden className="block h-px w-16 bg-gold/80 md:w-24" />;
}

/*
 * The guide: a thin muted-gold line at four moments of the journey only.
 *   1  beside the right edge of the mosque, growing down it (wider screens)
 *   4  in from the right page edge under the courtyard
 *   6  beside the corridor's portrait, from above its top edge (wider screens)
 *  12  in from the left page edge toward the last photograph, at its middle
 * On phones only moments 4 and 12 appear, fainter.
 */
const guides: Record<number, ReactNode> = {
  1: (
    <Guide
      axis="y"
      from="top"
      className="top-0 bottom-[18%] hidden md:block md:left-[calc(80%+1rem)] lg:left-[calc(66.6667%+1.5rem)]"
    />
  ),
  4: (
    <Guide
      axis="x"
      from="right"
      className="-bottom-4 right-[calc(-1*var(--edge))] w-[45%] opacity-60 md:-bottom-6 md:w-[30%] md:opacity-100"
    />
  ),
  6: (
    <Guide
      axis="y"
      from="top"
      className="-top-12 bottom-[35%] hidden md:block md:left-[calc(20%-1.25rem)] lg:left-[calc(33.3333%-1.5rem)]"
    />
  ),
  12: (
    <Guide
      axis="x"
      from="left"
      className="top-1/2 left-[calc(-1*var(--edge))] w-[calc(var(--edge)+28%-0.75rem)] opacity-60 md:w-[calc(var(--edge)+52%-1.25rem)] md:opacity-100 lg:w-[calc(var(--edge)+57.6667%-1.5rem)]"
    />
  ),
};

const space = ["mt-3 md:mt-6", "mt-10 md:mt-16 lg:mt-20", "mt-6 md:mt-10 lg:mt-14"];

export function Gallery() {
  const { reduced } = useMotionProfile();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const firstArchive = useRef<HTMLDivElement>(null);

  const archiveRowsMemo = useMemo(() => archiveRows(archive), []);
  // The viewer walks the photographs in the order shown on the page.
  const list = useMemo(() => {
    const ids = [...story, ...(expanded ? archiveRowsMemo : [])].flatMap((r) => r.ids);
    return ids.map((id) => photos[id]);
  }, [expanded, archiveRowsMemo]);

  const onOpen = useCallback<OpenFn>((id) => setOpen(list.findIndex((p) => p.id === id)), [list]);
  const openId = open === null ? null : (list[open]?.id ?? null);

  const chapterAfter = new Set([2, 5, 9]);

  return (
    <>
      <div className="wrap">
        {story.map((row, i) => (
          <div key={row.ids.join("-")}>
            <div className={`relative ${i === 0 ? "" : space[i % 3]}`}>
              <RowView row={row} n={i} onOpen={onOpen} openId={openId} first={i === 0} />
              {guides[i]}
            </div>
            {chapterAfter.has(i) && (
              <div className="mt-10 md:mt-16 lg:mt-20">
                <Chapter />
              </div>
            )}
          </div>
        ))}

        {/* The archive: the rest of the source gallery, on request. */}
        {!expanded ? (
          <div className="mt-14 flex md:mt-20 lg:mt-24">
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
                requestAnimationFrame(() =>
                  firstArchive.current
                    ?.querySelector<HTMLElement>("[data-gal]")
                    ?.focus({ preventScroll: true }),
                );
              }}
              className="group inline-flex min-h-14 touch-manipulation items-center gap-4 border-y border-ink/15 py-3 pr-2 text-[1.0625rem] text-green transition-colors duration-200 hover:border-gold/60 md:text-[1.125rem]"
            >
              <span className="grid size-10 place-items-center border border-gold/70 transition-colors duration-200 group-hover:bg-gold-soft/30">
                <ArrowDown className="transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
              </span>
              <span>{g.more}</span>
              <span className="text-[0.875rem] tabular-nums text-ink-soft">{archive.length}</span>
            </button>
          </div>
        ) : (
          <div ref={firstArchive} className="mt-14 md:mt-20 lg:mt-24">
            <Chapter />
            {archiveRowsMemo.map((row, i) => (
              <div key={row.ids.join("-")} className={i === 0 ? "mt-8 md:mt-12" : "mt-6 md:mt-10 lg:mt-12"}>
                <RowView row={row} n={i} onOpen={onOpen} openId={openId} quiet />
              </div>
            ))}
          </div>
        )}
      </div>

      {open !== null && (
        <Lightbox
          list={list}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          reduced={reduced}
        />
      )}
    </>
  );
}
