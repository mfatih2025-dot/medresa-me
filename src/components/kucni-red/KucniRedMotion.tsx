"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
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

export function Rule({ n, children }: { n: number; children: ReactNode }) {
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
        {children}
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
