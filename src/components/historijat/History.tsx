import Image from "next/image";
import type { ReactNode } from "react";
import { historijat as h } from "@/content/historijat";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { HistoryThread, ThreadPoint } from "./HistoryThread";
import { DrawRule, Marker } from "./HistoryMotion";

/*
 * Historijat: the history of the Medresa read as a sequence of periods.
 *
 *   Opening   title across the page, the founding place and date, the aerial view
 *   I   2008  Osnivanje — the founding, beside the entrance arch
 *             Od tada do danas — the three figures
 *   II  2015  Svršenici i akreditacija — beside the first generation's tablo
 *   III       Žensko odjeljenje u Tuzima — beside the arches
 *   IV  28. 9. 2015.  Rožaje — a deep-green pause
 *   V   Danas — 360+, then the campus from the air
 *   Closing   the welcome and the verse, in Bosnian and Albanian
 *
 * One gold thread (HistoryThread) runs through it all, arriving at each
 * chapter's rule. Large period markers drift slightly slower than the page.
 */

/** Gutter-relative anchor positions for the thread. */
const IN_MARGIN = "absolute top-0 left-[calc(var(--gutter)/-2)]";
const IN_GUTTER = "absolute top-0 left-[calc(var(--gutter)/-2)] lg:-left-6";

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.7] text-ink md:text-[1.125rem] md:leading-[1.75]";
const markerType = "display block leading-[0.82] tracking-[-0.045em]";

function ChapterHead({
  numeral,
  label,
  time,
  anchor = IN_GUTTER,
  tone = "light",
}: {
  numeral: string;
  label: string;
  time?: { label: string; iso: string };
  anchor?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="relative">
      <ThreadPoint className={anchor} />
      <DrawRule className={dark ? "bg-gold/60" : "bg-gold/70"} />
      <Reveal variant="label" className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 md:mt-5">
        <span className={`eyebrow ${dark ? "text-gold-soft" : "text-gold-deep"}`}>{numeral}</span>
        <h2 className={`eyebrow ${dark ? "text-gold-soft" : "text-gold-deep"}`}>{label}</h2>
        {time && (
          <time
            dateTime={time.iso}
            className={`whitespace-nowrap text-[0.8125rem] ${dark ? "text-ivory/70" : "text-ink-soft"}`}
          >
            {time.label}
          </time>
        )}
      </Reveal>
    </div>
  );
}

function Para({
  children,
  className = "",
  delay = 0.08,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} y={18}>
      <p className={`${body} max-w-[34em] ${className}`}>{children}</p>
    </Reveal>
  );
}

