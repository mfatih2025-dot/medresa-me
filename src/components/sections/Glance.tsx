"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/content";
import { useMotionProfile } from "@/hooks/useMotionProfile";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Medresa at a glance. Each fact reads in order — the number rises from behind a
 * mask, then its label, then the note — with a short stagger across the row. One
 * in-view trigger for the whole list; no count-up (these are facts to read).
 */
export function Glance({ dict }: { dict: Dictionary }) {
  const { glance } = dict;
  const { reduced } = useMotionProfile();
  // Reduced motion: final state at once, no staggered timings.
  const step = (d: number) => (reduced ? { duration: 0 } : { duration: 0.7, delay: d, ease });
  const show = { opacity: 1, transform: "translate3d(0px, 0px, 0px)" };
  const fact = {
    hide: { transform: "translate3d(0px, 105%, 0px)" },
    show: (i: number) => ({ transform: "translate3d(0px, 0%, 0px)", transition: step(i * 0.06) }),
  };
  const label = {
    hide: { opacity: 0, transform: "translate3d(0px, 6px, 0px)" },
    show: (i: number) => ({ ...show, transition: step(i * 0.06 + 0.1) }),
  };
  const note = {
    hide: { opacity: 0 },
    show: (i: number) => ({ opacity: 1, transition: step(i * 0.06 + 0.18) }),
  };
  const trigger = reduced
    ? { initial: false as const, animate: "show" }
    : { initial: "hide", whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };

  return (
    <section
      id="glance"
      aria-label={glance.label}
      className="relative border-t border-ink/10 bg-ivory pb-[var(--section-y)] pt-[calc(var(--section-y)*0.8)] lg:pt-[calc(var(--section-y)*0.55)]"
    >
      <div className="wrap">
        <motion.ul
          className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 md:gap-y-10 xl:grid-cols-5 xl:gap-x-0"
          {...trigger}
        >
          {glance.items.map((item, i) => (
            <li
              key={item.value}
              className={`relative xl:px-7 xl:first:pl-0 xl:last:pr-0 ${
                i === glance.items.length - 1 ? "col-span-2 md:col-span-1" : ""
              } ${i > 0 ? "xl:border-l xl:border-gold/40" : ""}`}
            >
              <span className="line-mask">
                <motion.p
                  custom={i}
                  variants={fact}
                  className="display whitespace-nowrap text-[clamp(1.75rem,1rem+1.6vw,2.5rem)] font-normal leading-none text-green"
                >
                  {item.value}
                </motion.p>
              </span>
              <motion.p custom={i} variants={label} className="mt-3 text-[0.9375rem] font-medium text-ink">
                {item.label}
              </motion.p>
              <motion.p custom={i} variants={note} className="mt-1 text-sm font-normal text-ink-soft">
                {item.note}
              </motion.p>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
