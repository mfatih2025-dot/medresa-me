import Image from "next/image";
import {
  formatDate,
  formatSize,
  obavjestenjaText,
  sortedAnnouncements,
  type Announcement,
  type AnnouncementDocument,
} from "@/content/obavjestenja";
import type { Locale } from "@/i18n/config";
import { GoldRule } from "@/components/news/NewsMotion";
import { LineReveal, Reveal } from "@/components/ui/Reveal";
import { ArrowDown } from "@/components/ui/icons";
import { Line } from "@/components/upis/UpisMotion";

/*
 * Obavještenja: official announcements, as the Medresa's own notice board.
 *
 *   Obavještenja                         the title, set in a mask once
 *   ● Izdvojeno · 25. novembar 2026.     each announcement: pinned mark, date,
 *   Prijava maturskih ispita …           its title, a gold rule
 *   ┌───────────┐  ┌───────────┐         its documents, the page's language first:
 *   │  page 1   │  │  page 1   │         the first page of the original PDF on its
 *   └───────────┘  └───────────┘         sheet, the language, format and size, and
 *   [↓ Preuzmi PDF][↓ Preuzmi PDF]       one download action under it
 *
 * The documents are the originals, unchanged; the previews are rendered from them.
 * Data-driven (src/content/obavjestenja.ts): a new announcement needs no change here.
 */

function DocumentCard({ doc, locale, index }: { doc: AnnouncementDocument; locale: Locale; index: number }) {
  const t = obavjestenjaText[locale];
  return (
    <Reveal y={16} delay={0.08 * index} className="h-full">
      <figure className="group relative flex h-full flex-col border border-ink/15 bg-paper transition-[border-color] duration-200 ease-out hover:border-gold/60 has-[:focus-visible]:border-gold">
        {/* The upis documents' gesture: gold over the top, then down the side. */}
        <Line origin="left" duration={1} delay={0.1 + index * 0.1} className="-top-px -left-px -right-px" />
        <Line origin="top" duration={0.8} delay={0.6 + index * 0.1} className="-left-px -top-px -bottom-px" />

        {/* The document itself: its first page, on its sheet. */}
        <div className="flex justify-center bg-[var(--color-stage)] px-6 pb-7 pt-8 md:px-8 md:pb-9 md:pt-10">
          <Image
            src={doc.preview.src}
            width={doc.preview.width}
            height={doc.preview.height}
            alt=""
            sizes="(min-width: 1024px) 20rem, (min-width: 768px) 38vw, 72vw"
            className="h-auto w-[min(100%,17rem)] border border-ink/10 bg-white shadow-[0_18px_40px_-22px_rgb(10_42_33/0.45),0_2px_6px_rgb(10_42_33/0.08)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0 md:w-[min(100%,19rem)]"
          />
        </div>

        <figcaption className="flex flex-1 flex-col gap-5 p-5 md:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-gold-deep md:text-[0.8125rem]">
              {doc.language[locale]}
            </span>
            <span className="shrink-0 text-[0.8125rem] tabular-nums tracking-[0.04em] text-ink-soft">
              {t.format} · {formatSize(doc.bytes)}
            </span>
          </div>
          <a
            href={doc.file}
            download={doc.downloadName}
            type="application/pdf"
            className="mt-auto flex min-h-12 items-center justify-center gap-3 bg-green-deep px-5 text-[1rem] font-medium text-ivory transition-[background-color,transform] duration-200 ease-out hover:bg-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.99] motion-reduce:active:scale-100 md:min-h-[3.25rem]"
          >
            <ArrowDown aria-hidden className="text-gold-soft transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
            {t.download}
            <span className="sr-only"> — {doc.language[locale]}</span>
          </a>
        </figcaption>
      </figure>
    </Reveal>
  );
}

function AnnouncementEntry({ a, locale }: { a: Announcement; locale: Locale }) {
  const t = obavjestenjaText[locale];
  const docs = a.order[locale].map((id) => a.documents.find((d) => d.id === id)!).filter(Boolean);
  return (
    <article aria-labelledby={`obavjestenje-${a.id}`} className="wrap mt-12 md:mt-16 lg:mt-20">
      <Reveal y={12}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] font-medium uppercase tracking-[0.18em] text-gold-deep">
          {a.pinned && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-1.5 rotate-45 bg-gold" />
              {t.pinned}
            </span>
          )}
          {a.pinned && <span aria-hidden className="text-gold">·</span>}
          <time dateTime={a.date} className="tracking-[0.12em] text-ink-soft">
            {formatDate(a.date, locale)}
          </time>
        </p>
        <h2
          id={`obavjestenje-${a.id}`}
          className="display hist-text mt-4 max-w-[22ch] text-[clamp(1.75rem,1.2rem+2.4vw,3.25rem)] leading-[1.08] tracking-[-0.02em] text-green md:mt-5"
        >
          {a.title[locale]}
        </h2>
      </Reveal>
      <GoldRule className="mt-7 w-20 md:mt-9 md:w-28" />

      <h3 className="sr-only">{t.documents}</h3>
      <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-8 lg:max-w-[64rem] lg:gap-10">
        {docs.map((doc, i) => (
          <DocumentCard key={doc.id} doc={doc} locale={locale} index={i} />
        ))}
      </div>
    </article>
  );
}

export function Obavjestenja({ locale }: { locale: Locale }) {
  const t = obavjestenjaText[locale];
  return (
    <div className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28">
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <Reveal variant="label">
          <p className="eyebrow eyebrow-display mb-4 text-gold-deep md:mb-5">{t.eyebrow}</p>
        </Reveal>
        <LineReveal
          as="h1"
          immediate
          lines={[t.title]}
          className="display text-[clamp(2.75rem,1.6rem+5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-green"
        />
      </header>
      {sortedAnnouncements().map((a) => (
        <AnnouncementEntry key={a.id} a={a} locale={locale} />
      ))}
    </div>
  );
}
