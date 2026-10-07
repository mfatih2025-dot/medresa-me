import type { CSSProperties } from "react";
import { galerija as g } from "@/content/galerija";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { Gallery } from "./Gallery";

/*
 * Galerija: the life of the Medresa, through its spaces.
 *
 * A compact opening — the page title, then the source heading as a gold
 * eyebrow, then the source's introduction — and then the photographs take over (components/galerija/Gallery).
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

export function Galerija() {
  return (
    <article
      className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28"
      style={{ "--edge": edge } as CSSProperties}
    >
      <header className="wrap pt-32 md:pt-40 lg:grid lg:grid-cols-12 lg:items-end lg:pt-44">
        <div className="lg:col-span-6">
          <LineReveal
            as="h1"
            immediate
            lines={[g.title]}
            className="display text-[clamp(2.75rem,1.6rem+5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-green"
          />
          <Reveal variant="label" delay={0.2}>
            <p className="eyebrow eyebrow-display mt-4 text-gold-deep md:mt-5">
              {/* The name never breaks apart. */}
              {g.heading.replace("„MEHMED FATIH“", "„MEHMED\u00a0FATIH“")}
            </p>
          </Reveal>
        </div>
        <Reveal y={14} delay={0.15} className="mt-5 md:mt-7 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:pb-2">
          <p className="hist-text max-w-[34em] text-[1.0625rem] font-light leading-[1.7] text-ink md:text-[1.125rem]">
            {g.intro}
          </p>
        </Reveal>
      </header>
      <div className="mt-10 md:mt-14 lg:mt-16">
        <Gallery />
      </div>
    </article>
  );
}
