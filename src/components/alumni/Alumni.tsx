import type { CSSProperties } from "react";
import { alumniContent } from "@/content/alumni";
import type { Locale } from "@/i18n/config";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Archive } from "./Archive";

/*
 * Alumni: generations that remain.
 *
 * A compact opening — „Alumni“, the source's introduction, „Generacije“ —
 * then the archive (components/alumni/Archive): the index of generations and
 * a chapter for each, its pano at the centre.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

export function Alumni({ locale }: { locale: Locale }) {
  const a = alumniContent[locale];
  return (
    <article
      className="overflow-x-clip bg-paper pb-28 text-ink md:pb-32 lg:pb-40"
      style={{ "--edge": edge } as CSSProperties}
    >
      <header className="wrap pt-32 md:pt-40 lg:grid lg:grid-cols-12 lg:items-end lg:pt-44">
        <LineReveal
          as="h1"
          immediate
          lines={[a.title]}
          className="display text-[clamp(2.75rem,1.6rem+5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-green lg:col-span-6"
        />
        <Reveal y={14} delay={0.15} className="mt-5 md:mt-7 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:pb-2">
          <p className="hist-text max-w-[32em] text-[1.0625rem] font-light leading-[1.7] text-ink md:text-[1.1875rem]">
            {a.intro}
          </p>
        </Reveal>
      </header>
      <section aria-labelledby="alumni-generacije" className="mt-12 md:mt-16 lg:mt-20">
        <div className="wrap">
          <Reveal variant="label">
            <h2 id="alumni-generacije" className="eyebrow eyebrow-display text-gold-deep">
              {a.generationsHeading}
            </h2>
          </Reveal>
        </div>
        <Archive />
      </section>
    </article>
  );
}
