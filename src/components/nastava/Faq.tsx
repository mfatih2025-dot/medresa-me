"use client";

import { useId, useState } from "react";
import { keepWhole } from "./keepWhole";

/*
 * The questions as a quiet disclosure list: thin rules, the question set in
 * type, a hairline plus that becomes a minus. Each question is a button in its
 * heading (aria-expanded / aria-controls); its answer is a labelled region,
 * inert while closed. Opening animates the row height (grid 0fr → 1fr, ease-out,
 * 320ms); reduced motion opens at once.
 */

type Item = { q: string; a: readonly string[] };

export function Faq({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState<number[]>([]);
  const base = useId();
  const toggle = (i: number) =>
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  return (
    <div className="border-t border-ink/15">
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        const btn = `${base}-q${i}`;
        const panel = `${base}-a${i}`;
        return (
          <div key={item.q} className="border-b border-ink/15">
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => toggle(i)}
                className="group flex w-full touch-manipulation select-none items-start justify-between gap-6 py-6 text-left md:py-7"
              >
                <span className="hist-text text-[1.125rem] leading-[1.4] text-green transition-colors duration-200 md:text-[1.3125rem] md:group-hover:text-green-deep">
                  {keepWhole(item.q)}
                </span>
                {/* A hairline plus; its vertical stroke folds away when open. */}
                <span aria-hidden className="relative mt-[0.55em] block size-3.5 shrink-0 md:size-4">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gold-deep" />
                  <span
                    className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold-deep transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={btn}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`max-w-[38em] pb-7 pr-8 transition-opacity duration-300 motion-reduce:transition-none md:pb-8 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {item.a.map((p) => (
                    <p
                      key={p}
                      className="hist-text mt-4 text-[1rem] font-light leading-[1.75] text-ink first:mt-0 md:text-[1.0625rem]"
                    >
                      {keepWhole(p)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
