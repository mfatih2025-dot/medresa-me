import { misija as m } from "@/content/misija";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Horizon, Line, Signature } from "./MisijaMotion";

/*
 * Misija i vizija, read as one statement of purpose.
 *
 *   Title      the source's heading; a gold rule arrives from the page edge…
 *   Misija     …and turns down at the content edge: a vertical axis beside the
 *              mission — grounded, structured, left-aligned.
 *   Horizon    the axis descends into the page's own sky photograph and, at its
 *              foot, divides left and right along the horizon.
 *   Vizija     set open and centred under that horizon, with more air.
 *   Closing    the line converges to a short rule; the Reis's signature, name
 *              and title close the statement, as at the foot of a charter.
 */

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.75] text-ink md:text-[1.125rem] md:leading-[1.8]";

export function Misija() {
  const [missionLead, missionRest] = m.mission.paragraphs;
  const [visionStatement, visionRest] = m.vision.paragraphs;
  return (
    <article className="bg-paper text-ink">
      {/* ---------- Title ---------- */}
      <header className="wrap pt-32 md:pt-44 lg:pt-48">
        <Reveal variant="label">
          <p className="eyebrow eyebrow-display text-gold-deep">{m.eyebrow}</p>
        </Reveal>
        <LineReveal
          as="h1"
          immediate
          lines={m.heading}
          lineClasses={[
            "",
            "mt-2 text-[clamp(1.5rem,1rem+2.4vw,3rem)] font-normal leading-[1.1] tracking-[-0.015em] text-green/70 md:mt-3",
          ]}
          className="display hist-text mt-5 text-[clamp(2.75rem,1.3rem+6.4vw,7.25rem)] leading-[0.98] tracking-[-0.03em] text-green md:mt-6"
        />
      </header>

      {/* ---------- Misija: the axis ---------- */}
      <div className="relative mt-12 md:mt-16 lg:mt-20">
        {/* The rule turns at the content edge and becomes the mission's vertical axis,
            continuing down behind the horizon photograph to its foot. */}
        <div aria-hidden className="wrap pointer-events-none absolute inset-0">
          <div className="relative h-full">
            {/* Arrives from the page edge, turns at the content edge… */}
            <Line
              axis="x"
              origin="left"
              duration={0.9}
              delay={0.5}
              className="absolute right-full top-0 h-px w-[calc(var(--gutter)+max(0px,(100vw-var(--max))/2))]"
            />
            {/* …and descends beside the mission, into the horizon. */}
            <Line
              axis="y"
              origin="top"
              duration={2.2}
              delay={1.25}
              className="absolute bottom-0 left-0 top-0 w-px"
            />
          </div>
        </div>

        <section aria-labelledby="mis-misija" className="wrap pb-14 pt-9 md:pb-20 md:pt-12 lg:pb-24 lg:pt-16">
          <div className="pl-5 md:pl-10 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:pl-0">
            <div className="lg:col-span-4 lg:pl-12">
              <Reveal variant="label">
                <h2
                  id="mis-misija"
                  className="display text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] leading-[1] tracking-[-0.025em] text-green lg:sticky lg:top-[calc(var(--bar-h-compact)+3rem)]"
                >
                  {m.mission.label}
                </h2>
              </Reveal>
            </div>
            <div className="mt-6 md:mt-8 lg:col-span-7 lg:mt-1">
              <Reveal y={18}>
                <p className="hist-text max-w-[32em] text-[1.1875rem] font-light leading-[1.6] text-ink md:text-[1.375rem] md:leading-[1.58]">
                  {missionLead}
                </p>
              </Reveal>
              <Reveal y={18} delay={0.06}>
                <p className={`${body} mt-6 max-w-[34em] md:mt-8`}>{missionRest}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- The horizon ---------- */}
        <div className="relative isolate z-[1] bg-paper">
          <Horizon {...m.horizon} />
        </div>
      </div>

      {/* ---------- Vizija: open, centred ---------- */}
      <section aria-labelledby="mis-vizija" className="wrap pb-14 pt-14 md:pb-20 md:pt-20 lg:pb-24 lg:pt-28">
        <div className="mx-auto max-w-[56rem] text-center">
          <Reveal variant="fade">
            <h2
              id="mis-vizija"
              className="display text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] leading-[1] tracking-[-0.025em] text-green"
            >
              {m.vision.label}
            </h2>
          </Reveal>
          <Reveal y={20} delay={0.08}>
            <p className="display mx-auto mt-7 max-w-[24em] [hyphens:none] text-[clamp(1.375rem,1rem+1.6vw,2.375rem)] font-normal leading-[1.3] tracking-[-0.012em] text-green [text-wrap:balance] md:mt-10">
              {visionStatement}
            </p>
          </Reveal>
        </div>
        <Reveal y={16} delay={0.12}>
          <p className={`${body} mx-auto mt-8 max-w-[34em] md:mt-12`}>{visionRest}</p>
        </Reveal>
      </section>

      {/* ---------- Closing: the line converges; the signature ---------- */}
      <section
        aria-label={`${m.signatory.name}, ${m.signatory.role}`}
        className="wrap pb-20 md:pb-28 lg:pb-32"
      >
        <div className="mx-auto flex max-w-[34em] flex-col items-center text-center">
          <Line axis="x" origin="center" duration={0.9} className="h-px w-16 md:w-24" />
          <Signature {...m.signatory.signature} className="mt-7 w-[13rem] md:mt-9 md:w-[16rem]" />
          <p className="display mt-3 text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-green md:text-[1.625rem]">
            {m.signatory.name}
          </p>
          <p className="mt-1.5 text-[0.875rem] text-ink-soft md:text-[0.9375rem]">{m.signatory.role}</p>
        </div>
      </section>
    </article>
  );
}
