"use client";

import { useMemo, useState } from "react";
import { EDITORIAL_COUNT, newsYear, type NewsItem } from "@/content/news";
import { ArrowRight } from "@/components/ui/icons";
import { NewsMeta } from "./NewsStory";

const PAGE = 24;

/**
 * Archive index for everything beyond the curated editorial stories: a quiet,
 * year-grouped list (date · category · headline) that stays readable with
 * hundreds of articles. Category filtering appears only once there is enough
 * material to need it; a filtered view lists all matching stories.
 */
export function NewsArchive({
  items,
  labels,
}: {
  items: readonly NewsItem[];
  labels: { archive: string; filterAll: string; more: string };
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const canFilter = items.length > EDITORIAL_COUNT && categories.length > 1;
  const list = category ? items.filter((i) => i.category === category) : items.slice(EDITORIAL_COUNT);
  const shown = list.slice(0, limit);

  const years = useMemo(() => {
    const map = new Map<string, NewsItem[]>();
    for (const item of shown) {
      const y = newsYear(item);
      map.set(y, [...(map.get(y) ?? []), item]);
    }
    return [...map.entries()];
  }, [shown]);

  if (!canFilter && list.length === 0) return null;

  return (
    <section aria-labelledby="archive-title" className="news-type mt-16 md:mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-ink/15 pb-5">
        <h2 id="archive-title" className="display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] text-green">
          {labels.archive}
        </h2>
        {canFilter && (
          <div role="group" aria-label={labels.archive} className="flex flex-wrap gap-2">
            {[null, ...categories].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setCategory(c);
                    setLimit(PAGE);
                  }}
                  className={`min-h-11 rounded-full border px-4 text-[0.8125rem] font-medium transition-[background-color,color,border-color,scale] duration-200 ease-out active:scale-[0.97] ${
                    active
                      ? "border-green bg-green text-ivory"
                      : "border-ink/20 text-green hover:border-green/60"
                  }`}
                >
                  {c ?? labels.filterAll}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {years.map(([year, rows]) => (
        <div key={year} className="grid gap-x-12 pt-8 md:grid-cols-12 md:pt-10">
          <p className="display mb-2 text-[1.25rem] text-gold-deep md:col-span-2 md:mb-0 md:pt-5">{year}</p>
          <ul className="md:col-span-10">
            {rows.map((item) => (
              <li key={item.href} className="border-b border-ink/12">
                <a
                  href={item.href}
                  rel="noopener"
                  className="group grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-5 transition-transform duration-150 ease-out active:scale-[0.995]"
                >
                  <span>
                    <NewsMeta item={item} />
                    <span className="news-headline mt-2.5 block text-[1.0625rem] font-medium leading-[1.3] text-green md:text-[1.25rem]">
                      <span className="link-u">{item.title}</span>
                    </span>
                  </span>
                  <ArrowRight className="text-gold-deep transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:translate-x-1" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {list.length > shown.length && (
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="btn btn-line text-green">
            {labels.more}
          </button>
        </div>
      )}
    </section>
  );
}
