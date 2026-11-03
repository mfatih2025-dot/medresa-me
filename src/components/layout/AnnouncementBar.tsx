"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/ui/icons";
import { useLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { pathFor, type PageId } from "@/i18n/routes";
import { RamadanGreeting } from "@/seasonal/RamadanGreeting";

export type Announcements = {
  /** Names the bar for assistive technology. */
  label: string;
  items: readonly { text: string; page: PageId }[];
};

/** How long each message stays, in ms. */
const HOLD = 5000;

/*
 * The announcement bar: a slim band of pearl glass above the header, in the page's
 * flow (so it scrolls away with the page and nothing is laid over the content).
 * The header and the homepage hero make room for it through --ann-h (globals.css).
 *
 * One message at a time, each a link to its page. Every 5 s the message leaves
 * upward as the next one rises in from below, both fading (.ann-msg). Only three
 * attributes change per step; nothing is laid out again. The rotation rests while
 * the bar is out of view, the tab is hidden, or a pointer or keyboard is on it.
 * Reduced motion: the messages change by a short fade, without movement.
 */
export function AnnouncementBar({ content }: { content: Record<Locale, Announcements> }) {
  const locale = useLocale();
  const { label, items } = content[locale];
  // The message shown, and the one leaving (none before the first change).
  const [{ active, prev }, setStep] = useState<{ active: number; prev: number | null }>({
    active: 0,
    prev: null,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar || items.length < 2) return;
    let seen = true;
    let held = false;
    let timer = 0;
    const run = () => {
      window.clearInterval(timer);
      if (!seen || held || document.hidden) return;
      timer = window.setInterval(() => {
        setStep(({ active: a }) => ({ active: (a + 1) % items.length, prev: a }));
      }, HOLD);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      run();
    });
    io.observe(bar);
    const hold = (on: boolean) => () => {
      held = on;
      run();
    };
    const enter = hold(true);
    const leave = hold(false);
    bar.addEventListener("pointerenter", enter);
    bar.addEventListener("pointerleave", leave);
    bar.addEventListener("focusin", enter);
    bar.addEventListener("focusout", leave);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      bar.removeEventListener("pointerenter", enter);
      bar.removeEventListener("pointerleave", leave);
      bar.removeEventListener("focusin", enter);
      bar.removeEventListener("focusout", leave);
      document.removeEventListener("visibilitychange", run);
    };
  }, [items.length]);

  return (
    <div ref={ref} role="region" aria-label={label} className="ann">
      <div className="ann-track">
        {items.map((item, i) => {
          const state = i === active ? "in" : i === prev ? "out" : "wait";
          return (
            <Link
              key={item.page}
              href={pathFor(item.page, locale)}
              data-state={state}
              aria-hidden={state !== "in"}
              tabIndex={state === "in" ? undefined : -1}
              className="ann-msg group"
            >
              <span className="ann-text">{item.text}</span>
              <ArrowRight aria-hidden className="ann-arrow" />
            </Link>
          );
        })}
      </div>
      <RamadanGreeting />
    </div>
  );
}
