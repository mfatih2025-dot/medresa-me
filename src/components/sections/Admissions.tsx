import Link from "next/link";
import type { Dictionary } from "@/content";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export function Admissions({ dict }: { dict: Dictionary }) {
  const a = dict.admissions;
  return (
    <section aria-labelledby="admissions-title" className="relative bg-ivory py-16 md:py-24 lg:py-28">
      <div className="wrap">
        <div className="relative border-y border-gold/50 py-16 md:py-24">
          <div
            aria-hidden
            className="geo pointer-events-none absolute right-0 top-1/2 h-72 w-72 -translate-y-1/2 opacity-30 [mask-image:radial-gradient(closest-side,black,transparent)] md:h-[30rem] md:w-[30rem]"
          />
          <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-x-16">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="eyebrow eyebrow-display mb-6 text-gold-deep">{a.eyebrow}</p>
              </Reveal>
              <LineReveal id="admissions-title" lines={a.heading} className="display h-section text-green" />
            </div>
            <div className="lg:col-span-5 lg:pt-3">
              <Reveal>
                <p className="text-ink-soft lead">{a.body}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 flex items-center gap-3 text-[0.9375rem] font-medium text-green">
                  <span aria-hidden className="size-2 rounded-full bg-gold" />
                  {a.status}
                </p>
              </Reveal>
              <Reveal delay={0.15} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link href={a.primary.href} className="btn btn-green">
                  {a.primary.label}
                  <ArrowRight />
                </Link>
                <Link
                  href={a.secondary.href}
                  className="link-u inline-flex min-h-11 items-center text-[0.9375rem] text-green"
                >
                  {a.secondary.label}
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
