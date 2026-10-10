import type { CSSProperties } from "react";
import { oiuContent } from "@/content/oiu";
import type { Locale } from "@/i18n/config";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Line, Plate, Tick, Wall } from "./OiuMotion";

/*
 * Objekat i uslovi, walked through as a building.
 *
 * One gold line is the plan of the walk. It arrives from the page edge under
 * the title and passes behind the threshold photograph (the source's banner),
 * comes down as a wall through the central mosque, lays out the figures as a
 * dimension chain, then turns into each space in turn:
 *
 *   Internatski smještaj   the wall turns and runs behind a wide photo bled left
 *   Biblioteka             a lintel and a wall frame a tall photo's corner
 *   Amfiteatar             the line passes behind the full-width hall
 *   Book caffe             a corridor enters a framed room through its doorway
 *   Sala                   the wall runs behind the last photo, bled right;
 *                          below it the line turns once more and dissolves
 *
 * Each `sizes` covers its frame's crop and the parallax overscan (the photo is
 * taller than its frame), so no photograph is upscaled.
 *
 * Photographs sit on a plane above the line; the line is only ever seen
 * between them. Desktop positions are twelfths of the content box (the grid
 * has no gutters, so columns and lines share coordinates); --edge is the
 * distance from the content box to the page edge, for bleeds.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.75] text-ink md:text-[1.125rem] md:leading-[1.8]";
const room =
  "display hist-text text-[clamp(2.125rem,1.5rem+2.4vw,3.5rem)] leading-[1] tracking-[-0.025em] text-green";

/** Desktop column boundary k (0–12) as a percentage of the content box. */
const col = (k: number) => `${((k / 12) * 100).toFixed(4)}%`;

