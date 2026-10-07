"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { plural, uipContent, type Location, type LocationId } from "@/content/uip";
import { useLocale } from "@/i18n/client";
import { anchorId, byLetter, fold, matches, people, type Person } from "@/lib/uip";

/*
 * Uprava i profesori: one directory for two schools.
 *
 *   Tuzi | Rožaje          — the location switch (everything below follows it)
 *   Uprava                 — the leadership, set as type
 *   Profesori              — two indexes of the same data:
 *       Po profesorima     each person once, with all of their subjects
 *       Po predmetima      each subject, with all of its teachers
 *   (+ children: Vaspitna služba, Tuzi only)
 *
 * The signature is the index leader: a faint line joining a name to its
 * subjects (or a subject to its teachers), as in a book's index. Following a
 * link across the two views — a subject under a person, a person under a
 * subject — switches the view, brings the entry into place and draws its
 * leader in gold. Search is instant, local and diacritic-insensitive, scoped to
 * the selected school. Motion: short directional cross-fades and the sliding
 * selection marks; nothing animates per keystroke. Reduced motion: none.
 */

type View = "profesori" | "predmeti";
type Focus = { kind: "p" | "s"; name: string; tick: number } | null;

const ease = [0.23, 1, 0.32, 1] as const;

/** The interface text for the page's language, and a counter with its noun. */
function useT() {
  const locale = useLocale();
  const t = uipContent[locale].ui;
  const count = (n: number, forms: readonly string[]) => plural(n, forms, locale === "bs");
  return { t, count };
}

