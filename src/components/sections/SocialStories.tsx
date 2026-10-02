import type { Platform, SocialMedia } from "@/lib/social/types";
import { GoldRule, NewsImage } from "@/components/news/NewsMotion";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/icons";

export type SocialCardData = {
  platform: Platform;
  platformLabel: string;
  url: string;
  /** Formatted date (post) or handle (profile). */
  meta: string;
  dateTime?: string;
  text: string;
  media?: SocialMedia;
  action: string;
  label: string;
};

/**
 * Medresa iz dana u dan: the latest Instagram and Facebook content presented as
 * two editorial stories, not as social cards. The platform is quiet metadata
 * beside the date; photography and the words carry the section.
 *
 * Phones: one column, the second story set apart by a hairline.
 * Tablet/desktop: an asymmetric pair — a primary story (7 of 12 columns) and a
 * secondary one (5 columns) set lower, sharing the intro's baseline grid.
 * Motion: the photograph opens from a slight crop as it enters; text rises in.
 */
export function SocialStories({
  copy,
  cards,
}: {
  copy: { eyebrow: string; heading: string; lead: string };
  cards: SocialCardData[];
}) {
  const [primary, secondary] = cards;
  return (
    <section
      aria-labelledby="feed-title"
      className="news-type relative bg-ivory pb-[var(--section-y)] pt-[calc(var(--section-y)*0.85)]"
    >
      <div className="wrap">
        {/* Intro: heading left, the supporting line on its baseline to the right. */}
        <header className="md:grid md:grid-cols-12 md:items-end md:gap-x-8 lg:gap-x-12">
          <div className="md:col-span-7">
            <Reveal variant="label">
              <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{copy.eyebrow}</p>
            </Reveal>
            <LineReveal
              id="feed-title"
              lines={[copy.heading]}
              className="display h-section text-green [text-wrap:balance]"
            />
          </div>
          <Reveal delay={0.08} className="md:col-span-5 md:pb-2">
            <p className="mt-4 max-w-[24em] text-[1rem] leading-[1.6] text-ink-soft md:mt-0 md:text-[1.0625rem] lg:ml-auto">
              {copy.lead}
            </p>
          </Reveal>
        </header>
        <GoldRule className="mt-7 md:mt-10 lg:mt-12" />

        <div className="mt-7 md:mt-10 md:grid md:grid-cols-12 md:items-start md:gap-x-8 lg:mt-12 lg:gap-x-12">
          {primary && (
            <div className="md:col-span-7">
              <Story card={primary} primary />
            </div>
          )}
          {secondary && (
            <div className="mt-9 border-t border-ink/12 pt-7 md:col-span-5 md:mt-[22%] md:border-t-0 md:pt-0">
              <Story card={secondary} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Story({ card, primary = false }: { card: SocialCardData; primary?: boolean }) {
  return (
    <article>
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={card.label}
        className="group block"
      >
        {card.media && (
          <NewsImage
            image={card.media}
            quiet={!primary}
            sizes={primary ? "(min-width: 768px) 56vw, 92vw" : "(min-width: 768px) 38vw, 92vw"}
            className={`rounded-[2px] ${primary ? "aspect-[3/2] md:aspect-[16/11]" : "aspect-[3/2] md:aspect-[4/3]"}`}
          />
        )}
        <Reveal y={12}>
          <p className="mt-4 flex items-center gap-2 text-[0.75rem] text-ink-soft md:mt-5">
            <PlatformIcon platform={card.platform} />
            <span className="font-medium uppercase tracking-[0.16em] text-gold-deep">
              {card.platformLabel}
            </span>
            <span aria-hidden className="text-gold">
              ·
            </span>
            {card.dateTime ? <time dateTime={card.dateTime}>{card.meta}</time> : <span>{card.meta}</span>}
          </p>
          <p
            className={`news-excerpt mt-3 line-clamp-3 max-w-[34em] text-ink [text-wrap:pretty] ${
              primary
                ? "text-[1.0625rem] leading-[1.55] md:text-[1.1875rem]"
                : "text-[1rem] leading-[1.55] md:text-[1.0625rem]"
            }`}
          >
            {card.text}
          </p>
          <span className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-medium text-green">
            <span className="link-u">{card.action}</span>
            <ArrowRight className="transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-focus-visible:translate-x-[5px]" />
          </span>
        </Reveal>
      </a>
    </article>
  );
}

/** Small monochrome platform marks, in the text colour (no brand colours). */
function PlatformIcon({ platform }: { platform: Platform }) {
  return platform === "instagram" ? (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="text-gold-deep"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-gold-deep"
    >
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />
    </svg>
  );
}
