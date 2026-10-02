import Link from "next/link";
import type { NewsItem } from "@/content/news";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";
import { GoldRule } from "./NewsMotion";
import { NewsStory } from "./NewsStory";

/** AKTUELNO / Vijesti opening, with an optional "all news" link on the baseline. */
export function NewsHead({
  id,
  eyebrow,
  heading,
  as = "h2",
  link,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  as?: "h1" | "h2";
  link?: { label: string; href: string };
}) {
  return (
    <div className="flex items-end justify-between gap-x-6">
      <div>
        <Reveal>
          <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{eyebrow}</p>
        </Reveal>
        <LineReveal
          id={id}
          as={as}
          lines={[heading]}
          className={`display text-green ${as === "h1" ? "text-[clamp(2.75rem,1.6rem+5vw,6rem)] leading-[1]" : "h-section"}`}
        />
      </div>
      {link && (
        <Reveal className="shrink-0 pb-1 md:pb-2">
          <Link
            href={link.href}
            className="group link-u inline-flex min-h-11 items-center gap-2.5 text-[0.875rem] text-green md:text-[0.9375rem]"
          >
            {link.label}
            <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}

/** High-priority institutional notice: a ruled strip, not a card. */
export function NewsAnnouncement({ label, title, href }: { label: string; title: string; href: string }) {
  return (
    <div className="mt-8 md:mt-10">
      <GoldRule />
      <Link
        href={href}
        className="group flex min-h-16 items-center gap-4 border-b border-ink/12 py-4 transition-transform duration-150 ease-out active:scale-[0.995] md:gap-6 md:py-5"
      >
        <span className="shrink-0 rounded-full border border-gold/70 bg-gold/10 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold-deep">
          {label}
        </span>
        <span className="news-headline flex-1 text-[1.0625rem] font-medium leading-[1.3] text-green md:text-[1.25rem]">
          {title}
        </span>
        <ArrowRight className="shrink-0 text-gold-deep transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

/**
 * Up to six stories in a curated sequence (roles by position):
 *   1 lead · 2 side · 3 compact  — the lead with a narrow column beside it
 *   4 wide                       — full width, text beside the photograph
 *   5 text · 6 feature           — a headline-led story next to a photo story
 * On phones the same sequence becomes a dense, varied feed: compact rows sit
 * between larger photographic stories instead of a stack of identical cards.
 */
export function NewsEditorial({
  items,
  readLabel,
  headingLevel = "h3",
  priorityLead = false,
}: {
  items: readonly NewsItem[];
  readLabel: string;
  headingLevel?: "h2" | "h3";
  priorityLead?: boolean;
}) {
  const [lead, side, compact, wide, text, feature] = items;
  const story = { readLabel, headingLevel };
  const hasAside = Boolean(side || compact);

  return (
    <div className="news-type grid gap-y-10 md:gap-y-14 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-20">
      {lead && (
        <div className={hasAside ? "lg:col-span-7" : "lg:col-span-8"}>
          <NewsStory item={lead} role="lead" priority={priorityLead} {...story} />
        </div>
      )}

      {hasAside && (
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-10 lg:col-span-5 lg:col-start-8 lg:flex lg:gap-x-0 xl:col-span-4 xl:col-start-9">
          {[
            side && { item: side, role: "side" as const },
            compact && { item: compact, role: "compact" as const },
          ]
            .filter((x): x is { item: NewsItem; role: "side" | "compact" } => Boolean(x))
            .map(({ item, role }, i) => (
              <div
                key={item.href}
                className={`border-t border-ink/12 py-6 ${i === 0 ? "lg:border-t-0 lg:pt-0" : ""}`}
              >
                <NewsStory item={item} role={role} {...story} />
              </div>
            ))}
        </div>
      )}

      {wide && (
        <div className="md:border-t md:border-ink/12 md:pt-14 lg:col-span-12 lg:pt-20">
          <NewsStory item={wide} role="wide" {...story} />
        </div>
      )}

      {text && (
        <div className="lg:col-span-5">
          <NewsStory item={text} role="text" {...story} />
        </div>
      )}
      {feature && (
        <div className="lg:col-span-6 lg:col-start-7">
          <NewsStory item={feature} role="feature" {...story} />
        </div>
      )}
    </div>
  );
}