export function Oiu({ locale }: { locale: Locale }) {
  const o = oiuContent[locale];
  const [internat, biblioteka, amfiteatar, bookCaffe, sala] = o.spaces;
  return (
    <article
      className="overflow-x-clip bg-paper pb-14 text-ink md:pb-24"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Title ---------- */}
      <header className="wrap pt-32 md:pt-48">
        <Reveal variant="label">
          <p className="eyebrow eyebrow-display text-gold-deep">{o.eyebrow}</p>
        </Reveal>
        <LineReveal
          as="h1"
          immediate
          lines={[o.title]}
          className="display hist-text mt-5 text-[clamp(2.75rem,1.3rem+6.4vw,7.25rem)] leading-[0.98] tracking-[-0.03em] text-green md:mt-6"
        />
      </header>

      {/* ---------- Threshold: the line arrives and passes behind the first photograph ---------- */}
      <div className="wrap mt-10 md:mt-16">
        <div className="relative">
          <Line
            origin="left"
            delay={0.35}
            duration={0.9}
            className="top-[42%] left-[calc(-1*var(--edge))] w-[calc(var(--edge)+30%)] md:w-[calc(var(--edge)+45%)]"
          />
          <div className="relative z-10 ml-[14%] mr-[calc(-1*var(--edge))] md:ml-[33.3333%]">
            <Plate
              image={o.banner}
              immediate
              priority
              from="left"
              delay={0.85}
              travel={4}
              sizes="(min-width: 1024px) 78vw, 190vw"
              className="h-[clamp(7.5rem,34vw,11rem)] md:h-auto md:aspect-[1420/280]"
            />
          </div>
          {/* Phones: the line resumes below the photograph, stopping short of the text. */}
          <Line origin="top" delay={1.4} duration={0.5} className="top-full left-[86%] h-8 md:hidden" />
        </div>
      </div>

      {/* ---------- Introduction and the central mosque; then the figures ---------- */}
      <section aria-label={o.title} className="wrap">
        <div className="relative pb-16 pt-12 md:pb-24 md:pt-20">
          {/* The wall: from the threshold, behind the mosque, down to the dimension chain. */}
          <Wall className="top-0 bottom-0 hidden md:block" style={{ left: col(9) }} />
          {/* Phones: from the mosque down to the chain. */}
          <Line origin="top" duration={0.5} className="bottom-0 left-[86%] h-16 md:hidden" />

          <div className="md:grid md:grid-cols-12">
            <div className="flex flex-col md:col-span-6 md:pr-6 lg:pr-10">
              <Reveal y={16}>
                <p className="hist-text max-w-[30em] text-[1.1875rem] font-light leading-[1.6] text-ink md:text-[1.25rem] md:leading-[1.58] lg:text-[1.375rem]">
                  {o.intro[0]}
                </p>
              </Reveal>
              <Reveal
                y={16}
                delay={0.05}
                className="mt-7 md:mb-24 md:mt-auto md:pt-12 lg:ml-[16.6667%]"
              >
                <p className={`${body} max-w-[30em]`}>{o.intro[1]}</p>
              </Reveal>
            </div>

            <div className="relative ml-auto mt-12 w-[78%] md:col-span-5 md:col-start-8 md:ml-0 md:mt-28 md:w-auto">
              {/* Phones: from the text into the photograph, behind it. */}
              <Line
                origin="top"
                duration={0.6}
                className="-top-12 left-[82.05%] h-[calc(3rem+30%)] md:left-[77.4%] md:hidden"
              />
              <Plate
                image={o.mosque}
                from="top"
                travel={6}
                sizes="(min-width: 1024px) 47vw, (min-width: 768px) 70vw, 88vw"
                className="z-10 aspect-[1014/1116]"
              />
            </div>
          </div>
        </div>

        {/* The figures as a dimension chain: the wall turns into it; ticks mark each measure. */}
        <div className="relative pb-20 md:pb-28">
          {/* Desktop: the chain runs the width of the content, the wall meeting it at 9/12. */}
          <Line
            origin="right"
            duration={1.1}
            className="top-0 left-0 hidden md:block"
            style={{ width: col(9) }}
          />
          <Line
            origin="left"
            duration={0.5}
            delay={0.5}
            className="top-0 right-0 hidden md:block"
            style={{ left: col(9) }}
          />
          {[0, 4, 9, 12].map((k, i) => (
            <Tick
              key={k}
              delay={0.25 + i * 0.12}
              className="top-0 hidden md:block"
              style={{ left: col(k) }}
            />
          ))}
          {/* …and turns down at its end, toward the first space. */}
          <Line
            origin="top"
            duration={0.6}
            delay={0.7}
            className="top-0 bottom-0 left-full hidden md:block"
          />

          {/* Phones: the line turns left above the chain, then runs down its side. */}
          <Line origin="right" duration={0.7} className="top-0 left-0 w-[86%] md:hidden" />
          <Line origin="top" duration={1.2} delay={0.4} className="top-0 bottom-0 left-0 md:hidden" />

          <dl className="md:grid md:grid-cols-12">
            {o.figures.map((f, i) => (
              <Reveal
                key={f.label}
                y={14}
                delay={0.1 + i * 0.08}
                className={`relative flex flex-col pl-6 pt-8 md:pl-8 lg:pl-6 lg:pr-6 lg:pt-7 ${
                  ["md:col-span-4", "md:col-span-5", "md:col-span-3"][i]
                }`}
              >
                {/* Phones: a tick where each measure begins on the chain. */}
                <Tick delay={0.3 + i * 0.1} className="left-0 top-[2.85rem] md:hidden" />
                <dt className="hist-text order-last mt-3 max-w-[22em] text-[0.9375rem] leading-[1.55] text-ink-soft md:text-[1rem]">
                  {f.label}
                </dt>
                <dd className="display whitespace-nowrap text-[clamp(2.75rem,2rem+3.2vw,4.25rem)] leading-[1] tracking-[-0.03em] text-green md:text-[clamp(2.5rem,0.5rem+4vw,3rem)] lg:text-[clamp(2.75rem,2rem+3.2vw,4.25rem)]">
                  {f.value}
                  {f.unit && (
                    // The source's space before the unit, kept (narrow, unbreakable).
                    <span className="align-[0.42em] text-[0.42em] tracking-normal text-gold-deep">
                      {"\u202f"}
                      {f.unit}
                    </span>
                  )}
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Internatski smještaj: the wall turns and runs behind a wide photograph ---------- */}
      <section aria-labelledby={`oiu-${internat.id}`} className="wrap">
        <div className="relative md:grid md:grid-cols-12">
          <Line origin="top" duration={0.5} className="top-0 left-full hidden h-24 md:block" />
          <Line
            origin="right"
            duration={1}
            delay={0.35}
            className="top-24 right-0 hidden md:block"
            style={{ left: col(3) }}
          />

          <div className="flex flex-col md:col-span-7">
            <div className="relative z-10 mx-[calc(-1*var(--edge))] md:mr-0">
              <Plate
                image={internat.image}
                from="right"
                travel={5}
                sizes="(min-width: 1024px) 68vw, (min-width: 768px) 103vw, 124vw"
                className="aspect-[4/3] md:aspect-[3/2]"
              />
            </div>
            {/* Below the photograph the line comes out again and runs on to the library. */}
            <div className="relative hidden flex-1 md:block">
              <Line
                origin="top"
                duration={0.7}
                className="top-0 -bottom-24"
                style={{ left: `calc(${col(2)} * 12 / 7)` }}
              />
            </div>
          </div>

          <div className="relative pl-6 pt-10 md:col-span-5 md:col-start-8 md:pl-6 md:pt-[7.75rem] lg:col-span-4 lg:col-start-9 lg:pl-0">
            {/* Phones: the line runs down beside the text and on to the library. */}
            <Line origin="top" duration={1} className="top-0 -bottom-16 left-0 md:-bottom-20 md:hidden" />
            <h2 id={`oiu-${internat.id}`} className={room}>
              <Reveal as="span" variant="fade" className="block">
                {internat.heading}
              </Reveal>
            </h2>
            <Reveal y={16} delay={0.08}>
              <p className={`${body} mt-6 max-w-[30em] md:mt-7`}>{internat.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Biblioteka: a lintel and a wall frame the corner of a tall photograph ---------- */}
      <section aria-labelledby={`oiu-${biblioteka.id}`} className="wrap mt-16 md:mt-24">
        <div className="relative pt-4 md:grid md:grid-cols-12 md:items-end md:pt-6">
          {/* Desktop: lintel from the wall that came down at 2/12, to past the photo's right edge. */}
          <Line
            origin="left"
            duration={0.9}
            className="top-0 hidden md:block"
            style={{ left: col(2), width: `calc(${col(9)} + 1.5rem)` }}
          />
          <Line
            origin="top"
            duration={1.1}
            delay={0.55}
            className="top-0 -bottom-24 hidden md:block"
            style={{ left: `calc(${col(11)} + 1.5rem)` }}
          />
          {/* Phones: the lintel and the wall at the photograph's right. */}
          <Line origin="left" duration={0.7} className="top-0 left-0 w-[calc(84%+0.75rem)] md:hidden" />
          <Line
            origin="top"
            duration={1.1}
            delay={0.4}
            className="top-0 -bottom-16 left-[calc(84%+0.75rem)] md:-bottom-20 md:hidden"
          />

          <div className="relative z-10 w-[84%] md:order-2 md:col-span-5 md:col-start-7 md:w-auto">
            <Plate
              image={biblioteka.image}
              from="top"
              travel={6}
              sizes="(min-width: 1024px) 88vw, 176vw"
              className="aspect-[4/5]"
            />
          </div>

          <div className="w-[84%] pt-10 md:order-1 md:col-span-6 md:w-auto md:pb-2 md:pr-8 md:pt-0 lg:col-span-4 lg:pr-6">
            <h2 id={`oiu-${biblioteka.id}`} className={room}>
              <Reveal as="span" variant="fade" className="block">
                {biblioteka.heading}
              </Reveal>
            </h2>
            <Reveal y={16} delay={0.08}>
              <p className={`${body} mt-6 max-w-[24em] md:mt-7`}>{biblioteka.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Amfiteatar: the line passes behind the whole hall ---------- */}
      <section aria-labelledby={`oiu-${amfiteatar.id}`} className="mt-16 md:mt-24">
        <div className="relative z-10">
          <Plate
            image={amfiteatar.image}
            from="bottom"
            travel={8}
            sizes="(min-width: 768px) 100vw, 140vw"
            className="aspect-[5/4] md:aspect-auto md:h-[clamp(30rem,44vw,44rem)]"
          />
        </div>
        <div className="wrap">
          <div className="relative pl-6 pt-10 md:grid md:grid-cols-12 md:items-end md:pl-0 md:pt-14">
            {/* The line comes out from under the hall and runs on to the next room's corridor. */}
            <Line
              origin="top"
              duration={1}
              className="top-0 left-0 -bottom-[calc(4rem+3.875rem)] md:left-[8.3333%] md:-bottom-48"
            />
            <h2
              id={`oiu-${amfiteatar.id}`}
              className="display hist-text text-[clamp(2.75rem,1.6rem+4.6vw,6rem)] leading-[0.95] tracking-[-0.035em] text-green md:col-span-6 md:pl-[calc(100%/6+1.75rem)]"
            >
              <Reveal as="span" variant="fade" className="block">
                {amfiteatar.heading}
              </Reveal>
            </h2>
            <Reveal y={16} delay={0.08} className="md:col-span-5 md:col-start-8 md:pb-[0.45rem] lg:col-span-4">
              <p className={`${body} mt-5 max-w-[22em] md:mt-0`}>{amfiteatar.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Book caffe: a corridor enters a framed room through its doorway ---------- */}
      <section aria-labelledby={`oiu-${bookCaffe.id}`} className="wrap mt-16 md:mt-24">
        <div className="relative md:grid md:grid-cols-12">
          <div className="relative flex flex-col pt-3 md:order-2 md:col-span-5 md:col-start-7 md:pt-6">
            <div className="relative ml-[10%] w-[78%] md:ml-0 md:w-auto">
              {/* The room: three walls and a fourth with a doorway (the frame sits off the photo). */}
              <Line
                origin="left"
                duration={0.9}
                delay={0.4}
                className="-top-3 -left-3 -right-3 md:-top-6 md:-left-6 md:-right-6"
              />
              <Line
                origin="top"
                duration={0.9}
                delay={0.6}
                className="-top-3 -bottom-3 -right-3 md:-top-6 md:-bottom-6 md:-right-6"
              />
              <Line
                origin="right"
                duration={0.9}
                delay={0.8}
                className="-bottom-3 -left-3 -right-3 md:-bottom-6 md:-left-6 md:-right-6"
              />
              <Line
                origin="top"
                duration={0.3}
                delay={0.4}
                className="-top-3 -left-3 h-8 md:-top-6 md:-left-6 md:h-[3rem]"
              />
              <Line
                origin="bottom"
                duration={0.6}
                delay={0.8}
                className="top-[5rem] -bottom-3 -left-3 md:top-[7.5rem] md:-bottom-6 md:-left-6"
              />
              <div className="relative z-10">
                <Plate
                  image={bookCaffe.image}
                  from="left"
                  travel={5}
                  delay={0.2}
                  sizes="(min-width: 1024px) 47vw, 86vw"
                  className="aspect-[3/2]"
                />
              </div>
            </div>
            {/* Desktop: the walk continues from the room's far corner, down to the hall. */}
            <div className="relative hidden flex-1 md:block">
              <Line origin="top" duration={0.8} delay={1} className="top-0 -right-6 -bottom-24" />
            </div>
          </div>

          {/* Desktop: the corridor, from the line that came down at 1/12, through the doorway. */}
          <Line
            origin="left"
            duration={0.9}
            className="hidden md:block"
            style={{ top: "6rem", left: col(1), width: `calc(${col(5)} - 1.5rem)` }}
          />
          {/* Phones: the corridor from the page's line into the doorway. */}
          <Line
            origin="left"
            duration={0.6}
            className="top-[3.875rem] left-0 w-[calc(10%-0.75rem)] md:w-[calc(12%-0.75rem)] md:hidden"
          />

          <div className="relative pr-[16%] pt-12 md:order-1 md:col-span-6 md:col-start-1 md:pl-[calc(100%/6+1.25rem)] md:pr-8 md:pt-[7.5rem] lg:col-span-5 lg:pl-[calc(100%/5+1.75rem)]">
            {/* Phones: from the room's far corner, down beside the text to the hall. */}
            <Line
              origin="top"
              duration={1}
              className="-top-3 -bottom-16 left-[calc(88%+0.75rem)] md:-bottom-20 md:left-[calc(82%+0.75rem)] md:hidden"
            />
            <h2 id={`oiu-${bookCaffe.id}`} className={room}>
              <Reveal as="span" variant="fade" className="block">
                {bookCaffe.heading}
              </Reveal>
            </h2>
            <Reveal y={16} delay={0.08}>
              <p className={`${body} mt-6 max-w-[26em] md:mt-7`}>{bookCaffe.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Sala: the wall runs behind the last photograph; then the line dissolves ---------- */}
      <section aria-labelledby={`oiu-${sala.id}`} className="wrap mt-16 md:mt-24">
        <div className="relative md:grid md:grid-cols-12 md:items-end">
          <div className="relative z-10 ml-[8%] mr-[calc(-1*var(--edge))] md:order-2 md:col-span-7 md:col-start-6 md:ml-0 lg:col-span-8 lg:col-start-5">
            <Plate
              image={sala.image}
              from="right"
              travel={6}
              sizes="(min-width: 1024px) 78vw, (min-width: 768px) 103vw, 116vw"
              className="aspect-[4/3] md:aspect-[3/2]"
            />
          </div>
          <div className="relative pr-[16%] pt-10 md:order-1 md:col-span-5 md:pb-2 md:pr-8 md:pt-0 lg:col-span-4 lg:pr-10">
            <Line
              origin="top"
              duration={0.9}
              className="top-0 bottom-0 left-[calc(88%+0.75rem)] md:left-[calc(82%+0.75rem)] md:hidden"
            />
            <h2 id={`oiu-${sala.id}`} className={room}>
              <Reveal as="span" variant="fade" className="block">
                {sala.heading}
              </Reveal>
            </h2>
            <Reveal y={16} delay={0.08}>
              <p className={`${body} mt-6 max-w-[26em] md:mt-7`}>{sala.text}</p>
            </Reveal>
          </div>
        </div>

        {/* The end of the walk: out from under the hall, one turn, and the line dissolves. */}
        <div aria-hidden className="relative h-16 md:h-24">
          <Line
            origin="top"
            duration={0.5}
            className="top-0 h-full left-[calc(88%+0.75rem)] md:left-[calc(82%+0.75rem)] md:hidden"
          />
          <Line
            origin="right"
            duration={1.4}
            delay={0.45}
            fade="left"
            className="bottom-0 left-[8%] w-[calc(80%+0.75rem)] md:w-[calc(74%+0.75rem)] md:hidden"
          />
          <Line
            origin="top"
            duration={0.5}
            className="top-0 hidden h-full md:block"
            style={{ left: col(7) }}
          />
          <Line
            origin="right"
            duration={1.6}
            delay={0.45}
            fade="left"
            className="bottom-0 hidden md:block"
            style={{ left: col(1), width: col(6) }}
          />
        </div>
      </section>
    </article>
  );
}
