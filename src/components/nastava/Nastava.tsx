import type { CSSProperties } from "react";
import { nastava as n } from "@/content/nastava";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Faq } from "./Faq";
import { keepWhole } from "./keepWhole";
import { Aperture, Depth, Line, Stream } from "./NastavaMotion";

/*
 * Nastava i predmeti: two streams of knowledge that become one.
 *
 *   Opening      title and the source's introduction; no ornament
 *   Two pillars  each pillar enters on its own gold line — general education
 *                from the left page edge, Islamic subjects from the right
 *                (set lower on desktop) — and runs down beside its subjects
 *   Convergence  below the pillars the two lines turn toward each other and
 *                meet; one line descends into the photograph, whose frame
 *                opens to its full width while a gold line above it traces
 *                exactly how much is open
 *   Teaching     the single line carries on: Nastava i jezik, then turns to
 *                become the rule over the numbered activities, then the rule
 *                over Cilj programa, where the narrative closes
 *   FAQ, Rožaje  outside the narrative: thin ink rules, no gold
 *
 * Desktop positions are twelfths of the content box (no grid gutters, so the
 * lines and columns share coordinates); --edge reaches the page edge.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.75] text-ink md:text-[1.125rem] md:leading-[1.8]";
const h2 =
  "display hist-text text-[clamp(2rem,1.45rem+2.3vw,3.25rem)] leading-[1.02] tracking-[-0.025em] text-green";

/** "Akaid (islamsko vjerovanje)" → the subject, then its gloss on a quieter line. */
function Subject({ text }: { text: string }) {
  const m = text.match(/^(.*?)\s*(\(.*\))$/);
  if (!m) return <span className="block">{text}</span>;
  return (
    <>
      <span className="block">{m[1]}</span>{" "}
      <span className="mt-1 block text-[0.9375rem] font-light leading-[1.5] tracking-normal text-ink-soft md:text-[1rem]">
        {m[2]}
      </span>
    </>
  );
}

function Pillar({ pillar }: { pillar: (typeof n.pillars)[number] }) {
  return (
    <>
      <Depth>
        <h3 id={`nas-${pillar.id}`} className={h2}>
          {pillar.heading}
        </h3>
      </Depth>
      <Reveal y={14} delay={0.05}>
        <p className={`${body} mt-5 max-w-[28em] md:mt-6`}>{keepWhole(pillar.lead)}</p>
      </Reveal>
      <ul className="mt-7 border-b border-ink/12 md:mt-9">
        {pillar.subjects.map((s) => (
          <li
            key={s}
            className="hist-text border-t border-ink/12 py-3.5 text-[1.1875rem] leading-[1.3] tracking-[-0.01em] text-green md:py-4 md:text-[1.375rem]"
          >
            <Subject text={s} />
          </li>
        ))}
      </ul>
      {pillar.closing && (
        <Reveal y={14}>
          <p className={`${body} mt-7 max-w-[28em] md:mt-9`}>{keepWhole(pillar.closing)}</p>
        </Reveal>
      )}
    </>
  );
}

