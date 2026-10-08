"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionStyle } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { ShareIcon } from "@/components/ui/icons";

const ease = [0.16, 1, 0.3, 1] as const;
const once = { once: true, margin: "0px 0px -12% 0px" } as const;

/**
 * The rules as one document. A single gold guide runs beside the text and is
 * drawn down as the reader goes (no scroll is taken over; it only follows).
 * Each rule arrives once: its number a little further and slower than its
 * text, so the marker settles just after the words. Reduced motion: still.
 */
export function RulesList({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const { reduced } = useMotionProfile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 70%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <ol ref={ref} aria-label={label} className="relative list-none">
      {/* The guide: faint along its whole length, gold where the reader has been. */}
      <span aria-hidden className="kr-guide absolute bottom-3 top-3 w-px bg-gold/20" />
      <motion.span
        aria-hidden
        className="kr-guide absolute bottom-3 top-3 w-px origin-top bg-gold"
        style={reduced ? undefined : { scaleY }}
      />
      {children}
    </ol>
  );
}

/**
 * A highlighter pass over a rule, tied to the scroll: it starts once the rule
 * reaches a natural reading position and ends as its last line passes the
 * middle of the screen, moving exactly as fast as the reader scrolls and
 * running back when they scroll up. It follows the rendered lines with no
 * measuring: an unbroken inline background spans the line fragments as one
 * strip, so the fill crosses line one, then line two… (see .kr-mark). Only a
 * CSS variable changes per frame. Reduced motion: the rule is simply marked.
 */
function Marker({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotionProfile();
  const { scrollY } = useScroll();
  // The scroll range of this rule, in page pixels: measured on layout changes only.
  const from = useMotionValue(0);
  const to = useMotionValue(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const bottom = r.bottom + window.scrollY;
      const vh = window.innerHeight;
      // Begins as the rule reaches the lower third of the screen (or at the first
      // scroll, if the page opens with it already there); ends as its last line
      // passes just above the middle.
      const start = Math.max(0, top - vh * 0.66);
      from.set(start);
      to.set(Math.max(start + vh * 0.22, bottom - vh * 0.4));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [from, to]);
  const raw = useTransform([scrollY, from, to], ([y, a, b]: number[]) =>
    Math.min(1, Math.max(0, (y - a) / (b - a))),
  );
  // A light spring only smooths wheel/touch steps; it does not lag behind.
  const p = useSpring(raw, { stiffness: 420, damping: 48, mass: 0.35, restDelta: 0.0005 });
  const value = useTransform(p, (v) => Math.min(1, Math.max(0, v)).toFixed(4));
  return (
    <motion.span
      ref={ref}
      className="kr-mark"
      style={(reduced ? { "--kr-p": 1 } : { "--kr-p": value }) as unknown as MotionStyle}
    >
      {children}
    </motion.span>
  );
}

export function Rule({ n, children, mark = false }: { n: number; children: ReactNode; mark?: boolean }) {
  const { reduced } = useMotionProfile();
  const marker = String(n).padStart(2, "0");
  const enter = (y: number, delay: number, duration: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: once,
          transition: { duration, delay, ease },
        };
  return (
    <li className="kr-rule relative grid">
      <motion.span
        aria-hidden
        className="kr-num display tabular-nums text-gold-deep"
        {...enter(14, 0.08, 0.9)}
      >
        {marker}
      </motion.span>
      {/* A short gold tick joins the number to the guide. */}
      <span aria-hidden className="kr-tick absolute h-px bg-gold/70" />
      <motion.p className="kr-text hist-text font-light text-ink" {...enter(6, 0, 0.7)}>
        {mark ? <Marker>{children}</Marker> : children}
      </motion.p>
    </li>
  );
}

/**
 * „Podijeli“: the platform's share sheet where there is one (phones), otherwise
 * the page's address is copied, confirmed in a short line and announced.
 */
export function ShareButton({
  title,
  label,
  copied,
  failed,
}: {
  title: string;
  label: string;
  copied: string;
  failed: string;
}) {
  const [note, setNote] = useState("");
  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // The reader closed the sheet: nothing to do.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(copied);
    } catch {
      setNote(failed);
    }
    window.setTimeout(() => setNote(""), 2400);
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={share}
        aria-label={`${label}: ${title}`}
        className="group inline-flex min-h-11 touch-manipulation items-center gap-2.5 px-1 text-[0.9375rem] font-medium text-green transition-colors duration-200 hover:text-gold-deep"
      >
        <span className="link-u">{label}</span>
        <ShareIcon className="text-gold-deep transition-transform duration-[240ms] ease-[var(--ease-out-expo)] group-hover:-translate-y-[2px]" />
      </button>
      <span role="status" aria-live="polite" className="min-h-5 text-[0.8125rem] text-ink-soft">
        {note}
      </span>
    </div>
  );
}
