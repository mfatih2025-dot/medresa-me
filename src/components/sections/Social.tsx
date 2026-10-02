import type { Dictionary } from "@/content";
import { LineReveal, Reveal } from "@/components/ui/Reveal";

/**
 * Reserved for the future Instagram/Facebook feed. Replace the frames inside
 * `#social-feed` with the feed component; the surrounding composition stays.
 */
export function Social({ dict }: { dict: Dictionary }) {
  const { social } = dict;
  return (
    <section
      id="zajednica"
      aria-labelledby="social-title"
      className="relative overflow-hidden bg-sand/60 py-[var(--section-y)]"
    >
      <div className="wrap grid gap-8 md:gap-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-4">
          <Reveal variant="label">
            <p className="eyebrow eyebrow-display mb-6 text-gold-deep">{social.eyebrow}</p>
          </Reveal>
          <LineReveal id="social-title" lines={[social.heading]} className="display h-section text-green" />
          <Reveal delay={0.1}>
            <p className="lead mt-6 max-w-[28em] text-ink-soft">{social.body}</p>
          </Reveal>
          <ul className="mt-8 space-y-1">
            {social.channels.map((c) => (
              <Reveal as="li" key={c.label}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-12 items-baseline justify-between gap-6 border-b border-ink/15 py-3 text-green transition-transform duration-150 ease-out active:scale-[0.99]"
                >
                  <span className="h-sub">{c.label}</span>
                  <span className="text-sm text-ink-soft transition-colors group-hover:text-gold-deep">
                    {c.handle}
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>

        <div id="social-feed" className="lg:col-span-8" data-feed="reserved">
          {/* Phones show one quiet row of three; the full six from tablet up. */}
          <div className="grid grid-cols-3 gap-2 md:gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Reveal
                key={i}
                delay={(i % 3) * 0.06}
                y={20}
                className={i >= 3 ? "hidden md:block" : undefined}
              >
                <div
                  aria-hidden
                  className={`geo relative grid place-items-center border border-gold/35 bg-ivory ${
                    i % 3 === 1 ? "aspect-[4/5] md:-mt-8" : "aspect-square"
                  }`}
                >
                  {i === 0 && (
                    <span className="eyebrow bg-ivory px-3 py-1 text-[0.625rem] text-gold-deep">
                      {social.soon}
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
