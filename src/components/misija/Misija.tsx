import { misijaContent } from "@/content/misija";
import type { Locale } from "@/i18n/config";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Axis, Emerge, HorizonLine, Line, Signature } from "./MisijaMotion";

/*
 * Misija i vizija, read as one statement of purpose.
 *
 *   Title      the source's heading; a gold rule arrives from the page edge…
 *   Misija     …and turns down at the content edge: a vertical axis beside the
 *              mission — grounded, structured, left-aligned.
 *   Horizon    the axis descends to a horizon line and divides along it, left
 *              and right.
 *   Vizija     hung from the horizon by a short drop of the line, set further
 *              right on desktop and wider than the mission — the expansion.
 *   Closing    the line converges to a short rule; the Reis's signature, name
 *              and title close the statement, as at the foot of a charter.
 */

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.75] text-ink md:text-[1.125rem] md:leading-[1.8]";

export function Misija({ locale }: { locale: Locale }) {
  const m = misijaContent[locale];
  const [missionLead, missionRest] = m.mission.paragraphs;
  const [visionStatement, visionRest] = m.vision.paragraphs;
  return (
    <article className="bg-paper text-ink">
      {/* ---------- Title ---------- */}
      <header className="wrap pt-32 md:pt-48">
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
      <div className="relative mt-12 md:mt-20">
        {/* The rule arrives from the page edge and turns at the content edge into the
            mission's axis, which grows with reading and runs down to the horizon. */}
        <div aria-hidden className="wrap pointer-events-none absolute inset-0">
          <div className="relative h-full">
            <Line
              axis="x"
              origin="left"
              duration={0.8}
              delay={0.45}
              className="absolute right-full top-0 h-px w-[calc(var(--gutter)+max(0px,(100vw-var(--max))/2))]"
            />
            <Axis className="absolute bottom-0 left-0 top-0 w-px" />
          </div>
        </div>

        {/* The heading nests in the corner: its capitals hang just below the rule. */}
        <section
          aria-labelledby="mis-misija"
          className="wrap pb-12 pt-2.5 md:pb-20 md:pt-3.5"
        >
          <div className="pl-5 md:grid md:grid-cols-12 md:gap-x-12 md:pl-0">
            <div className="md:col-span-3 md:pl-8">
              <h2
                id="mis-misija"
                className="display text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] leading-[1] tracking-[-0.025em] text-green md:sticky md:top-[calc(var(--bar-h-compact)+3rem)]"
              >
                <Emerge delay={0.75}>{m.mission.label}</Emerge>
              </h2>
            </div>
            <div className="mt-5 md:col-span-7 md:col-start-4 md:mt-[0.7rem]">
              <Reveal y={16}>
                <p className="hist-text max-w-[32em] text-[1.1875rem] font-light leading-[1.6] text-ink md:text-[1.375rem] md:leading-[1.58]">
                  {missionLead}
                </p>
              </Reveal>
              <Reveal y={16} delay={0.06}>
                <p className={`${body} mt-6 max-w-[34em] md:mt-8`}>{missionRest}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- The horizon: the axis divides along it ---------- */}
        <HorizonLine />
      </div>

      {/* ---------- Vizija: hung from the horizon, expanding past the axis ---------- */}
      <section aria-labelledby="mis-vizija" className="wrap pb-14 md:pb-24">
        <div className="md:grid md:grid-cols-12 md:gap-x-12">
          <div className="relative md:col-span-7 md:col-start-6">
            {/* A short drop from the horizon to the heading: the line continues into the vision. */}
            <Line
              axis="y"
              origin="top"
              duration={0.7}
              delay={0.55}
              className="absolute left-0 top-0 h-[calc(100%-0rem)] w-px"
            />
            <div className="pl-5 pt-2.5 md:pl-8 md:pt-3.5">
              <h2
                id="mis-vizija"
                className="display text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] leading-[1] tracking-[-0.025em] text-green"
              >
                <Emerge delay={0.95}>{m.vision.label}</Emerge>
              </h2>
            </div>
            <span aria-hidden className="block h-6 md:h-8" />
          </div>
          {/* The vision opens out: wider than the mission, beyond its axis. */}
          <div className="md:col-span-7 md:col-start-6">
            <Reveal y={16} delay={0.1}>
              <p className="display max-w-[22em] [hyphens:none] text-[clamp(1.375rem,1rem+1.5vw,2.25rem)] font-normal leading-[1.3] tracking-[-0.012em] text-green [text-wrap:pretty]">
                {visionStatement}
              </p>
            </Reveal>
            <Reveal y={16} delay={0.16}>
              <p className={`${body} mt-6 max-w-[34em] md:mt-8`}>{visionRest}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Closing: the line converges; the signature ---------- */}
      <section
        aria-label={`${m.signatory.name}, ${m.signatory.role}`}
        className="wrap pb-20 md:pb-32"
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
