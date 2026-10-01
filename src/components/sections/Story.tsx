import Link from "next/link";
import type { Dictionary } from "@/content";
import { ParallaxImage } from "@/components/ui/ParallaxImage";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export function Story({ dict }: { dict: Dictionary }) {
  const { story } = dict;
  return (
    <section
      aria-labelledby="story-title"
      className="relative overflow-hidden bg-ivory py-16 md:py-24 lg:py-28"
    >
      <div
        aria-hidden
        className="geo pointer-events-none absolute -right-24 -top-10 h-[28rem] w-[28rem] opacity-40 [mask-image:radial-gradient(closest-side,black,transparent)] md:h-[44rem] md:w-[44rem]"
      />

      <div className="wrap relative grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="max-lg:order-2 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <div className="relative pb-24 md:pb-32 lg:pb-0">
            <ParallaxImage
              image={story.main}
              sizes="(min-width: 1024px) 56vw, 92vw"
              mask
              travel={7}
              className="aspect-[4/5] w-[88%] md:aspect-[5/6] md:w-[82%] lg:aspect-[4/5] lg:w-[86%]"
            />
            <div className="absolute bottom-0 right-0 w-[46%] border-[6px] border-ivory md:w-[40%] lg:-bottom-16 lg:right-0 lg:w-[44%]">
              <ParallaxImage
                image={story.detail}
                sizes="(min-width: 1024px) 24vw, 44vw"
                travel={10}
                scale={[1.2, 1.02]}
                drift={14}
                className="aspect-[3/4]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:pb-24">
          <Reveal>
            <p className="eyebrow eyebrow-display mb-6 text-gold-deep">{story.eyebrow}</p>
          </Reveal>
          <LineReveal id="story-title" lines={story.heading} className="display h-section text-green" />
          <div className="mt-8 space-y-5 text-ink-soft lead max-w-[34em]">
            {story.body.map((p, i) => (
              <Reveal as="p" key={p} delay={0.1 + i * 0.1}>
                {p}
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15} className="mt-10 border-l border-gold pl-6">
            <p className="h-sub italic text-green">{story.pull}</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 grid max-w-md grid-cols-2 gap-6">
            {story.facts.map((f) => (
              <div key={f.label}>
                <p className="display text-4xl font-normal text-green">{f.value}</p>
                <p className="mt-1 text-sm text-ink-soft">{f.label}</p>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={story.cta.href} className="btn btn-green">
              {story.cta.label}
              <ArrowRight />
            </Link>
            {story.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="link-u inline-flex min-h-11 items-center text-[0.9375rem] text-green"
              >
                {l.label}
              </Link>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
