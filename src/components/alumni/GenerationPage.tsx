"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";
import { alumniContent, generationPath, generations } from "@/content/alumni";
import type { Locale } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { Heading, OpenLabel } from "./Archive";
import { PanoFrame } from "./AlumniMotion";
import { PanoViewer } from "./PanoViewer";

/*
 * One generation on its own page (/alumni/generacija-vii): where the QR code
 * on that generation's printed pano leads. The archive's own parts, unchanged:
 * its heading (here the page's h1), its pano frame, „Otvori pano“ and the
 * viewer (zoom, pan, swipe on to the other generations). The pano comes first
 * and whole, sized to the screen, so a phone that just scanned the pano shows it
 * at once. Then the neighbouring generations and the way back to all of them.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

export function GenerationPage({ locale, number }: { locale: Locale; number: number }) {
  const a = alumniContent[locale];
  const { reduced } = useMotionProfile();
  const index = generations.findIndex((g) => g.number === number);
  const g = generations[index];
  const [open, setOpen] = useState<number | null>(null);
  const onOpen = useCallback((n: number) => setOpen(generations.findIndex((x) => x.number === n)), []);
  const prev = generations[index - 1];
  const next = generations[index + 1];
  const label = `${a.label} ${g.roman}`;

  return (
    <article
      className="overflow-x-clip bg-paper pb-24 text-ink md:pb-32 lg:pb-40"
      style={{ "--edge": edge } as CSSProperties}
    >
      <div className="wrap pt-28 md:pt-36 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:pt-40">
        <div className="lg:col-span-3">
          <Link
            href={pathFor("alumni", locale)}
            className="eyebrow eyebrow-display inline-flex min-h-11 items-center gap-3 text-gold-deep"
          >
            <span aria-hidden className="h-px w-8 bg-gold md:w-10" />
            {a.title}
          </Link>
          <Heading g={g} as="h1" className="mt-3 md:mt-4" />
        </div>

        {/* The pano, whole: on wide screens beside the heading and within the screen's height. */}
        <div className="mt-6 md:mt-9 lg:col-span-9 lg:mt-1 lg:max-w-[min(100%,calc((100svh-13rem)*1.42))]">
          <PanoFrame
            generation={g}
            label={`${a.open}: ${label}`}
            sizes="(min-width: 1024px) 80vw, 100vw"
            reveal="center"
            priority
            hidden={open !== null && generations[open]?.number === g.number}
            onOpen={onOpen}
          />
          <OpenLabel g={g} onOpen={onOpen} />
        </div>

        {/* The neighbouring generations, and all of them. */}
        <nav
          aria-label={a.generationsHeading}
          className="mt-14 grid grid-cols-2 gap-x-4 border-t border-ink/12 pt-6 md:mt-20 md:pt-8 lg:col-span-12"
        >
          {prev ? (
            <Link href={generationPath(prev, locale)} className="group flex min-h-11 flex-col">
              <span className="text-[0.8125rem] tracking-[0.04em] text-ink-soft">{a.ui.prev}</span>
              <span className="display mt-1 text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] leading-none text-green transition-colors duration-200 group-hover:text-gold-deep">
                {prev.roman}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={generationPath(next, locale)}
              className="group flex min-h-11 flex-col items-end text-right"
            >
              <span className="text-[0.8125rem] tracking-[0.04em] text-ink-soft">{a.ui.next}</span>
              <span className="display mt-1 text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] leading-none text-green transition-colors duration-200 group-hover:text-gold-deep">
                {next.roman}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={`${pathFor("alumni", locale)}#generacija-${g.number}`}
            className="col-span-2 mt-8 inline-flex min-h-11 items-center justify-center gap-3 border-t border-ink/12 pt-6 text-[0.9375rem] text-green underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-200 hover:decoration-gold md:mt-10"
          >
            {a.generationsHeading}
          </Link>
        </nav>
      </div>

      {open !== null && (
        <PanoViewer
          list={generations}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          reduced={reduced}
        />
      )}
    </article>
  );
}