export function Nastava() {
  const [general, islamic] = n.pillars;
  return (
    <article
      className="overflow-x-clip bg-paper pb-16 text-ink md:pb-24"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Opening ---------- */}
      <header className="wrap pt-32 md:pt-44 lg:pt-48">
        <LineReveal
          as="h1"
          immediate
          lines={[n.title, n.heading]}
          lineClasses={[
            "",
            "mt-3 text-[clamp(1.25rem,0.95rem+1.5vw,2.25rem)] font-normal leading-[1.2] tracking-[-0.01em] text-green/70 md:mt-4",
          ]}
          className="display hist-text text-[clamp(2.75rem,1.3rem+6.4vw,7.25rem)] leading-[0.98] tracking-[-0.03em] text-green"
        />
      </header>

      <section aria-label={n.heading} className="wrap mt-10 md:mt-14 lg:mt-20 lg:grid lg:grid-cols-12">
        <Reveal y={16} className="lg:col-span-7 lg:pr-12">
          <p className="hist-text max-w-[30em] text-[1.1875rem] font-light leading-[1.6] text-ink md:text-[1.375rem] md:leading-[1.58]">
            {keepWhole(n.intro[0])}
          </p>
        </Reveal>
        <Reveal y={16} delay={0.06} className="mt-6 md:mt-8 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:self-end">
          <p className={`${body} max-w-[30em]`}>{keepWhole(n.intro[1])}</p>
        </Reveal>
      </section>

      {/* ---------- The two pillars ---------- */}
      <section aria-label={n.pillarsLead} className="wrap mt-16 md:mt-20 lg:mt-28">
        <Reveal y={14}>
          <p className="display hist-text max-w-[20em] text-[clamp(1.375rem,1.1rem+1.1vw,2rem)] font-normal leading-[1.25] tracking-[-0.012em] text-green">
            {n.pillarsLead}
          </p>
        </Reveal>

        <div className="relative mt-6 pb-14 md:mt-8 md:pb-16 lg:grid lg:grid-cols-12 lg:pb-20">
          {/* General education: enters from the left page edge and runs down its side. */}
          <Line origin="left" duration={0.8} className="top-0 left-[calc(-1*var(--edge))] w-[var(--edge)]" />
          <Stream className="top-0 bottom-0 left-0" />

          <div
            aria-labelledby={`nas-${general.id}`}
            role="group"
            className="pl-6 pt-7 md:pl-8 lg:col-span-6 lg:pr-14 lg:pt-8"
          >
            <Pillar pillar={general} />
          </div>

          {/* Islamic subjects: enters from the right page edge, lower — the second pillar. */}
          <div
            aria-labelledby={`nas-${islamic.id}`}
            role="group"
            className="relative mt-16 pl-6 pr-6 pt-7 md:mt-20 md:pl-8 md:pr-8 lg:col-span-6 lg:col-start-7 lg:mt-48 lg:pr-0 lg:pt-8"
          >
            <Line origin="right" duration={0.9} className="top-0 -right-[var(--edge)] left-full lg:left-0" />
            <Stream className="top-0 -bottom-14 left-full md:-bottom-16 lg:-bottom-20 lg:left-0" />
            <Pillar pillar={islamic} />
          </div>

          {/* Convergence: the two lines turn toward each other and meet at the centre. */}
          <Line origin="left" duration={0.8} className="bottom-0 left-0 w-1/2" />
          <Line origin="right" duration={0.8} className="bottom-0 right-0 w-1/2 lg:hidden" />
        </div>
      </section>

      {/* ---------- The photograph: the streams become one and open into it ---------- */}
      <div className="wrap">
        <div className="relative pt-16 md:pt-20">
          <Line origin="top" duration={0.6} delay={0.5} className="top-0 left-1/2 h-11 md:h-[3.25rem]" />
          <div className="mx-[calc(-1*var(--edge))] md:mx-0 lg:mx-[8.3333%]">
            <Aperture
              src={n.image.src}
              alt={n.image.alt}
              sizes="(min-width: 1024px) 92vw, (min-width: 768px) 110vw, 124vw"
              className="aspect-[4/3] md:aspect-[3/2]"
            />
          </div>
        </div>
      </div>

      {/* ---------- Nastava i jezik: one line, one quiet column ---------- */}
      <section aria-labelledby="nas-jezik" className="wrap">
        <div className="relative pb-14 pl-6 pt-14 md:pb-16 md:pl-8 md:pt-16 lg:ml-[16.6667%] lg:max-w-[58.3333%] lg:pb-20 lg:pt-20">
          <Line origin="top" duration={1.1} className="top-0 bottom-0 left-0" />
          <h2 id="nas-jezik" className={h2}>
            {n.language.heading}
          </h2>
          <Reveal y={14} delay={0.05}>
            <p className="hist-text mt-6 max-w-[30em] text-[1.1875rem] font-light leading-[1.6] text-ink md:mt-8 md:text-[1.3125rem] md:leading-[1.6]">
              {keepWhole(n.language.text)}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Praktična nastava: the line turns into the rule over the activities ---------- */}
      <section aria-labelledby="nas-aktivnosti" className="wrap">
        <div className="relative pb-14 pt-8 md:pb-16 md:pt-10 lg:grid lg:grid-cols-12 lg:pb-20">
          <Line origin="left" duration={1} className="top-0 left-0 right-0 lg:left-[16.6667%]" />
          <Line
            origin="top"
            duration={0.7}
            delay={0.6}
            className="top-0 bottom-0 left-full hidden lg:block"
          />

          <h2
            id="nas-aktivnosti"
            className={`${h2} max-w-[12em] lg:col-span-4 lg:col-start-3 lg:max-w-none lg:pr-10`}
          >
            {n.activities.heading}
          </h2>
          <ol className="mt-8 lg:col-span-6 lg:col-start-7 lg:mt-1 lg:pr-8">
            {n.activities.items.map((a, i) => (
              <li
                key={a}
                className="grid grid-cols-[2.5rem_1fr] items-baseline border-b border-ink/12 py-4 first:pt-0 md:grid-cols-[3.25rem_1fr] md:py-5"
              >
                <span
                  aria-hidden
                  className="text-[0.8125rem] font-medium tabular-nums tracking-[0.08em] text-gold-deep"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="hist-text text-[1.1875rem] leading-[1.35] tracking-[-0.01em] text-green md:text-[1.375rem]">
                  {keepWhole(a)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Cilj programa: the line closes over the outcome ---------- */}
      <section aria-labelledby="nas-cilj" className="wrap">
        <div className="relative pt-8 md:pt-10 lg:pt-12">
          <Line origin="right" duration={1.3} className="top-0 left-0 right-0" />
          <h2 id="nas-cilj" className="eyebrow eyebrow-display text-gold-deep">
            {n.goals.heading}
          </h2>
          <ul className="mt-8 md:mt-10">
            {n.goals.items.map((g, i) => (
              <li
                key={g}
                className={`mt-6 first:mt-0 md:mt-8 ${["", "lg:ml-[16.6667%]", "lg:ml-[33.3333%]"][i]}`}
              >
                <Reveal y={18} delay={i * 0.08}>
                  <Depth>
                    <p
                      className="display hist-text max-w-[16em] text-[clamp(1.875rem,0.95rem+3.8vw,4.25rem)] font-normal leading-[1.06] tracking-[-0.025em] text-green"
                      style={{ textWrap: "balance" }}
                    >
                      {g}
                    </p>
                  </Depth>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section aria-labelledby="nas-faq" className="wrap mt-20 md:mt-28 lg:mt-36 lg:grid lg:grid-cols-12">
        <h2 id="nas-faq" className={`${h2} max-w-[10em] lg:col-span-4 lg:pr-10`}>
          {n.faq.heading}
        </h2>
        <div className="mt-8 lg:col-span-7 lg:col-start-6 lg:mt-1">
          <Faq items={n.faq.items} />
        </div>
      </section>

      {/* ---------- Područno odjeljenje u Rožajama ---------- */}
      <section aria-labelledby="nas-rozaje" className="wrap mt-16 md:mt-20 lg:mt-24">
        <div className="border-t border-ink/15 pt-8 md:pt-10 lg:grid lg:grid-cols-12">
          <div className="lg:col-span-4 lg:pr-10">
            <h2
              id="nas-rozaje"
              className="display hist-text text-[1.5rem] leading-[1.15] tracking-[-0.015em] text-green md:text-[1.75rem]"
            >
              {n.rozaje.heading}
            </h2>
            <p className="mt-2 text-[1rem] text-ink-soft">{n.rozaje.address}</p>
          </div>
          <div className="mt-7 lg:col-span-7 lg:col-start-6 lg:mt-1">
            <h3 className="eyebrow text-gold-deep">{n.rozaje.contactLabel}</h3>
            <ul className="mt-4 space-y-1.5 text-[1rem] leading-[1.6] text-ink md:text-[1.0625rem]">
              {n.rozaje.contacts.map((c) => (
                <li key={c.role}>
                  {c.role}: {c.name}{" "}
                  <a
                    href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                    className="whitespace-nowrap underline decoration-gold/60 underline-offset-4 transition-colors hover:text-green"
                  >
                    {c.phone}
                  </a>
                </li>
              ))}
              <li>
                email:{" "}
                <a
                  href={`mailto:${n.rozaje.email}`}
                  className="underline decoration-gold/60 underline-offset-4 transition-colors hover:text-green"
                >
                  {n.rozaje.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
}
