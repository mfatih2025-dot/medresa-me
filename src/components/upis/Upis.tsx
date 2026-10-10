import { admissionText, type AdmissionStatus } from "@/admin/results/admissions";
import type { CSSProperties } from "react";
import { upisContent, type UpisDocument } from "@/content/upis";
import type { Locale } from "@/i18n/config";
import { ArrowDown } from "@/components/ui/icons";
import { Depth, Letters, Line, Soft, Stage } from "./UpisMotion";

/*
 * Upis i prijemni: the moment before the answer — and the answer's document.
 *
 * A short page in one directed sequence; the motion leads the eye to the
 * document, which is the destination:
 *
 *   Title     UPIS I PRIJEMNI / ISPIT, left-aligned, set line by line — each
 *             rises out of its mask while its letters close up — then reads as
 *             one title; a gold path runs in from the page edge.
 *   Status    the admission sentence, then a gold threshold across the page,
 *             then the status word rising out of it: OTVOREN.
 *   Document  the official file: a bordered block with a document mark, its
 *             title and the download action; a gold rule draws over it and
 *             down its side, handing attention to it. The whole block is the
 *             action (a stretched link/button), with a quiet hover and press.
 *
 * Data-driven (content/upis.ts): the status word and the documents can change
 * (later: results) without touching this composition. Screen readers get each
 * sentence whole; the visual split is aria-hidden.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

/** A document mark: a small sheet with a folded corner, labelled PDF. */
function FileMark() {
  return (
    <span
      aria-hidden
      className="relative flex h-14 w-11 shrink-0 items-end justify-center border border-gold/70 pb-1.5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 md:h-16 md:w-12"
    >
      <span className="absolute -right-px -top-px size-2.5 border-b border-l border-gold/70 bg-paper transition-colors duration-200 group-hover:bg-ivory" />
      <span className="text-[0.625rem] font-medium tracking-[0.14em] text-gold-deep">PDF</span>
    </span>
  );
}

