import type { CSSProperties, ReactNode } from "react";
import { tiu as t, type Achievement, type Year } from "@/content/tiu";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Line, Numeral, Resolve, Settle, Stream } from "./TiuMotion";

/*
 * Takmičenja i uspjesi: achievement through time.
 *
 * The years are the composition. Each one arrives differently and the gold line
 * takes a different route through each, so the chronology reads as one walk
 * from 2025 back to 2021:
 *
 *   2025  rises out of a line that crosses the whole page, entering from the
 *         right edge; the line drops between its two achievements
 *   2024  turns left and runs down the text, the year a slow plane behind it
 *   2023  the line comes down to the year, which unrolls along it, tight
 *   2022  the line crosses empty space; the year drifts across it
 *   2021  the line turns back across the page and leaves off the left edge,
 *         the year entering from that edge
 *   Trag  the line reappears edge to edge: the chronology opens into the
 *         closing statement, whose categories resolve one after another
 *
 * Phones keep every year's arrival; the line alternates sides (never a spine).
 * Desktop positions are twelfths of the content box (no grid gutters); --edge
 * reaches the page edge. Sections carry their own runs, so each section's top
 * meets the previous one's bottom.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";
const col = (k: number) => `${((k / 12) * 100).toFixed(4)}%`;

const numeral = "display leading-[0.8] tracking-[-0.045em]";

/** Hyphenated compounds never split at the hyphen. */
function whole(text: string, key: string): ReactNode[] {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={`${key}-${i}`} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** The line's own words; its emphasised phrases set a little stronger. */
function rich(text: string, emphasis: readonly string[] = []): ReactNode[] {
  if (!emphasis.length) return whole(text, "t");
  const re = new RegExp(`(${emphasis.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
  return text.split(re).map((part, i) =>
    emphasis.includes(part) ? (
      <span key={i} className="font-normal text-green">
        {whole(part, `e${i}`)}
      </span>
    ) : (
      <span key={i}>{whole(part, `p${i}`)}</span>
    ),
  );
}

function Achievement({
  lines,
  delay = 0,
  className = "",
}: {
  lines: Achievement;
  delay?: number;
  className?: string;
}) {
  const [first, ...rest] = lines;
  return (
    <Settle delay={delay} className={className}>
      <p className="hist-text max-w-[32em] text-[1.125rem] font-light leading-[1.6] text-ink md:text-[1.25rem] md:leading-[1.6]">
        {rich(first.text, first.emphasis)}
      </p>
      {rest.map((l) => (
        <p
          key={l.text}
          className="hist-text mt-4 max-w-[34em] text-[1rem] font-light leading-[1.75] text-ink-soft md:mt-5 md:text-[1.0625rem]"
        >
          {rich(l.text, l.emphasis)}
        </p>
      ))}
    </Settle>
  );
}

const yearOf = (y: string) => t.years.find((x) => x.year === y) as Year;

export function Tiu() {
  const [y25, y24, y23, y22, y21] = ["2025", "2024", "2023", "2022", "2021"].map(yearOf);
  return (
    <article
      className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Opening ---------- */}
      <header className="wrap pt-32 md:pt-44 lg:pt-48">
        <LineReveal
          as="h1"
          immediate
          lines={[t.title, t.heading]}
          lineClasses={[
            "",
            "mt-3 text-[clamp(1.25rem,0.95rem+1.5vw,2.25rem)] font-normal leading-[1.2] tracking-[-0.01em] text-green/70 md:mt-4",
          ]}
          className="display hist-text text-[min(10vw,clamp(2.75rem,1.3rem+6.4vw,7.25rem))] leading-[0.98] tracking-[-0.03em] text-green"
        />
      </header>
      <section aria-label={t.heading} className="wrap mt-10 md:mt-14 lg:mt-16">
        <Reveal y={16}>
          <p className="hist-text max-w-[34em] text-[1.125rem] font-light leading-[1.65] text-ink md:text-[1.3125rem] md:leading-[1.6] lg:max-w-[38em]">
            {rich(t.intro)}
          </p>
        </Reveal>
      </section>

      {/* ---------- 2025: rises out of a line across the page, from the right edge ---------- */}
      <section aria-labelledby="tiu-2025" className="wrap mt-16 md:mt-20 lg:mt-24">
        <Numeral
          id="tiu-2025"
          arrival="edge-right"
          className={`${numeral} text-right text-[min(30vw,10rem)] text-green lg:-mr-[calc(var(--edge)*0.45)] lg:text-[clamp(10rem,17vw,19rem)]`}
        >
          {y25.year}
        </Numeral>
        <div className="relative h-px">
          <Line
            origin="left"
            duration={1.3}
            className="inset-y-0 left-[calc(-1*var(--edge))] right-[calc(-1*var(--edge))]"
          />
        </div>
        <div className="relative pt-8 md:pt-10 lg:grid lg:grid-cols-12 lg:pt-12">
          <Stream className="top-0 bottom-0 left-0 lg:hidden" />
          <Stream className="top-0 bottom-0 hidden lg:block" style={{ left: col(7) }} />
          <Achievement lines={y25.achievements[0]} className="pl-5 md:pl-8 lg:col-span-6 lg:pl-0 lg:pr-14" />
          <Achievement
            lines={y25.achievements[1]}
            delay={0.12}
            className="mt-10 pl-5 md:pl-8 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:pl-10"
          />
        </div>
      </section>

      {/* ---------- 2024: the line turns and runs down the text; the year a slower plane ---------- */}
      <section aria-labelledby="tiu-2024" className="wrap">
        <div className="relative pt-20 md:pt-24 lg:pt-28">
          {/* Phones: across to the right, then down the right side. Desktop: left, then down. */}
          <Line origin="left" duration={0.8} className="top-0 left-0 right-0 lg:hidden" />
          <Stream className="top-0 bottom-0 left-full lg:hidden" />
          <Line
            origin="right"
            duration={0.8}
            className="top-0 left-0 hidden lg:block"
            style={{ width: col(7) }}
          />
          <Stream className="top-0 bottom-0 left-0 hidden lg:block" />

          <Numeral
            id="tiu-2024"
            arrival="layer"
            className={`${numeral} pointer-events-none absolute right-0 top-14 z-0 text-[37vw] text-[#ece2cc] md:top-16 lg:right-8 lg:top-16 lg:text-[min(28vw,26rem)]`}
          >
            {y24.year}
          </Numeral>
          <div className="relative z-10 pr-5 pt-[30vw] md:pr-8 lg:max-w-[58.3333%] lg:pl-10 lg:pr-0 lg:pt-24">
            <Achievement lines={y24.achievements[0]} />
            <Achievement lines={y24.achievements[1]} delay={0.1} className="mt-10 md:mt-12 lg:mt-14" />
          </div>
        </div>
      </section>

      {/* ---------- 2023: the line comes down to the year, which unrolls along it ---------- */}
      <section aria-labelledby="tiu-2023" className="wrap pt-16 md:pt-20 lg:pt-24">
        <div className="relative">
          {/* Phones: back across to the left first. */}
          <Line origin="right" duration={0.8} className="-top-16 left-0 right-0 md:-top-20 lg:hidden" />
          <Stream className="-top-16 bottom-0 left-0 md:-top-20 lg:-top-24" />
          <Numeral
            id="tiu-2023"
            arrival="line"
            className={`${numeral} pb-3 pl-5 text-[min(25vw,8rem)] text-green md:pl-8 lg:pb-4 lg:pl-6 lg:text-[clamp(7rem,11vw,11.5rem)]`}
          >
            {y23.year}
          </Numeral>
          <Line origin="left" duration={0.9} delay={0.2} className="bottom-0 left-0 w-[60%] lg:hidden" />
          <Line
            origin="left"
            duration={0.9}
            delay={0.2}
            className="bottom-0 left-0 hidden lg:block"
            style={{ width: col(6) }}
          />
        </div>
        <div className="relative pt-8 md:pt-10 lg:grid lg:grid-cols-12 lg:pt-12">
          <Stream className="top-0 bottom-0 left-0 lg:left-1/2" />
          <Achievement
            lines={y23.achievements[0]}
            className="pl-5 md:pl-8 lg:col-span-5 lg:col-start-7 lg:pl-10"
          />
        </div>
      </section>

      {/* ---------- 2022: across empty space; the year drifts over the line ---------- */}
      <section aria-labelledby="tiu-2022" className="wrap pt-24 md:pt-32 lg:pt-40">
        <div className="relative">
          <Stream className="-top-24 bottom-0 left-0 md:-top-32 lg:-top-40 lg:left-1/2" />
          <Numeral
            id="tiu-2022"
            arrival="drift"
            className={`${numeral} pb-3 pr-1 text-right text-[min(22vw,7rem)] text-gold-deep lg:pb-4 lg:text-[clamp(6rem,9vw,9.5rem)]`}
          >
            {y22.year}
          </Numeral>
          <Line origin="left" duration={1} className="bottom-0 left-0 right-0 lg:hidden" />
          <Line
            origin="left"
            duration={1}
            className="bottom-0 right-0 hidden lg:block"
            style={{ left: col(6) }}
          />
        </div>
        <div className="relative pr-5 pt-8 md:pr-8 md:pt-10 lg:grid lg:grid-cols-12 lg:pr-0 lg:pt-12">
          <Stream className="top-0 bottom-0 left-full" />
          <Achievement lines={y22.achievements[0]} className="lg:col-span-5 lg:col-start-2" />
        </div>
      </section>

      {/* ---------- 2021: the line turns back and leaves off the left edge; the year enters from it ---------- */}
      <section aria-labelledby="tiu-2021" className="wrap pt-20 md:pt-24 lg:pt-28">
        <div className="relative">
          <Stream className="-top-20 bottom-0 left-full md:-top-24 lg:-top-28" />
          <Numeral
            id="tiu-2021"
            arrival="edge-left"
            className={`${numeral} text-[min(30vw,10rem)] text-green lg:-ml-[calc(var(--edge)*0.45)] lg:text-[clamp(10rem,17vw,19rem)]`}
          >
            {y21.year}
          </Numeral>
          <Line
            origin="right"
            duration={1.4}
            delay={0.3}
            fade="left"
            className="bottom-0 left-[calc(-1*var(--edge))] right-0"
          />
        </div>
        <div className="pt-8 md:pt-10 lg:grid lg:grid-cols-12 lg:pt-12">
          <Achievement lines={y21.achievements[0]} className="lg:col-span-6 lg:col-start-7 lg:pl-10" />
        </div>
      </section>

      {/* ---------- Pobjednici koji ostavljaju trag: the chronology opens out ---------- */}
      <section aria-labelledby="tiu-trag" className="wrap mt-24 md:mt-32 lg:mt-40">
        <div className="relative pt-12 md:pt-14 lg:grid lg:grid-cols-12 lg:pt-16">
          <Line
            origin="center"
            duration={1.5}
            className="top-0 left-[calc(-1*var(--edge))] right-[calc(-1*var(--edge))]"
          />
          <div className="lg:col-span-10">
            <h2
              id="tiu-trag"
              className="display hist-text text-[clamp(1.875rem,1.1rem+3.3vw,4.5rem)] leading-[1.02] tracking-[-0.02em] text-green"
            >
              {t.closing.heading}
            </h2>
            <Reveal y={14} delay={0.05}>
              <p className="hist-text mt-6 max-w-[32em] text-[1.125rem] font-light leading-[1.6] text-ink md:mt-8 md:text-[1.25rem]">
                {rich(t.closing.lead)}
              </p>
            </Reveal>
          </div>
          <ul className="mt-10 md:mt-12 lg:col-span-10 lg:col-start-3 lg:mt-14">
            {t.closing.items.map((c) => (
              <Resolve
                key={c}
                className="hist-text border-t border-ink/12 py-4 text-[clamp(1.25rem,1rem+1.5vw,2.5rem)] leading-[1.2] tracking-[-0.015em] text-green last:border-b md:py-5"
              >
                {c}
              </Resolve>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
