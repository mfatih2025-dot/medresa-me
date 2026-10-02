import Link from "next/link";
import type { Dictionary } from "@/content";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export function Education({ dict }: { dict: Dictionary }) {
  const { education: e } = dict;
  return (
    <section
      aria-labelledby="education-title"
      className="relative z-10 -mt-10 rounded-t-[50%/3.5rem] bg-green-deep pb-[var(--section-y)] pt-[calc(var(--section-y)+2.5rem)] text-ivory md:-mt-16 md:rounded-t-[50%/6rem] md:pt-[calc(var(--section-y)+3rem)]"
    >
      <div aria-hidden className="geo pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-screen" />
      <div className="wrap relative grid gap-y-10 md:gap-y-14 lg:grid-cols-12 lg:gap-x-16">
        {/* Sticky narrative */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal variant="label">
              <p className="eyebrow eyebrow-display mb-6 text-gold">{e.eyebrow}</p>
            </Reveal>
            <LineReveal
              id="education-title"
              lines={e.heading}
              className="display h-section"
              accentIndex={1}
              accentClass="text-gold-soft"
            />
            <Reveal delay={0.1}>
              <p className="lead mt-6 max-w-[34em] text-ivory/80 md:mt-8">{e.lead}</p>
            </Reveal>
            <ul className="mt-8 space-y-3 border-t border-ivory/15 pt-6 text-[0.9375rem] text-ivory/85">
              {e.facts.map((f) => (
                <Reveal as="li" key={f} className="flex gap-3">
                  <span aria-hidden className="mt-[0.7em] h-px w-5 shrink-0 bg-gold" />
                  {f}
                </Reveal>
              ))}
            </ul>
            <Reveal className="mt-8">
              <Link href={e.cta.href} className="btn btn-gold">
                {e.cta.label}
                <ArrowRight />
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Scrolling pillars */}
        <div className="space-y-12 md:space-y-16 lg:col-span-7 lg:space-y-20 lg:pt-16">
          <ParallaxImage
            image={e.image}
            sizes="(min-width: 1024px) 56vw, 92vw"
            mask
            travel={7}
            className="aspect-[4/3] md:aspect-[16/11]"
          />

          {e.pillars.map((p, i) => (
            <article
              key={p.title}
              className="grid gap-6 border-t border-ivory/20 pt-8 md:grid-cols-[auto_1fr] md:gap-10"
            >
              <Reveal>
                <span className="display text-5xl font-light text-gold md:text-6xl" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </Reveal>
              <div>
                <Reveal>
                  <h3 className="h-sub">{p.title}</h3>
                  <p className="mt-3 max-w-[36em] text-ivory/75">{p.text}</p>
                </Reveal>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem] text-ivory/90">
                  {p.items.map((it, k) => (
                    <Reveal
                      as="li"
                      key={it}
                      delay={k * 0.04}
                      y={14}
                      className="before:mr-2.5 before:inline-block before:size-1 before:rounded-full before:bg-gold before:align-middle"
                    >
                      {it}
                    </Reveal>
                  ))}
                </ul>
              </div>
            </article>
          ))}

          <ParallaxImage
            image={e.image2}
            sizes="(min-width: 1024px) 40vw, 70vw"
            travel={9}
            drift={12}
            className="aspect-[5/4] w-[78%] md:ml-auto md:aspect-[4/3] md:w-[62%]"
          />
        </div>
      </div>
    </section>
  );
}