function DocumentBlock({ doc, index }: { doc: UpisDocument; index: number }) {
  const label = (
    <>
      {doc.action}
      {/* The whole block is the target. */}
      <span aria-hidden className="absolute inset-0" />
    </>
  );
  const actionCls =
    "touch-manipulation underline decoration-gold/50 decoration-1 underline-offset-[6px] transition-colors duration-200 group-hover:decoration-gold focus-visible:outline-none";
  return (
    <div className="group relative border border-ink/15 bg-paper transition-[border-color,background-color,transform] duration-200 ease-out hover:border-gold/60 hover:bg-ivory has-[:focus-visible]:border-gold has-[:active]:scale-[0.992] motion-reduce:has-[:active]:scale-100">
      {/* Attention handed to the document: gold over its top, then down its side. */}
      <Line origin="left" duration={1} delay={0.05 + index * 0.08} className="-top-px -left-px -right-px" />
      <Line origin="top" duration={0.8} delay={0.55 + index * 0.08} className="-left-px -top-px -bottom-px" />
      {/* Phones: mark and title side by side, the action across the full width below.
          Wider: the action sits under the title. */}
      <div className="grid grid-cols-[auto_1fr] gap-x-4 p-5 md:gap-x-6 md:p-7 lg:p-8">
        <FileMark />
        <h2 className="display hist-text self-center text-[clamp(1.25rem,1.05rem+1vw,1.875rem)] leading-[1.2] tracking-[-0.012em] text-green md:self-start">
          {/* The text exactly as published; a year range („2026 - 2027.“) never breaks apart. */}
          {doc.title.split(/(\d{4} - \d{4}\.?)/).map((part, i) =>
            i % 2 ? (
              <span key={i} className="whitespace-nowrap">
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </h2>
        <div className="col-span-2 mt-4 flex min-h-11 items-center gap-3 whitespace-nowrap text-[1.0625rem] text-green md:col-span-1 md:col-start-2 md:mt-5 md:text-[1.125rem]">
          <span className="grid size-10 shrink-0 place-items-center border border-gold/70 transition-colors duration-200 ease-out group-hover:bg-gold-soft/30 md:size-11">
            <ArrowDown className="transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
          </span>
          {/* Prepared, not yet linked: the action is in place and does nothing until a PDF is set. */}
          {doc.href ? (
            <a href={doc.href} download className={actionCls}>
              {label}
            </a>
          ) : (
            <button type="button" aria-disabled="true" className={`${actionCls} cursor-default text-left`}>
              {label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Upis({ locale, documentHref, admissionStatus }: { locale: Locale; documentHref?: string | null; admissionStatus?: AdmissionStatus | null }) {
  const source = { ...upisContent[locale], ...(admissionStatus ? { status: admissionText(admissionStatus,locale) } : {}) };
  const u = documentHref === undefined ? source : { ...source, documents: source.documents.map((doc, i) => i === 0 ? { ...doc, href: documentHref } : doc) };
  const [l1, l2] = u.title;
  const statusSentence = `${u.status.before} ${u.status.word}${u.status.after}`;
  return (
    <article
      className="overflow-x-clip bg-paper pb-16 text-ink md:pb-24"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Title: set line by line, then one title ---------- */}
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <h1
          className="display uppercase leading-[0.9] tracking-[-0.022em] text-green text-[length:var(--fit)] md:text-[min(11vw,6.75rem)]"
          style={{ "--fit": `${u.titleFit}vw` } as CSSProperties}
        >
          <span className="sr-only">{u.title.join(" ")}</span>
          <span aria-hidden className="block">
            {/* Phones: the whole title on one line (letters start closer, to stay in view). */}
            {!u.phoneSplit && (
              <Depth px={0} offset={["start start", "end start"]} className="md:hidden">
                <Letters text={u.title.join(" ")} immediate delay={0.1} duration={1.2} spread={0.02} />
              </Depth>
            )}
            {/* Larger screens (and phones, where one line would be too small for the language): two lines. */}
            <Depth
              px={0}
              offset={["start start", "end start"]}
              className={u.phoneSplit ? "" : "hidden md:block"}
            >
              <Letters text={l1} immediate delay={0.1} />
            </Depth>
            <Depth
              px={12}
              offset={["start start", "end start"]}
              className={u.phoneSplit ? "" : "hidden md:block"}
            >
              <Letters text={l2} immediate delay={0.42} />
            </Depth>
          </span>
        </h1>
        {/* The path, in from the page edge. */}
        <div className="relative mt-5 h-px md:mt-6">
          <Line
            origin="left"
            immediate
            delay={1.1}
            duration={1.1}
            className="top-0 left-[calc(-1*var(--edge))] w-[calc(var(--edge)+30%)] lg:w-[calc(var(--edge)+33.3333%)]"
          />
        </div>
      </header>

      {/* ---------- Status: the sentence, a threshold, then the status word ---------- */}
      <section aria-label={u.statusLabel} className="wrap mt-9 md:mt-12 lg:mt-14">
        <p className="sr-only">{statusSentence}</p>
        {/* The answer comes after the question: this plays once the title has been set. */}
        <Stage after={1.35}>
          <div aria-hidden>
            <Soft duration={1.1}>
              <p className="hist-text max-w-[24em] text-[clamp(1.125rem,0.98rem+0.75vw,1.625rem)] font-light leading-[1.4] text-green">
                {u.status.before}
              </p>
            </Soft>
            <div className="relative mt-3 pb-2.5 md:mt-4 md:pb-3">
              <Depth px={8}>
                <Letters
                  text={`${u.status.word}${u.status.after}`}
                  delay={0.75}
                  duration={1.15}
                  spread={0.05}
                  className="display uppercase leading-[0.86] tracking-[-0.025em] text-green text-[min(10vw,5.25rem)]"
                />
              </Depth>
              {/* The threshold the status rises out of: page edge to page edge. */}
              <Line
                origin="left"
                delay={0.2}
                duration={1}
                className="bottom-0 left-[calc(-1*var(--edge))] right-[calc(-1*var(--edge))]"
              />
            </div>
          </div>
        </Stage>
      </section>

      {/* ---------- The document: the destination ---------- */}
      <section aria-label={u.documents[0]?.title} className="wrap mt-8 md:mt-10 lg:mt-12">
        {/* …and the document after the status. */}
        <Stage after={2.5}>
          <ul className="grid gap-4 md:gap-5 lg:max-w-[66.6667%]">
            {u.documents.map((doc, i) => (
              <li key={doc.title}>
                <Soft delay={i * 0.08} duration={0.9} y={14}>
                  <DocumentBlock doc={doc} index={i} />
                </Soft>
              </li>
            ))}
          </ul>
        </Stage>
        {u.closing && (
          <div className="mt-8 max-w-[34em] md:mt-10">
            {u.closing.text.map((t) => (
              <p
                key={t}
                className="hist-text mt-2 text-[1rem] font-light leading-[1.65] text-ink-soft first:mt-0"
              >
                {t}
              </p>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
