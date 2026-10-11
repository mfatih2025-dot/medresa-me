import type { CSSProperties, ReactNode } from "react";
import { donacijeContent, type Field, type Party } from "@/content/donacije";
import type { Locale } from "@/i18n/config";
import { Reveal } from "@/components/ui/Reveal";
import { CopyValue } from "./CopyValue";
import { Chain, Emerge, Line, Settle, Slit } from "./DonMotion";

/*
 * Donacije: good that continues.
 *
 * The page first says why, then how. One gold line carries the idea that the
 * good continues: it starts as a short rule under the title, becomes the rule
 * over the ways of helping, grows (by reading) into the chain the three reasons
 * hang from, turns to the centre and falls through the hadith — the pause —
 * then opens edge to edge over the payment details. After the closing line it
 * runs on off the page.
 *
 *   Opening    the source heading in two parts, the introduction
 *   Photograph the minaret: at first only a narrow column around it, opening
 *              to the whole sky as it rises — the page's one strong transition
 *   Support    the five ways of helping, each rising out of its rule in turn
 *   Why        the emotional centre: three reasons stepping out along a chain
 *   Hadith     a centred pause between why and how
 *   Payment    calm and functional: abroad / Montenegro, each party clearly
 *              labelled, every identifier copyable, nothing hidden
 *   Closing    the source's last line, and the line running on
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

const body =
  "hist-text text-[1.0625rem] font-light leading-[1.75] text-ink md:text-[1.125rem] md:leading-[1.8]";

/** Hyphenated compounds never split at the hyphen. */
function whole(text: string): ReactNode[] {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** One label / value pair; identifiers get the copy control. */
function Row({ field, large = false }: { field: Field; large?: boolean }) {
  const value = large
    ? "text-[1.25rem] tracking-[0.015em] text-green md:text-[1.5rem]"
    : "text-[1.0625rem] text-ink md:text-[1.125rem]";
  return (
    <div className="border-t border-ink/10 py-3 first:border-t-0 first:pt-0 md:py-3.5">
      <dt className="text-[0.8125rem] tracking-[0.02em] text-ink-soft md:text-[0.875rem]">{field.label}</dt>
      <dd className="mt-1">
        {field.copy ? (
          <CopyValue value={field.value} label={field.label} valueClassName={`${value} leading-[1.35]`} />
        ) : (
          <span className={`hist-text block leading-[1.45] ${value}`}>{field.value}</span>
        )}
      </dd>
    </div>
  );
}

function PartyBlock({
  party,
  emphasis = false,
  delay = 0,
  className = "",
}: {
  party: Party;
  emphasis?: boolean;
  delay?: number;
  className?: string;
}) {
  return (
    <Settle delay={delay} className={`border-t border-ink/20 pt-5 md:pt-6 ${className}`}>
      <h4 className="text-[1.125rem] leading-[1.3] text-green md:text-[1.1875rem]">
        {party.heading} <span className="text-[0.9375rem] font-light text-ink-soft">{party.english}</span>
      </h4>
      <dl className="mt-4 md:mt-5">
        {party.fields.map((f) => (
          <Row key={f.label + f.value} field={f} large={emphasis && f.label === "IBAN"} />
        ))}
      </dl>
    </Settle>
  );
}

export function Donacije({ locale }: { locale: Locale }) {
  const d = donacijeContent[locale];
  const [intermediary, bank, beneficiary] = d.payment.parties;
  return (
    <article
      className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Opening: why, first ---------- */}
      <header className="wrap pt-32 md:pt-48">
        <h1 className="display text-green">
          <Emerge
            immediate
            className="text-[clamp(3.25rem,1.6rem+7.4vw,8.5rem)] leading-[0.95] tracking-[-0.035em]"
          >
            {d.heading.lead}
          </Emerge>
          <span className="sr-only"> – </span>
          <Emerge
            immediate
            delay={0.14}
            className="hist-text mt-3 max-w-[16em] text-[clamp(1.5rem,1.05rem+2.2vw,3.25rem)] font-normal leading-[1.12] tracking-[-0.018em] text-green/75 md:mt-5"
          >
            {d.heading.rest}
          </Emerge>
        </h1>
        {/* The line begins here: a short rule arriving from the page edge. */}
        <div className="relative mt-8 h-px md:mt-10">
          <Line
            origin="left"
            immediate
            delay={0.55}
            duration={0.9}
            className="top-0 left-[calc(-1*var(--edge))] w-[calc(var(--edge)+4rem)] md:w-[calc(var(--edge)+6rem)]"
          />
        </div>
      </header>

      <section aria-label={d.heading.rest} className="wrap mt-8 md:mt-10">
        <Reveal y={16} delay={0.3}>
          <p className="hist-text max-w-[31em] text-[1.1875rem] font-light leading-[1.6] text-ink md:text-[1.375rem] md:leading-[1.58]">
            {d.intro[0]}
          </p>
        </Reveal>

        {/* The second paragraph meets the photograph's edge (desktop). */}
        <div className="mt-6 md:mt-20 md:grid md:grid-cols-12 md:items-end">
          <Reveal y={16} className="md:col-span-5 md:pb-2 md:pr-8 lg:col-span-4 lg:pr-12">
            <p className={`${body} max-w-[30em]`}>{d.intro[1]}</p>
          </Reveal>
          <div className="mx-[calc(-1*var(--edge))] mt-12 md:col-span-7 md:col-start-6 md:ml-0 md:mt-0 lg:col-span-8 lg:col-start-5">
            <Slit
              src={d.image.src}
              alt={d.image.alt}
              position="82% 50%"
              slit={{ compact: [3, 10, 3, 38], wide: [5, 14, 5, 54] }}
              sizes="(min-width: 1024px) 70vw, 180vw"
              className="aspect-[4/5] md:aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* ---------- The ways of helping ---------- */}
      <section aria-labelledby="don-podrska" className="wrap mt-16 md:mt-28 md:grid md:grid-cols-12">
        <h2
          id="don-podrska"
          className="display hist-text max-w-[11em] text-[clamp(1.875rem,1.4rem+2vw,3rem)] leading-[1.05] tracking-[-0.022em] text-green md:col-span-4 md:pr-10"
        >
          {d.support.heading}
        </h2>
        <ul className="relative mt-7 md:col-span-7 md:col-start-6 md:mt-2">
          <Line origin="left" duration={1.1} className="top-0 left-0 right-0" />
          {d.support.items.map((s, i) => (
            <li key={s} className="border-b border-ink/12 py-4 md:py-5">
              <Emerge
                delay={0.1 + i * 0.09}
                className="hist-text text-[1.1875rem] leading-[1.35] tracking-[-0.01em] text-green md:text-[1.5rem]"
              >
                {whole(s)}
              </Emerge>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Zašto donirati Medresi? — three reasons along a chain ---------- */}
      <section aria-labelledby="don-zasto" className="wrap mt-24 md:mt-40">
        <h2
          id="don-zasto"
          className="display hist-text text-[clamp(2.25rem,1.5rem+3.4vw,4.75rem)] leading-[1] tracking-[-0.03em] text-green"
        >
          <Emerge>{d.why.heading}</Emerge>
        </h2>
        <div className="relative mt-10 pb-16 md:mt-16 md:pb-24">
          {/* The chain: drawn by reading, the reasons hang from it. */}
          <Chain className="top-0 bottom-0 left-0 md:left-[8.3333%]" />
          <ol>
            {d.why.reasons.map((r, i) => (
              <li
                key={r}
                className={`relative mt-10 first:mt-0 md:mt-12 lg:mt-16 ${
                  [
                    "pl-6 md:pl-[16.6667%]",
                    "pl-9 md:pl-[25%]",
                    "pl-12 md:pl-[33.3333%]",
                  ][i]
                }`}
              >
                {/* Each reason hangs from the chain on its own short run. */}
                <Line
                  origin="left"
                  duration={0.6}
                  delay={0.15}
                  className={`top-[0.82em] left-0 text-[clamp(1.375rem,1.05rem+1.6vw,2.5rem)] lg:left-[8.3333%] ${
                    [
                      "w-3.5 md:w-[calc(8.3333%-1.25rem)]",
                      "w-6 md:w-[calc(16.6667%-1.25rem)]",
                      "w-8 md:w-[calc(25%-1.25rem)]",
                    ][i]
                  }`}
                />
                <Settle delay={0.05} duration={0.9} y={18}>
                  <p className="hist-text max-w-[22em] text-[clamp(1.375rem,1.05rem+1.6vw,2.5rem)] font-normal leading-[1.28] tracking-[-0.015em] text-green">
                    {r}
                  </p>
                </Settle>
              </li>
            ))}
          </ol>
          {/* …and the chain turns toward the centre, into the pause. */}
          <Line
            origin="left"
            duration={0.8}
            className="bottom-0 left-0 w-1/2 md:left-[8.3333%] md:w-[41.6667%]"
          />
        </div>
      </section>

      {/* ---------- The hadith: a pause between why and how ---------- */}
      <section aria-label={d.hadith.source} className="wrap">
        <div className="relative pb-16 pt-16 md:pb-24 md:pt-24">
          <Line origin="top" duration={0.7} className="top-0 left-1/2 h-10 md:h-14" />
          <figure className="mx-auto max-w-[27em] text-center">
            <Settle duration={1.4} y={8}>
              <blockquote>
                <p className="hist-text text-[clamp(1.375rem,1.05rem+1.4vw,2.25rem)] font-light leading-[1.45] tracking-[-0.01em] text-green">
                  {d.hadith.text}
                </p>
              </blockquote>
            </Settle>
            <Settle delay={0.35} duration={1}>
              <figcaption className="mt-6 text-[0.9375rem] tracking-[0.04em] text-gold-deep md:mt-8">
                {d.hadith.source}
              </figcaption>
            </Settle>
          </figure>
          <Line origin="top" duration={0.7} delay={0.2} className="bottom-0 left-1/2 h-10 md:h-14" />
        </div>
      </section>

      {/* ---------- Payment details: calm, complete, copyable ---------- */}
      <section aria-labelledby="don-uplata" className="wrap">
        <div className="relative pt-12 md:pt-16">
          {/* The line opens edge to edge over the details. */}
          <Line
            origin="center"
            duration={1.4}
            className="top-0 left-[calc(-1*var(--edge))] right-[calc(-1*var(--edge))]"
          />
          <div className="md:grid md:grid-cols-12 md:items-end">
            <h2
              id="don-uplata"
              className="display hist-text max-w-[14em] text-[clamp(1.75rem,1.3rem+2vw,3rem)] leading-[1.08] tracking-[-0.022em] text-green md:col-span-7"
            >
              {d.payment.heading}
            </h2>
            <p className={`${body} mt-5 max-w-[26em] md:col-span-4 md:col-start-9 md:mt-0`}>
              {d.payment.lead}
            </p>
          </div>

          {/* Abroad */}
          <div className="mt-12 md:mt-20 md:grid md:grid-cols-12">
            <h3 className="display text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-green md:text-[1.625rem] md:col-span-3 md:pr-8">
              {d.payment.abroad}
            </h3>
            <div className="mt-6 grid gap-y-8 md:grid-cols-2 md:gap-y-10 md:col-span-9 md:col-start-4 md:mt-1 md:gap-x-14">
              <PartyBlock party={intermediary} />
              <PartyBlock party={bank} delay={0.06} />
              <PartyBlock party={beneficiary} emphasis delay={0.12} className="md:col-span-2" />
            </div>
          </div>

          {/* Montenegro */}
          <div className="mt-14 md:mt-20 md:grid md:grid-cols-12">
            <h3 className="display text-[1.375rem] leading-[1.2] tracking-[-0.01em] text-green md:text-[1.625rem] md:col-span-3 md:pr-8">
              {d.payment.domestic.heading}
            </h3>
            <dl className="mt-6 grid gap-y-8 md:grid-cols-2 md:col-span-9 md:col-start-4 md:mt-1 md:gap-x-14">
              {d.payment.domestic.accounts.map((a, i) => (
                <Settle key={a.value} delay={i * 0.06} className="border-t border-ink/20 pt-5 md:pt-6">
                  <dt className="text-[1rem] text-ink-soft md:text-[1.0625rem]">{a.label}</dt>
                  <dd className="mt-2">
                    <CopyValue
                      value={a.value}
                      label={a.label}
                      valueClassName="display text-[1.75rem] leading-[1.15] tracking-[-0.005em] text-green md:text-[2.125rem]"
                    />
                  </dd>
                </Settle>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- Closing: and the line runs on ---------- */}
      <section aria-labelledby="don-kraj" className="wrap mt-24 md:mt-36">
        <div className="relative pb-10 md:pb-12">
          <h2
            id="don-kraj"
            className="display hist-text max-w-[17em] text-[clamp(1.75rem,1.2rem+2.5vw,3.5rem)] leading-[1.12] tracking-[-0.022em] text-green"
          >
            <Emerge>{d.closing}</Emerge>
          </h2>
          <Line
            origin="left"
            duration={1.8}
            delay={0.5}
            fade="right"
            className="bottom-0 left-0 right-[calc(-1*var(--edge))]"
          />
        </div>
      </section>
    </article>
  );
}
