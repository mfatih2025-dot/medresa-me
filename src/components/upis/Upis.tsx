import type { CSSProperties } from "react";
import { upis as u, type UpisDocument } from "@/content/upis";
import { ArrowDown } from "@/components/ui/icons";
import { Depth, Letters, Line, Path, Soft, Stage } from "./UpisMotion";

/*
 * Upis i prijemni: the moment before the answer.
 *
 * One directed sequence, typography only:
 *
 *   Title     UPIS / I PRIJEMNI / ISPIT set line by line — each rises out of
 *             its mask while its letters close up — then reads as one block;
 *             the three lines trail the scroll at slightly different rates.
 *             A gold path runs from the page edge to where ISPIT begins.
 *   Status    the admission sentence, quiet; a gold threshold draws across
 *             the page; after a breath the answer rises out of it: OTVOREN.
 *   Document  the official instruction as a ledger line with its action
 *   Welcome   the path falls through quiet space and stops where the welcome
 *             begins; the type becomes calmer, sentence case, slower — the
 *             page exhales.
 *
 * Data-driven (content/upis.ts): the status word and the documents can change
 * (later: results) without touching this composition. Screen readers get each
 * sentence whole; the visual split is aria-hidden.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

function DocumentAction({ doc }: { doc: UpisDocument }) {
  const inner = (
    <>
      <span className="grid size-11 shrink-0 place-items-center border border-gold/70 transition-colors duration-200 ease-out group-hover:bg-gold-soft/25 md:size-12">
        <ArrowDown className="transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
      </span>
      <span className="underline decoration-gold/50 decoration-1 underline-offset-[6px] transition-colors duration-200 group-hover:decoration-gold">
        {doc.action}
      </span>
    </>
  );
  const cls =
    "group inline-flex min-h-14 touch-manipulation items-center gap-4 text-left text-[1.0625rem] text-green md:text-[1.125rem]";
  // Prepared, not yet linked: the action is in place and does nothing until a PDF is set.
  if (!doc.href)
    return (
      <button type="button" aria-disabled="true" className={`${cls} cursor-default`}>
        {inner}
      </button>
    );
  return (
    <a href={doc.href} download className={cls}>
      {inner}
    </a>
  );
}

export function Upis() {
  const [l1, l2, l3] = u.title;
  const statusSentence = `${u.status.before} ${u.status.word}${u.status.after}`;
  const welcomeSentence = `${u.closing.welcome} ${u.closing.rest}`;
  return (
    <article
      className="overflow-x-clip bg-paper pb-20 text-ink md:pb-28"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Title: set line by line, then one block ---------- */}
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <h1 className="display uppercase leading-[0.86] tracking-[-0.025em] text-green text-[min(19vw,10rem)] lg:text-[min(13vw,13rem)]">
          <span className="sr-only">{u.title.join(" ")}</span>
          <span aria-hidden className="block">
            <Depth px={0} offset={["start start", "end start"]}>
              <Letters text={l1} immediate delay={0.1} />
            </Depth>
            <Depth px={18} offset={["start start", "end start"]} className="lg:ml-[16.6667%]">
              <Letters text={l2} immediate delay={0.42} />
            </Depth>
            <Depth px={36} offset={["start start", "end start"]} className="ml-[30%] lg:ml-[50%]">
              <Letters text={l3} immediate delay={0.74} />
            </Depth>
          </span>
        </h1>
        {/* The path: from the page edge to where ISPIT begins. */}
        <div className="relative mt-7 h-px md:mt-9">
          <Line
            origin="left"
            immediate
            delay={1.45}
            duration={1.1}
            className="top-0 left-[calc(-1*var(--edge))] w-[calc(var(--edge)+30%)] lg:w-[calc(var(--edge)+50%)]"
          />
        </div>
      </header>

      {/* ---------- Status: the sentence, a threshold, then the answer ---------- */}
      <section aria-label="Status upisa" className="wrap mt-20 md:mt-28 lg:mt-36">
        <p className="sr-only">{statusSentence}</p>
        {/* The answer comes after the question: this plays once the title has been set. */}
        <Stage after={1.35}>
          <div aria-hidden>
            <Soft duration={1.1} className="lg:max-w-[66.6667%]">
              <p className="hist-text max-w-[21em] text-[clamp(1.375rem,1rem+1.8vw,2.5rem)] font-light leading-[1.3] tracking-[-0.01em] text-green">
                {u.status.before}
              </p>
            </Soft>
            <div className="relative mt-5 pb-3 md:mt-7 md:pb-4 lg:ml-[16.6667%]">
              <Depth px={14}>
                <Letters
                  text={`${u.status.word}${u.status.after}`}
                  delay={0.75}
                  duration={1.15}
                  spread={0.05}
                  className="display uppercase leading-[0.84] tracking-[-0.03em] text-green text-[min(19vw,12rem)] md:text-[min(16vw,12rem)] lg:text-[min(14.5vw,14rem)]"
                />
              </Depth>
              {/* The threshold the answer rises out of: page edge to page edge. */}
              <Line
                origin="left"
                delay={0.2}
                duration={1}
                className="bottom-0 left-[calc(-1*var(--edge))] right-[calc(-1*var(--edge))] lg:left-[calc(-1*(var(--edge)+20%))]"
              />
            </div>
          </div>
        </Stage>
      </section>

      {/* ---------- The official document(s) ---------- */}
      <section aria-label={u.documents[0]?.title} className="wrap mt-16 md:mt-24 lg:mt-28">
        {/* …and the document after the answer. */}
        <Stage after={2.5}>
          <ul className="relative">
            {/* The answer leads into the document: a gold rule over the ledger. */}
            <Line origin="left" duration={1.1} className="top-0 left-0 right-0" />
            {u.documents.map((doc, i) => (
              <li
                key={doc.title}
                className="border-b border-ink/15 py-7 md:py-9 lg:grid lg:grid-cols-12 lg:items-end"
              >
                <Soft delay={0.05 + i * 0.08} className="lg:col-span-7 lg:pr-10">
                  <h2 className="display hist-text max-w-[18em] text-[clamp(1.5rem,1.15rem+1.6vw,2.5rem)] leading-[1.15] tracking-[-0.015em] text-green">
                    {doc.title}
                  </h2>
                </Soft>
                <Soft
                  delay={0.2 + i * 0.08}
                  className="mt-6 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:justify-self-end"
                >
                  <DocumentAction doc={doc} />
                </Soft>
              </li>
            ))}
          </ul>
        </Stage>
      </section>

      {/* ---------- Welcome: the page exhales ---------- */}
      <section aria-label={welcomeSentence} className="wrap">
        <div className="relative pl-6 pt-24 md:pl-8 md:pt-32 lg:ml-[8.3333%] lg:pl-10 lg:pt-40">
          {/* The path falls through quiet space and stops where the welcome begins. */}
          <Path className="top-0 left-0 h-24 md:h-32 lg:h-40" />
          <h2 className="sr-only">{welcomeSentence}</h2>
          <div aria-hidden>
            <Letters
              text={u.closing.welcome}
              spread={0.05}
              duration={1.4}
              className="display leading-[0.92] tracking-[-0.03em] text-green text-[min(14.4vw,9rem)]"
            />
            <Soft delay={0.55} duration={1.4} y={10}>
              <p className="hist-text mt-4 max-w-[20em] text-[clamp(1.375rem,1.05rem+1.4vw,2.25rem)] font-light leading-[1.3] tracking-[-0.01em] text-green md:mt-6">
                {u.closing.rest}
              </p>
            </Soft>
          </div>
          <Soft delay={0.9} duration={1.4} y={10}>
            <p className="hist-text mt-8 max-w-[28em] text-[1.125rem] font-light leading-[1.65] text-ink-soft md:mt-10 md:text-[1.3125rem]">
              {u.closing.since}
            </p>
          </Soft>
          {u.closing.quran && (
            <Soft delay={1.2} duration={1.4} y={8}>
              <figure className="mt-10 max-w-[30em] md:mt-12">
                <blockquote className="hist-text text-[1.125rem] font-light leading-[1.6] text-green md:text-[1.25rem]">
                  {u.closing.quran.text}
                </blockquote>
                <figcaption className="mt-3 text-[0.9375rem] tracking-[0.03em] text-gold-deep">
                  {u.closing.quran.source}
                </figcaption>
              </figure>
            </Soft>
          )}
          {/* The line comes to rest. */}
          <div className="relative mt-10 h-px md:mt-12">
            <Line origin="left" delay={1.1} duration={1.2} className="top-0 left-0 w-16 md:w-24" />
          </div>
        </div>
      </section>
    </article>
  );
}
