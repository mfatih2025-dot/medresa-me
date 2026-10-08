import { Fragment } from "react";
import { kucniRedContent } from "@/content/kucni-red";
import type { Locale } from "@/i18n/config";
import { GoldRule } from "@/components/news/NewsMotion";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { RulesList, Rule, ShareButton } from "./KucniRedMotion";

/*
 * Kućni red: the house rules as one official document, not a list of cards.
 *
 *   Kućni red                        the title, set in a mask once
 *   Vremenska zona…                  the document's own subtitle
 *   01 ─┬─ rule                      fifteen rules on one gold guide; the
 *   02 ─┼─ rule                      numbers are quiet markers to its left,
 *   …   │                            the times inside each rule set in the
 *   15 ─┴─ rule                      text's own type, only firmer
 *                         Podijeli ↗ at the foot, to the right
 */

/** Rules carried by a highlighter pass as the reader reaches them. */
const MARKED = [4, 14];

/** Times as written in the document: 06:30h, 07:00h … 23h, 20h, (12h). */
const TIME = /(\d{1,2}(?::\d{2})?h)\b/g;

function withTimes(text: string) {
  return text.split(TIME).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap font-normal tabular-nums text-green">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function KucniRed({ locale }: { locale: Locale }) {
  const c = kucniRedContent[locale];
  return (
    <article className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28">
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <div className="kr-frame">
          <LineReveal
            as="h1"
            immediate
            lines={[c.title]}
            className="display text-[clamp(2.75rem,1.6rem+5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-green"
          />
          <Reveal y={10} delay={0.25}>
            <p className="mt-5 text-[1.0625rem] font-light leading-[1.5] text-ink-soft md:mt-7 md:text-[1.25rem]">
              {c.subtitle}
            </p>
          </Reveal>
          <GoldRule className="mt-7 w-20 md:mt-9 md:w-28" />
        </div>
      </header>

      <div className="wrap mt-10 md:mt-14 lg:mt-16">
        <div className="kr-frame">
          <RulesList label={c.title}>
            {c.rules.map((rule, i) => (
              <Rule key={i} n={i + 1} mark={MARKED.includes(i + 1)}>
                {withTimes(rule)}
              </Rule>
            ))}
          </RulesList>

          <div className="mt-10 flex justify-end border-t border-gold/40 pt-4 md:mt-14 md:pt-5">
            <ShareButton
              title={c.title}
              label={c.share.label}
              copied={c.share.copied}
              failed={c.share.failed}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
