"use client";

import { useEffect, useRef, useState } from "react";

/*
 * A payment value with a quiet copy control.
 *
 * The value is shown exactly as published and can also be selected whole with
 * one tap (user-select: all). The control is a small text button with a 44px
 * tap area; on copy its label cross-fades to „Kopirano“ for 1.8s (opacity only,
 * 150ms) and a polite live region announces it. Clipboard API first; a hidden
 * textarea + execCommand where the API is unavailable.
 */

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function CopyValue({
  value,
  label,
  className = "",
  valueClassName = "",
}: {
  value: string;
  /** What the value is (for the button's accessible name). */
  label: string;
  className?: string;
  valueClassName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await writeClipboard(value))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <span translate="no" className={`min-w-0 select-all tabular-nums ${valueClassName}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Kopiraj ${label}: ${value}`}
        className="-my-2.5 -mr-2 grid min-h-11 min-w-11 shrink-0 touch-manipulation select-none place-items-center rounded-sm px-2 text-[0.8125rem] font-medium tracking-[0.03em] text-gold-deep transition-colors duration-150 hover:text-green md:text-[0.875rem]"
      >
        {/* Both labels share one cell, so the button never changes width. */}
        <span
          aria-hidden
          className={`col-start-1 row-start-1 transition-opacity duration-150 ease-out motion-reduce:transition-none ${copied ? "opacity-0" : "opacity-100"}`}
        >
          Kopiraj
        </span>
        <span
          aria-hidden
          className={`col-start-1 row-start-1 text-green transition-opacity duration-150 ease-out motion-reduce:transition-none ${copied ? "opacity-100" : "opacity-0"}`}
        >
          Kopirano
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label} kopiran` : ""}
      </span>
    </div>
  );
}
