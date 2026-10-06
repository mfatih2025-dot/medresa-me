"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { site } from "@/content/site";
import { localeNames, rememberLocale, type Locale } from "@/i18n/config";

/*
 * The first-visit language gateway: the opening identity moment of medresa.me.
 *
 * Shown only on the homepage, only to a visitor with no remembered language.
 * The decision is made before first paint by the inline script in the root
 * layout (html[data-gateway]); this markup is always server-rendered and kept
 * hidden by CSS otherwise, so a returning visitor never sees a flash of it and
 * a first-time visitor never sees a flash of the homepage.
 *
 * The intro (CSS only, from first paint; ~3s, see globals.css):
 *   1  a gold horizon draws outward from the centre
 *   2  the emblem opens in a circular aperture, settling inside it
 *   3  the composition lifts into place around it
 *   4  MEDRESA converges from wide tracking; „MEHMED FATIH“ rises from its masks
 *   5  the horizon contracts beneath the title, completing the composition
 *   6  Bosanski · Shqip · English resolve (interactive from the start)
 *
 * Choosing: the other languages dissolve, the horizon extends to the edges and
 * the cream surface parts along it — the emblem rising toward the header's,
 * the homepage revealed beneath. For Shqip and English the surface stays closed
 * while /sq or /en loads underneath (client navigation; the gateway lives in
 * the root layout, so it persists), then parts to reveal it. Reduced motion:
 * the final composition at once; choosing simply fades.
 */

const ORDER: Locale[] = ["bs", "sq", "en"];
const PRE = [..."Medresa"];
const NAME = ["„Mehmed", "Fatih“"];

type Phase = "idle" | "off" | "leave" | "open";

export function Gateway() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [choice, setChoice] = useState<Locale | null>(null);
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  /** Set while /sq or /en loads beneath the closed surface. */
  const pending = useRef(false);
  /** Elements made inert while the gateway is open; released as it parts. */
  const inerted = useRef<Element[]>([]);
  const release = useCallback(() => {
    inerted.current.forEach((n) => n.removeAttribute("inert"));
    inerted.current = [];
  }, []);

  // Active only if the pre-paint script decided so; otherwise remove ourselves.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (root.dataset.gateway !== "1" || !el) {
      // Not shown on this visit: remove the (hidden) markup after this frame.
      const id = requestAnimationFrame(() => setPhase("off"));
      return () => cancelAnimationFrame(id);
    }
    // Everything outside the gateway is inert while it is open.
    for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
      for (const sib of node.parentElement?.children ?? []) {
        if (sib !== node && !sib.hasAttribute("inert") && sib.tagName !== "SCRIPT") {
          sib.setAttribute("inert", "");
          inerted.current.push(sib);
        }
      }
    }
    el.focus({ preventScroll: true });
    return release;
  }, [release]);

  const choose = (locale: Locale) => {
    if (choice) return;
    rememberLocale(locale);
    setChoice(locale);
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The horizon extends to the viewport's edges: scale it by viewport / line width.
    const line = el?.querySelector<HTMLElement>(".gw-line");
    if (line) el?.style.setProperty("--gw-span", String(Math.ceil(window.innerWidth / line.offsetWidth) + 1));
    setPhase("leave");

    const url = new URL(window.location.href);
    if (url.searchParams.has("intro")) {
      url.searchParams.delete("intro");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    if (locale === "bs") open(reduce);
    // Shqip/English: load /sq or /en beneath the closed surface; open once it is there.
    else {
      pending.current = true;
      startNavigation(() => router.push(`/${locale}`));
      // Never stay closed: if the navigation is slow to settle, open anyway.
      window.setTimeout(() => {
        if (!pending.current) return;
        pending.current = false;
        open(reduce);
      }, 4000);
    }
  };

  const open = useCallback(
    (reduce: boolean) => {
      // The page becomes usable the moment the surface starts to part.
      release();
      window.setTimeout(() => setPhase("open"), reduce ? 0 : 260);
      window.setTimeout(
        () => {
          delete document.documentElement.dataset.gateway;
          setPhase("off");
        },
        reduce ? 200 : 880,
      );
    },
    [release],
  );

  // The destination page has rendered (the transition settled): part the surface.
  useEffect(() => {
    if (navigating || !pending.current) return;
    pending.current = false;
    open(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [navigating, open]);

  if (phase === "off") return null;

  return (
    <div
      ref={ref}
      className="gw"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gw-title"
      tabIndex={-1}
      data-phase={phase}
    >
      <div className="gw-top">
        <div className="gw-id">
          {/* The emblem in an aperture: the mask opens while the image settles inside it. */}
          <span className="gw-emblem">
            <Image
              src={site.logo.src}
              alt={site.name}
              width={site.logo.width}
              height={site.logo.height}
              // Same sizes as the header emblem: the browser reuses its (preloaded) file.
              sizes="(min-width: 768px) 135px, 92px"
              loading="lazy"
              className="gw-logo"
            />
          </span>
          <p id="gw-title" className="gw-title">
            <span className="gw-pre">
              <span className="sr-only">Medresa</span>
              {/* Letters converge from wide tracking into place, like type being set. */}
              <span aria-hidden>
                {PRE.map((c, i) => (
                  <span
                    key={i}
                    className="gw-ch"
                    style={{ "--d": i - (PRE.length - 1) / 2 } as CSSProperties}
                  >
                    {c}
                  </span>
                ))}
              </span>
            </span>
            <span className="gw-name">
              {NAME.map((w, i) => (
                <span key={w}>
                  {i > 0 && " "}
                  <span className="gw-mask">
                    <span className="gw-word" style={{ "--i": i } as CSSProperties}>
                      {w}
                    </span>
                  </span>
                </span>
              ))}
            </span>
          </p>
        </div>
      </div>

      <span aria-hidden className="gw-line" />

      <div className="gw-bottom">
        <div
          role="group"
          aria-label="Izaberite jezik · Zgjidhni gjuhën · Choose language"
          className="gw-langs"
        >
          {ORDER.map((l, i) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={choice === l}
              onClick={() => choose(l)}
              className="gw-lang"
              style={{ "--i": i } as CSSProperties}
            >
              {localeNames[l].native}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
