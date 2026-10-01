import Link from "next/link";
import type { Dictionary } from "@/content";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

/** Desktop placement of the five moments; on phones they form a native swipe rail. */
const layout = [
  "lg:col-span-5 lg:aspect-[4/5]",
  "lg:col-span-4 lg:col-start-7 lg:mt-24 lg:aspect-[4/5]",
  "lg:col-span-3 lg:col-start-11 lg:mt-56 lg:aspect-[3/4]",
  "lg:col-span-4 lg:col-start-2 lg:-mt-12 lg:aspect-[5/4]",
  "lg:col-span-6 lg:col-start-7 lg:mt-12 lg:aspect-[16/11]",
];

export function Life({ dict }: { dict: Dictionary }) {
  const { life } = dict;
  return (
    <section aria-labelledby="life-title" className="relative bg-ivory pb-24 pt-24 md:pb-40 md:pt-32">
      <div className="wrap">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow mb-6 text-gold-deep">{life.eyebrow}</p>
            </Reveal>
            <LineReveal id="life-title" lines={life.heading} className="display h-section text-green" />
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="lead max-w-[34em] text-ink-soft">{life.lead}</p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="wrap mt-14 md:mt-20">
        <ul
          className="rail -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scroll-padding-inline:var(--gutter)] md:gap-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10 lg:overflow-visible lg:px-0 lg:pb-0"
          aria-label={life.eyebrow}
        >
          {life.items.map((item, i) => (
            <li
              key={item.title}
              className={`w-[76vw] max-w-[24rem] shrink-0 snap-start md:w-[46vw] lg:w-auto lg:max-w-none lg:shrink ${layout[i].replace(/ lg:aspect-\S+/, "")}`}
            >
              <ParallaxImage
                image={item.image}
                sizes="(min-width: 1024px) 40vw, 76vw"
                travel={i % 2 ? 9 : 6}
                drift={16}
                mask
                className={`aspect-[4/5] ${layout[i].match(/lg:aspect-\S+/)?.[0] ?? ""}`}
              />
              <div className="mt-5 flex gap-4">
                <span className="display text-xl font-normal text-gold-deep" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="h-sub text-green">{item.title}</h3>
                  <p className="mt-2 max-w-[30em] text-[0.9375rem] text-ink-soft">{item.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Reveal className="mt-14 flex justify-start lg:mt-20">
          <Link href={life.cta.href} className="btn btn-green">
            {life.cta.label}
            <ArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
