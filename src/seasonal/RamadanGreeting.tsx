"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { useLocale } from "@/i18n/client";
import { pathFor } from "@/i18n/routes";
import { ramadanContent } from "./config";

/*
 * Ramadan edition, in the announcement bar: the greeting with a small golden
 * crescent, held in place of the rotating messages (which keep running unseen
 * underneath, untouched). Hidden unless data-seasonal-theme="ramadan".
 */
export function RamadanGreeting() {
  const locale = useLocale();
  return (
    <Link href={pathFor(ramadanContent.page, locale)} className="rmd rmd-greeting ann-msg">
      <svg aria-hidden viewBox="0 0 24 24" className="rmd-greeting-moon">
        <defs>
          <linearGradient id="rmd-greeting-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9c98a" />
            <stop offset="1" stopColor="#b8873d" />
          </linearGradient>
        </defs>
        <path
          d="M15.6 3.2a9 9 0 1 0 5.2 13.9A7.6 7.6 0 0 1 15.6 3.2Z"
          fill="url(#rmd-greeting-gold)"
        />
        <path d="M18.5 4.2l.55 1.45 1.45.55-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55Z" fill="#c99a4f" />
      </svg>
      <span className="ann-text">{ramadanContent.greeting[locale]}</span>
      <ArrowRight aria-hidden className="ann-arrow" />
    </Link>
  );
}