export function History() {
  const c = h.chapters;
  return (
    <article className="bg-paper text-ink">
      <HistoryThread>
        {/* ---------- Opening ---------- */}
        <header className="wrap relative pb-14 pt-32 md:pb-20 md:pt-44 lg:pb-24 lg:pt-48">
          <Reveal variant="label">
            <p className="eyebrow eyebrow-display mb-5 text-gold-deep md:mb-6">{h.hero.eyebrow}</p>
          </Reveal>
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            <LineReveal
              as="h1"
              immediate
              lines={h.hero.heading}
              className="display hist-text text-[clamp(2.625rem,1.2rem+6.4vw,7rem)] leading-[0.98] tracking-[-0.03em] text-green lg:col-span-9"
            />

            {/* The founding, as an archival stamp: where and when. */}
            <div className="relative mt-9 md:mt-12 lg:col-span-3 lg:mt-0 lg:self-end lg:pb-3">
              <ThreadPoint className={IN_GUTTER} />
              <DrawRule className="bg-gold/70" delay={0.3} />
              <Reveal variant="fade" delay={0.45}>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 text-[0.8125rem] md:mt-5 lg:grid-cols-1 lg:gap-y-4">
                  <div>
                    <dt className="eyebrow text-[0.625rem] text-gold-deep">Sjedište</dt>
                    <dd className="mt-1 text-[0.9375rem] text-ink">{h.hero.place}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-[0.625rem] text-gold-deep">Početak rada</dt>
                    <dd className="mt-1 text-[0.9375rem] text-ink">
                      <time dateTime={h.hero.date.iso}>{h.hero.date.label}</time>
                    </dd>
                  </div>
                </dl>
              </Reveal>
            </div>
          </div>
          <figure className="relative z-[1] mt-9 -mx-[var(--gutter)] md:mx-0 md:mt-12 lg:ml-[16.6%] lg:mt-16 lg:-mr-[calc(var(--gutter)+max(0px,(100vw-var(--max))/2))]">
            <ParallaxImage
              image={h.hero.image}
              priority
              travel={6}
              scale={[1.08, 1]}
              sizes="(min-width: 1024px) 68vw, 100vw"
              className="aspect-[4/3] md:aspect-[16/10] lg:aspect-[16/9]"
            />
            <figcaption className="mt-3 px-[var(--gutter)] text-[0.75rem] text-ink-soft md:px-0">
              {h.hero.caption}
            </figcaption>
          </figure>
        </header>

        {/* ---------- I · 2008 · Osnivanje ---------- */}
        <section aria-labelledby="h-osnivanje" className="wrap relative pb-14 md:pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 lg:gap-x-12">
            <div className="relative lg:col-span-5">
              <Marker>
                <span className={`${markerType} text-[clamp(6.5rem,3rem+17vw,17rem)] text-green/[0.09]`}>
                  {c.founding.marker}
                </span>
              </Marker>
              <div className="relative z-[1] -mt-8 hidden w-[72%] lg:-mt-16 lg:block">
                <ParallaxImage image={c.founding.image} travel={7} sizes="30vw" className="aspect-[4/5]" />
              </div>
            </div>
            <div className="mt-3 lg:col-span-7 lg:mt-24 lg:pl-[8%]">
              <div id="h-osnivanje">
                <ChapterHead numeral="I" label={c.founding.label} time={c.founding.date} />
              </div>
              <Reveal delay={0.08} y={18}>
                <p className="hist-text mt-6 max-w-[30em] text-[1.25rem] font-light leading-[1.6] text-ink md:mt-8 md:text-[1.4375rem] md:leading-[1.55]">
                  {c.founding.text}
                </p>
              </Reveal>
              <div className="relative z-[1] mt-8 -mx-[var(--gutter)] md:mx-0 lg:hidden">
                <ParallaxImage image={c.founding.image} travel={6} sizes="100vw" className="aspect-[4/3]" />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Od tada do danas: the figures ---------- */}
        <section aria-label={c.figures.label} className="wrap relative pb-14 md:pb-20 lg:pb-16">
          <div className="relative">
            <ThreadPoint className={IN_MARGIN} />
            <DrawRule className="bg-ink/15" />
          </div>
          <Reveal variant="label">
            <p className="eyebrow mt-4 text-gold-deep md:mt-5">{c.figures.label}</p>
          </Reveal>
          <dl className="mt-5 grid md:mt-8 md:grid-cols-3 md:gap-x-10 lg:gap-x-12">
            {c.figures.items.map((f, i) => (
              <Reveal
                key={f.label}
                delay={0.06 * i}
                y={16}
                className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-baseline gap-x-5 border-b border-ink/10 py-3.5 min-[400px]:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] md:block md:border-b-0 md:border-l md:py-0 md:pl-6 md:first:border-l-0 md:first:pl-0 lg:pl-8"
              >
                <dd className="display whitespace-nowrap text-[clamp(1.75rem,1rem+3.4vw,4.75rem)] leading-none tracking-[-0.03em] text-green">
                  {f.value}
                </dd>
                <dt className="text-[0.875rem] leading-[1.4] text-ink-soft md:mt-3 md:max-w-[14em] md:text-[0.9375rem]">
                  {f.label}
                </dt>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* ---------- II · 2015 · Svršenici i akreditacija ---------- */}
        <section aria-labelledby="h-akreditacija" className="wrap relative pb-16 md:pb-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 lg:gap-x-12">
            <div className="order-2 mt-9 lg:order-1 lg:col-span-6 lg:mt-[clamp(7rem,13vw,12rem)]">
              <Reveal y={24} className="relative z-[1]">
                <figure>
                  <div className="bg-sand p-2.5 md:p-3.5">
                    <Image
                      src={c.accreditation.image.src}
                      alt={c.accreditation.image.alt}
                      width={857}
                      height={600}
                      sizes="(min-width: 1024px) 44vw, 100vw"
                      className="h-auto w-full"
                    />
                  </div>
                  <figcaption className="mt-3 text-[0.75rem] text-ink-soft">
                    {c.accreditation.caption}
                  </figcaption>
                </figure>
              </Reveal>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-6">
              <Marker className="lg:-ml-[6%]">
                <span className={`${markerType} text-[clamp(6.5rem,3rem+17vw,17rem)] text-green/[0.09]`}>
                  {c.accreditation.marker}
                </span>
              </Marker>
              <div id="h-akreditacija" className="mt-3 lg:-mt-6">
                <ChapterHead numeral="II" label={c.accreditation.label} />
              </div>
              <div className="mt-6 md:mt-8">
                <Para>{c.accreditation.text}</Para>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- III · Žensko odjeljenje u Tuzima ---------- */}
        <section aria-labelledby="h-zensko" className="wrap relative pb-16 md:pb-24 lg:pb-32">
          <div className="grid lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-6 lg:pt-20">
              <div id="h-zensko">
                <ChapterHead numeral="III" label={c.women.label} anchor={IN_MARGIN} />
              </div>
              <div className="mt-6 md:mt-8">
                <Para>{c.women.text}</Para>
              </div>
            </div>
            <div className="relative z-[1] mt-9 -mx-[var(--gutter)] md:mx-0 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:-mr-[calc(var(--gutter)+max(0px,(100vw-var(--max))/2))]">
              <ParallaxImage
                image={c.women.image}
                travel={8}
                mask
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="aspect-[4/3] lg:aspect-[5/6]"
              />
            </div>
          </div>
        </section>

        {/* ---------- IV · 28. 9. 2015. · Rožaje ---------- */}
        <section aria-labelledby="h-rozaje" className="overflow-x-clip bg-green-deep text-ivory">
          <div className="wrap grid py-16 md:py-24 lg:grid-cols-12 lg:gap-x-12 lg:py-32">
            <div className="lg:col-span-5">
              <Marker travel={72}>
                <span className={`${markerType} text-[clamp(4.75rem,2rem+13vw,13rem)] text-gold-soft/[0.16]`}>
                  {c.rozaje.marker[0]}
                  <br />
                  {c.rozaje.marker[1]}
                </span>
              </Marker>
            </div>
            <div className="mt-5 lg:col-span-7 lg:mt-10">
              <div id="h-rozaje">
                <ChapterHead numeral="IV" label={c.rozaje.label} time={c.rozaje.date} tone="dark" />
              </div>
              <LineReveal
                as="p"
                lines={[c.rozaje.place]}
                className="display mt-5 text-[clamp(2.75rem,1.6rem+4.6vw,5.5rem)] leading-[1] tracking-[-0.025em] text-ivory md:mt-6"
              />
              <Reveal delay={0.1} y={18}>
                <p className="hist-text mt-6 max-w-[34em] text-[1.0625rem] font-light leading-[1.7] text-ivory/85 md:mt-8 md:text-[1.125rem] md:leading-[1.75]">
                  {c.rozaje.text}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- V · Danas ---------- */}
        <section aria-labelledby="h-danas" className="relative pt-16 md:pt-24 lg:pt-32">
          <div className="wrap grid lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-5">
              <Marker>
                <span className={`${markerType} text-[clamp(5rem,2.4rem+11vw,11.5rem)] text-green/[0.09]`}>
                  {c.today.marker}
                </span>
              </Marker>
              <Reveal y={16} className="mt-4 flex items-baseline gap-4 md:mt-6">
                <span className="display whitespace-nowrap text-[clamp(2.5rem,1.6rem+3.6vw,4.75rem)] leading-none tracking-[-0.03em] text-green">
                  {c.today.figure.value}
                </span>
                <span className="text-[0.875rem] text-ink-soft md:text-[0.9375rem]">
                  {c.today.figure.label}
                </span>
              </Reveal>
            </div>
            <div className="mt-10 lg:col-span-7 lg:mt-12">
              <div id="h-danas">
                <ChapterHead numeral="V" label={c.today.marker} />
              </div>
              <div className="mt-6 md:mt-8">
                <Para>{c.today.text}</Para>
              </div>
            </div>
          </div>
          {/* The whole campus today: a full-width pause before the closing. */}
          <div className="relative z-[1] mt-14 md:mt-20 lg:mt-28">
            <ParallaxImage
              image={c.today.image}
              travel={9}
              sizes="100vw"
              className="aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9]"
            />
          </div>
        </section>

        {/* ---------- Closing: the welcome and the verse ---------- */}
        <section
          aria-label={h.closing.bs.welcome}
          className="wrap relative pb-20 pt-16 md:pb-28 md:pt-24 lg:pb-36 lg:pt-28"
        >
          <div className="mx-auto max-w-[46rem] text-center">
            <div className="relative mx-auto w-32 md:w-40">
              <ThreadPoint className="absolute left-0 top-0" />
              <DrawRule className="bg-gold" delay={0.2} />
            </div>
            <Reveal y={16}>
              <p className="hist-text mt-8 text-[1.1875rem] font-light leading-[1.5] text-ink md:mt-10 md:text-[1.5rem]">
                <span className="block [text-wrap:balance]">{h.closing.bs.welcome}</span>
                <span className="mt-1 block [text-wrap:balance]">{h.closing.bs.since}</span>
              </p>
            </Reveal>
            <Reveal delay={0.12} y={20}>
              <blockquote className="mt-10 md:mt-14">
                <p className="display hist-text text-[clamp(1.75rem,1.1rem+2.6vw,3.25rem)] leading-[1.15] tracking-[-0.015em] text-green [text-wrap:balance]">
                  {h.closing.bs.verse}
                </p>
                <footer className="mt-5 text-[0.8125rem] tracking-[0.04em] text-gold-deep md:mt-6">
                  <cite className="not-italic">{h.closing.bs.source}</cite>
                </footer>
              </blockquote>
            </Reveal>
            <Reveal delay={0.2} y={12}>
              <div
                lang="sq"
                className="mx-auto mt-12 max-w-[34rem] border-t border-ink/10 pt-8 md:mt-16 md:pt-10"
              >
                <p className="hist-text text-[0.9375rem] font-light leading-[1.6] text-ink-soft">
                  <span className="block [text-wrap:balance]">{h.closing.sq.welcome}</span>
                  <span className="block [text-wrap:balance]">{h.closing.sq.since}</span>
                </p>
                <p className="hist-text mt-4 text-[1.0625rem] leading-[1.45] text-green/85 md:text-[1.125rem]">
                  {h.closing.sq.verse}
                </p>
                <p className="mt-2 text-[0.75rem] tracking-[0.04em] text-gold-deep">{h.closing.sq.source}</p>
              </div>
            </Reveal>
          </div>
        </section>
      </HistoryThread>
    </article>
  );
}