export function Directory({ locations, service }: { locations: readonly Location[]; service: ReactNode }) {
  const { t, count } = useT();
  const [locId, setLocId] = useState<LocationId>("tuzi");
  const [view, setView] = useState<View>("profesori");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<Focus>(null);
  const [dir, setDir] = useState(1);

  const loc = locations.find((l) => l.id === locId) ?? locations[0];
  const other = locations.find((l) => l.id !== locId);
  const all = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, people(l)])), [locations]);
  const list = all[loc.id];

  const result = useMemo(() => search(loc, list, query), [loc, list, query]);
  const elsewhere = useMemo(
    () => (query && other ? search(other, all[other.id], query) : null),
    [query, other, all],
  );

  const switchLoc = (id: LocationId) => {
    if (id === locId) return;
    setDir(id === "rozaje" ? 1 : -1);
    setFocus(null);
    setLocId(id);
  };
  const switchView = (v: View) => {
    if (v === view) return;
    setDir(v === "predmeti" ? 1 : -1);
    setFocus(null);
    setView(v);
  };
  /** Follow a link across the indexes: to a subject (Po predmetima) or a person (Po profesorima). */
  const goTo = (kind: "p" | "s", name: string) => {
    setQuery("");
    const v: View = kind === "s" ? "predmeti" : "profesori";
    if (v !== view) setDir(v === "predmeti" ? 1 : -1);
    setView(v);
    setFocus({ kind, name, tick: Date.now() });
  };

  const counts = `${count(list.length, t.teachers)} · ${count(loc.subjects.length, t.subjectsN)}`;

  return (
    <MotionConfig reducedMotion="user">
      {/* ---------- Opening ---------- */}
      <header className="wrap pt-32 md:pt-44 lg:pt-48">
        <p className="eyebrow eyebrow-display text-gold-deep">{t.eyebrow}</p>
        <h1 className="display mt-4 text-[clamp(2.625rem,1.4rem+5.4vw,6rem)] leading-[0.98] tracking-[-0.03em] text-green md:mt-5">
          {t.title}
        </h1>
        <span aria-hidden className="uip-draw mt-7 block h-px w-24 bg-gold md:mt-9 md:w-32" />

        <Segmented
          label={t.location}
          value={locId}
          onChange={switchLoc}
          className="mt-8 md:mt-10"
          size="large"
          options={locations.map((l) => ({
            value: l.id,
            label: l.label,
            note: count(all[l.id].length, t.teachers),
          }))}
        />
      </header>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={loc.id}
          custom={dir}
          variants={panel}
          initial="enter"
          animate="center"
          exit="exit"
          id="uip-location"
          role="tabpanel"
          aria-label={loc.title}
        >
          <Leadership loc={loc} />

          {/* ---------- Profesori ---------- */}
          <section aria-labelledby="uip-faculty" className="wrap pb-16 md:pb-24">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
              {/* Desktop rail: title, switch, search, quick index */}
              <aside className="hidden lg:col-span-4 lg:block">
                <div className="sticky top-[calc(var(--bar-h-compact)+2rem)] pb-8">
                  <SectionHead id="uip-faculty" title={t.faculty} meta={counts} />
                  <ViewSwitch value={view} onChange={switchView} className="mt-6" />
                  <SearchField value={query} onChange={setQuery} className="mt-6" />
                  <QuickIndex view={view} list={result.people} subjects={result.subjects} loc={loc.id} />
                </div>
              </aside>

              {/* Phones/tablets: title, then a compact sticky bar */}
              <div className="lg:hidden">
                <SectionHead id="uip-faculty-m" title={t.faculty} meta={counts} />
              </div>
              <MobileBar view={view} onView={switchView} query={query} onQuery={setQuery} />

              <div className="lg:col-span-8">
                <ResultNote
                  query={query}
                  count={view === "profesori" ? result.people.length : result.subjects.length}
                  view={view}
                  elsewhere={elsewhere}
                  other={other}
                  onOther={() => other && switchLoc(other.id)}
                  onClear={() => setQuery("")}
                />
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.div
                    key={view}
                    id="uip-index"
                    role="tabpanel"
                    aria-label={view === "profesori" ? t.byPeople : t.bySubjects}
                    custom={dir}
                    variants={swap}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {view === "profesori" ? (
                      <PeopleIndex
                        loc={loc.id}
                        list={result.people}
                        query={query}
                        focus={focus}
                        onSubject={(s) => goTo("s", s)}
                      />
                    ) : (
                      <SubjectIndex
                        loc={loc.id}
                        subjects={result.subjects}
                        query={query}
                        focus={focus}
                        onPerson={(p) => goTo("p", p)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>

          {loc.id === "tuzi" && service}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}

/* ---------- search ---------- */

function search(loc: Location, list: Person[], query: string) {
  if (!fold(query))
    return { people: list, subjects: loc.subjects.map((s) => ({ name: s.name, teachers: [...s.teachers] })) };
  return {
    // A person matches by name or by any of their subjects.
    people: list.filter((p) => matches(p.name, query) || p.subjects.some((s) => matches(s, query))),
    // A subject matches by its name or by any of its teachers.
    subjects: loc.subjects
      .filter((s) => matches(s.name, query) || s.teachers.some((t) => matches(t, query)))
      .map((s) => ({ name: s.name, teachers: [...s.teachers] })),
  };
}

/* ---------- motion ---------- */

const panel = {
  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease } },
  exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: 0.14, ease: "easeIn" as const } }),
};
const swap = {
  enter: (d: number) => ({ opacity: 0, x: d * 16 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.26, ease } },
  exit: (d: number) => ({ opacity: 0, x: d * -12, transition: { duration: 0.12, ease: "easeIn" as const } }),
};

/* ---------- controls ---------- */

type Option<T extends string> = { value: T; label: string; note?: string };

/** A tab list with a sliding selection mark; arrow keys move between options. */
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  size,
  className = "",
  controls = "uip-location",
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  size: "large" | "small";
  className?: string;
  controls?: string;
}) {
  const group = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  if (size === "large") {
    return (
      <div role="tablist" aria-label={label} className={`flex border-b border-ink/15 ${className}`}>
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={controls}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKey(e, i)}
              className="uip-press relative flex min-h-14 flex-1 flex-col items-start justify-end pb-3 pr-4 text-left md:min-h-16 md:flex-none md:pr-14 lg:pr-20"
            >
              <span
                className={`display text-[1.625rem] leading-none tracking-[-0.02em] transition-colors duration-200 md:text-[2.125rem] ${on ? "text-green" : "text-ink-soft/70"}`}
              >
                {o.label}
              </span>
              {o.note && (
                <span className={`mt-1.5 text-[0.75rem] ${on ? "text-gold-deep" : "text-ink-soft/70"}`}>
                  {o.note}
                </span>
              )}
              {on && (
                <motion.span
                  layoutId={`${group}-mark`}
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-gold"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`relative grid grid-cols-2 rounded-full border border-ink/15 p-1 ${className}`}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls="uip-index"
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`uip-press relative min-h-10 rounded-full px-3 text-[0.875rem] font-medium transition-colors duration-200 ${on ? "text-ivory" : "text-ink-soft"}`}
          >
            {on && (
              <motion.span
                layoutId={`${group}-pill`}
                aria-hidden
                className="absolute inset-0 rounded-full bg-green"
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              />
            )}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ViewSwitch({
  value,
  onChange,
  className,
}: {
  value: View;
  onChange: (v: View) => void;
  className?: string;
}) {
  const { t } = useT();
  return (
    <Segmented
      label={t.view}
      size="small"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "profesori", label: t.byPeople },
        { value: "predmeti", label: t.bySubjects },
      ]}
    />
  );
}

function SearchField({
  value,
  onChange,
  className = "",
  autoFocus = false,
  onEscape,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  autoFocus?: boolean;
  onEscape?: () => void;
}) {
  const id = useId();
  const { t } = useT();
  return (
    <div className={`relative ${className}`} role="search">
      <label htmlFor={id} className="sr-only">
        {t.search}
      </label>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-0 top-1/2 size-[1.125rem] -translate-y-1/2 text-gold-deep"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (value) onChange("");
            else onEscape?.();
          }
        }}
        placeholder={t.search}
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        className="uip-search h-11 w-full border-b border-ink/20 bg-transparent pl-7 pr-9 text-[16px] text-ink outline-none transition-colors duration-200 placeholder:text-ink-soft/70 focus:border-gold"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t.clear}
          className="uip-press absolute right-0 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-ink-soft"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Phones and tablets: the view switch and search, sticky just under the site header. */
function MobileBar({
  view,
  onView,
  query,
  onQuery,
}: {
  view: View;
  onView: (v: View) => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const searching = open || query.length > 0;
  return (
    <div className="sticky top-[var(--bar-h-compact)] z-30 -mx-[var(--gutter)] mt-5 border-b border-ink/10 bg-paper/95 px-[var(--gutter)] py-2.5 md:mt-6 lg:hidden">
      {searching ? (
        <div className="flex items-center gap-3">
          <SearchField
            value={query}
            onChange={onQuery}
            autoFocus={open}
            onEscape={() => setOpen(false)}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => {
              onQuery("");
              setOpen(false);
            }}
            className="uip-press min-h-10 shrink-0 text-[0.875rem] font-medium text-green"
          >
            {t.close}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <ViewSwitch value={view} onChange={onView} className="flex-1" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.search}
            className="uip-press grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 text-green"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-[1.125rem]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/** Desktop rail: jump links — letters (Po profesorima) or subjects (Po predmetima). */
function QuickIndex({
  view,
  list,
  subjects,
  loc,
}: {
  view: View;
  list: Person[];
  subjects: { name: string }[];
  loc: string;
}) {
  const { t } = useT();
  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  if (view === "profesori") {
    const letters = byLetter(list).map((g) => g.letter);
    if (!letters.length) return null;
    return (
      <nav aria-label={t.letters} className="mt-8 border-t border-ink/10 pt-5">
        <ul className="flex flex-wrap gap-x-1 gap-y-1">
          {letters.map((l) => (
            <li key={l}>
              <button
                type="button"
                onClick={() => jump(`l-${loc}-${l}`)}
                className="uip-press grid h-9 min-w-9 place-items-center px-1.5 text-[0.9375rem] font-medium text-green transition-colors duration-200 hover:text-gold-deep"
              >
                {l}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  if (!subjects.length) return null;
  return (
    <nav aria-label={t.subjects} className="mt-8 border-t border-ink/10 pt-5">
      <ul className="columns-2 gap-x-6 text-[0.875rem]">
        {subjects.map((s) => (
          <li key={s.name} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => jump(anchorId("s", loc, s.name))}
              className="uip-press min-h-8 text-left text-ink-soft transition-colors duration-200 hover:text-green"
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionHead({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div>
      <h2
        id={id}
        className="display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.05] tracking-[-0.02em] text-green"
      >
        {title}
      </h2>
      {meta && <p className="mt-2 text-[0.8125rem] text-ink-soft">{meta}</p>}
    </div>
  );
}

function ResultNote({
  query,
  count,
  view,
  elsewhere,
  other,
  onOther,
  onClear,
}: {
  query: string;
  count: number;
  view: View;
  elsewhere: { people: Person[] } | null;
  other?: Location;
  onOther: () => void;
  onClear: () => void;
}) {
  const { t, count: n } = useT();
  if (!fold(query)) return <div aria-live="polite" className="sr-only" />;
  const otherCount = elsewhere?.people.length ?? 0;
  return (
    <div aria-live="polite" className="mt-5 text-[0.875rem] text-ink-soft md:mt-6 lg:mt-0">
      {count > 0 ? (
        <p>
          {view === "profesori" ? n(count, t.teachers) : n(count, t.subjectsN)} {t.forQuery} {t.open}
          {query.trim()}
          {t.shut}
        </p>
      ) : (
        <p>
          {t.noResults} {t.open}
          {query.trim()}
          {t.shut}.{" "}
          <button
            type="button"
            onClick={onClear}
            className="uip-press font-medium text-green underline underline-offset-4"
          >
            {t.clear}
          </button>
        </p>
      )}
      {otherCount > 0 && other && (
        <p className="mt-1.5">
          <button
            type="button"
            onClick={onOther}
            className="uip-press font-medium text-green underline underline-offset-4"
          >
            {other.label}: {n(otherCount, t.results)}
          </button>
        </p>
      )}
    </div>
  );
}

/* ---------- the two indexes ---------- */

/** Highlights the part of `text` that the query matched (diacritic-insensitive). */
function Mark({ text, query }: { text: string; query: string }) {
  const q = fold(query);
  if (!q || !matches(text, query)) return <>{text}</>;
  return (
    <span className="text-green underline decoration-gold decoration-1 underline-offset-[5px]">{text}</span>
  );
}

/** Scrolls a followed entry into place and focuses it, once per follow. */
function useFollow(active: boolean, tick: number | undefined) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }, [active, tick]);
  return ref;
}

function PeopleIndex({
  loc,
  list,
  query,
  focus,
  onSubject,
}: {
  loc: string;
  list: Person[];
  query: string;
  focus: Focus;
  onSubject: (s: string) => void;
}) {
  if (!list.length) return null;
  let i = 0;
  return (
    <ol className="mt-4 md:mt-5 lg:mt-0">
      {byLetter(list).map((g) => (
        <li
          key={g.letter}
          id={`l-${loc}-${g.letter}`}
          className="grid scroll-mt-[calc(var(--bar-h-compact)+5.5rem)] grid-cols-[1.75rem_minmax(0,1fr)] border-t border-ink/10 md:grid-cols-[2.75rem_minmax(0,1fr)] lg:scroll-mt-[calc(var(--bar-h-compact)+2rem)]"
        >
          <span
            aria-hidden
            className="display pt-3.5 text-[1rem] leading-none text-gold-deep md:pt-4 md:text-[1.25rem]"
          >
            {g.letter}
          </span>
          <ul>
            {g.people.map((p) => (
              <PersonRow
                key={p.name}
                loc={loc}
                person={p}
                query={query}
                index={i++}
                focus={focus?.kind === "p" && focus.name === p.name ? focus.tick : undefined}
                onSubject={onSubject}
              />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function PersonRow({
  loc,
  person,
  query,
  index,
  focus,
  onSubject,
}: {
  loc: string;
  person: Person;
  query: string;
  index: number;
  focus?: number;
  onSubject: (s: string) => void;
}) {
  const { t } = useT();
  const ref = useFollow(focus !== undefined, focus);
  return (
    <li
      ref={ref}
      id={anchorId("p", loc, person.name)}
      tabIndex={-1}
      data-hit={focus !== undefined ? focus : undefined}
      className="uip-row group relative scroll-mt-[calc(var(--bar-h-compact)+6rem)] flex flex-wrap items-baseline gap-x-3 border-b border-ink/[0.07] py-2.5 outline-none last:border-b-0 md:flex-nowrap md:gap-4 md:py-3.5"
      style={{ "--i": Math.min(index, 14) } as CSSProperties}
    >
      <p className="text-[1.0625rem] font-medium leading-[1.3] text-ink md:shrink-0 md:text-[1.125rem]">
        <Mark text={person.name} query={query} />
      </p>
      <Leader />
      <p className="ml-auto flex flex-wrap items-baseline justify-end gap-x-1 text-right">
        {person.subjects.map((s, k) => (
          <span key={s} className="inline-flex items-baseline">
            {k > 0 && (
              <span aria-hidden className="mx-1 text-gold/80">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onSubject(s)}
              aria-label={`${s} — ${t.toSubject}`}
              className="uip-press uip-link min-h-8 text-[0.875rem] text-gold-deep md:min-h-0 md:text-[0.9375rem]"
            >
              <Mark text={s} query={query} />
            </button>
          </span>
        ))}
      </p>
    </li>
  );
}

function SubjectIndex({
  loc,
  subjects,
  query,
  focus,
  onPerson,
}: {
  loc: string;
  subjects: { name: string; teachers: string[] }[];
  query: string;
  focus: Focus;
  onPerson: (p: string) => void;
}) {
  if (!subjects.length) return null;
  return (
    <ul className="mt-4 border-t border-ink/10 md:mt-5 lg:mt-0">
      {subjects.map((s, i) => (
        <SubjectRow
          key={s.name}
          loc={loc}
          subject={s}
          query={query}
          index={i}
          focus={focus?.kind === "s" && focus.name === s.name ? focus.tick : undefined}
          onPerson={onPerson}
        />
      ))}
    </ul>
  );
}

function SubjectRow({
  loc,
  subject,
  query,
  index,
  focus,
  onPerson,
}: {
  loc: string;
  subject: { name: string; teachers: string[] };
  query: string;
  index: number;
  focus?: number;
  onPerson: (p: string) => void;
}) {
  const { t } = useT();
  const ref = useFollow(focus !== undefined, focus);
  return (
    <li
      ref={ref}
      id={anchorId("s", loc, subject.name)}
      tabIndex={-1}
      data-hit={focus !== undefined ? focus : undefined}
      className="uip-row group relative scroll-mt-[calc(var(--bar-h-compact)+6rem)] flex flex-wrap items-baseline gap-x-3 border-b border-ink/10 py-3 outline-none md:flex-nowrap md:gap-4 md:py-4"
      style={{ "--i": Math.min(index, 14) } as CSSProperties}
    >
      <h3 className="display text-[1.1875rem] leading-[1.2] tracking-[-0.01em] text-green md:shrink-0 md:text-[1.375rem]">
        <Mark text={subject.name} query={query} />
      </h3>
      <Leader />
      <p className="ml-auto flex flex-wrap items-baseline justify-end gap-x-1 text-right md:max-w-[60%]">
        {subject.teachers.map((name, k) => (
          <span key={name} className="inline-flex items-baseline">
            {k > 0 && (
              <span aria-hidden className="mx-1 text-gold/80">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onPerson(name)}
              aria-label={`${name} — ${t.toPerson}`}
              className="uip-press uip-link min-h-8 text-[0.9375rem] text-ink md:min-h-0 md:text-[1rem]"
            >
              <Mark text={name} query={query} />
            </button>
          </span>
        ))}
      </p>
    </li>
  );
}

/** The index leader: a faint line from an entry to what it connects to; drawn in gold when followed. */
function Leader() {
  return (
    <span
      aria-hidden
      className="uip-leader relative block h-px min-w-6 flex-1 self-center bg-ink/[0.12] md:min-w-8"
    >
      <span className="uip-leader-gold absolute inset-0 origin-left bg-gold" />
    </span>
  );
}

/* ---------- Uprava ---------- */

function Leadership({ loc }: { loc: Location }) {
  const { t } = useT();
  const [head, ...rest] = loc.management;
  return (
    <section aria-labelledby="uip-uprava" className="wrap pb-14 pt-12 md:pb-20 md:pt-16 lg:pb-24 lg:pt-20">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <SectionHead id="uip-uprava" title={t.management} meta={loc.title} />
        </div>
        <div className="mt-6 md:mt-8 lg:col-span-8 lg:mt-0">
          {head && (
            <div className="border-t border-gold/60 pt-4 md:pt-5">
              <p className="eyebrow text-[0.6875rem] text-gold-deep md:text-xs">{head.role}</p>
              <p className="display mt-2 text-[clamp(1.875rem,1.3rem+2.2vw,3rem)] leading-[1.05] tracking-[-0.02em] text-green">
                {head.name}
              </p>
            </div>
          )}
          <dl className={`mt-7 grid gap-y-0 md:mt-9 ${rest.length > 1 ? "md:grid-cols-3 md:gap-x-8" : ""}`}>
            {rest.map((r) => (
              <div key={r.role} className="border-t border-ink/12 py-3.5 md:py-4">
                <dt className="text-[0.8125rem] leading-[1.35] text-ink-soft">{r.role}</dt>
                <dd className="mt-1 text-[1.125rem] font-medium leading-[1.3] text-ink md:text-[1.1875rem]">
                  {r.name}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
