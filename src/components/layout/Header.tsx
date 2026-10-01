"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { site } from "@/content/site";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";
import { Overlay } from "./Overlay";

type Props = { dict: Dictionary };

/** Scroll distance over which the large header becomes the compact one. */
const RANGE = 220;
/** Compact logo size as a fraction of the large one. */
const LOGO_MIN = 0.36;

const MotionLink = motion.create(Link);

/** Large-state geometry in px, measured from layout (transforms don't affect it). */
type Geo = {
  top: number; // bar offset from the top
  inset: number; // bar offset from the sides
  h: number; // bar height
  hc: number; // compact bar height
  sx: number; // horizontal scale that stretches the pill to full width
  logo: number; // logo diameter
  logoTop: number;
};

/**
 * One continuous header. The stylesheet lays out the large state; scroll
 * progress (locked 1:1 to scroll position, no spring) is mapped to transforms,
 * opacity and a corner radius on a handful of layers. Nothing here changes
 * layout or re-renders React while scrolling.
 */
export function Header({ dict }: Props) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { ui, nav } = dict;

  const headerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);

  const { scrollY } = useScroll();
  const p = useMotionValue(0);
  const geo = useMotionValue<Geo | null>(null);
  const toProgress = (y: number) => Math.min(1, Math.max(0, y / RANGE));
  useMotionValueEvent(scrollY, "change", (y) => p.set(toProgress(y)));

  useLayoutEffect(() => {
    const header = headerRef.current;
    const bg = bgRef.current;
    const logo = logoRef.current;
    const probe = probeRef.current;
    if (!header || !bg || !logo || !probe) return;
    // Computed styles give sub-pixel values (offset* would round to integers).
    const px = (el: Element, prop: "top" | "left" | "height" | "width") =>
      parseFloat(getComputedStyle(el)[prop]) || 0;
    const measure = () => {
      const width = header.getBoundingClientRect().width;
      const inset = px(bg, "left");
      geo.set({
        top: px(bg, "top"),
        inset,
        h: px(bg, "height"),
        hc: px(probe, "height"),
        sx: width / Math.max(1, width - 2 * inset),
        logo: px(logo, "width"),
        logoTop: px(logo, "top"),
      });
    };
    measure();
    p.set(toProgress(window.scrollY));
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    ro.observe(probe);
    return () => ro.disconnect();
  }, [geo, p]);

  // Every output is the identity at p = 0, so the server HTML already is the large state.
  const bgY = useGeo(p, geo, (v, g) => -g.top * v, 0);
  const bgSX = useGeo(p, geo, (v, g) => 1 + (g.sx - 1) * v, 1);
  const bgSY = useGeo(p, geo, (v, g) => 1 - (1 - g.hc / g.h) * v, 1);
  const bgRadius = useGeo(p, geo, (v, g) => (g.h / 2) * (1 - v), 9999);
  const solid = useTransform(p, [0, 1], [0, 1]);
  const ring = useTransform(p, [0, 1], [1, 0]);

  const rowY = useGeo(p, geo, (v, g) => -(g.top + (g.h - g.hc) / 2) * v, 0);
  const edgeL = useGeo(p, geo, (v, g) => -g.inset * v, 0);
  const edgeR = useGeo(p, geo, (v, g) => g.inset * v, 0);
  const navL = useGeo(p, geo, (v, g) => ((g.logo * (1 - LOGO_MIN)) / 2) * v, 0);
  const navR = useGeo(p, geo, (v, g) => (-(g.logo * (1 - LOGO_MIN)) / 2) * v, 0);

  const logoY = useGeo(p, geo, (v, g) => ((g.hc - g.logo * LOGO_MIN) / 2 - g.logoTop) * v, 0);
  const logoScale = useTransform(p, [0, 1], [1, LOGO_MIN]);

  return (
    <>
      <header ref={headerRef} className="medresa-header pointer-events-none fixed inset-x-0 top-0 z-50">
        <span ref={probeRef} className="header-probe" aria-hidden />
        <motion.div
          ref={bgRef}
          aria-hidden
          className="header-bg"
          style={{ y: bgY, scaleX: bgSX, scaleY: bgSY, borderRadius: bgRadius }}
        >
          <motion.span className="header-bg-solid" style={{ opacity: solid }} />
          <motion.span className="header-bg-ring" style={{ opacity: ring }} />
        </motion.div>

        <motion.div
          className="header-row pointer-events-auto grid grid-cols-[1fr_auto_1fr] items-center text-ink"
          style={{ y: rowY }}
        >
          <div className="flex items-center justify-between gap-6 pl-2 pr-4 xl:pl-3 xl:pr-8">
            <motion.div style={{ x: edgeL }}>
              <IconButton label={ui.search} onClick={() => setSearch(true)}>
                <SearchIcon />
              </IconButton>
            </motion.div>
            <motion.nav
              aria-label="Glavna navigacija, lijevo"
              className="hidden xl:block"
              style={{ x: navL }}
            >
              <ul className="flex items-center gap-8 2xl:gap-11">
                {nav.left.map((l) => (
                  <li key={l.href}>
                    <NavLink {...l} />
                  </li>
                ))}
              </ul>
            </motion.nav>
          </div>

          <div className="header-spacer" aria-hidden />

          <div className="flex items-center justify-between gap-6 pl-4 pr-2 xl:pl-8 xl:pr-3">
            <motion.nav aria-label="Glavna navigacija, desno" className="hidden xl:block" style={{ x: navR }}>
              <ul className="flex items-center gap-8 2xl:gap-11">
                {nav.right.map((l) => (
                  <li key={l.href}>
                    <NavLink {...l} />
                  </li>
                ))}
              </ul>
            </motion.nav>
            <motion.div className="ml-auto" style={{ x: edgeR }}>
              <IconButton label={ui.menu} onClick={() => setMenu(true)} aria-haspopup="dialog">
                <MenuIcon />
              </IconButton>
            </motion.div>
          </div>
        </motion.div>

        <MotionLink
          ref={logoRef}
          href="/"
          aria-label={`${site.name} – početna`}
          className="header-logo pointer-events-auto"
          style={{ y: logoY, scale: logoScale }}
        >
          <motion.span className="header-logo-halo" style={{ opacity: ring }} />
          <span className="header-logo-disc">
            <Image
              src={site.logo.src}
              alt=""
              width={site.logo.width}
              height={site.logo.height}
              priority
              sizes="(min-width: 768px) 176px, 128px"
              className="h-full w-full object-contain"
            />
          </span>
        </MotionLink>
      </header>

      <MenuOverlay open={menu} onClose={() => setMenu(false)} dict={dict} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} dict={dict} />
    </>
  );
}

/** Maps progress + measured geometry to a style value; `rest` is the large state. */
function useGeo<T>(
  p: MotionValue<number>,
  geo: MotionValue<Geo | null>,
  fn: (p: number, g: Geo) => T,
  rest: T,
) {
  return useTransform([p, geo] as MotionValue[], ([v, g]) => (g ? fn(v as number, g as Geo) : rest));
}

function IconButton({
  label,
  onClick,
  children,
  className = "",
  ...rest
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors duration-500 hover:bg-ink/[0.07] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="link-u whitespace-nowrap text-[0.9375rem] font-normal tracking-[0.01em]">
      {label}
    </Link>
  );
}

function MenuOverlay({ open, onClose, dict }: { open: boolean; onClose: () => void; dict: Dictionary }) {
  const { nav, ui } = dict;
  const { contact } = site;
  return (
    <Overlay open={open} onClose={onClose} label={ui.menu} className="menu-overlay">
      <div className="relative flex min-h-dvh flex-col bg-green-deep geo-dark">
        <div className="wrap flex h-[4.5rem] items-center justify-between pt-4">
          <span className="eyebrow text-gold-soft">{site.shortName}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={ui.closeMenu}
            className="grid size-12 place-items-center rounded-full border border-ivory/25 transition-colors hover:bg-ivory/10"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="wrap grid flex-1 content-center gap-12 py-10 md:grid-cols-3 md:gap-10 lg:py-16">
          {nav.groups.map((g, gi) => (
            <div key={g.title} className="menu-item" style={{ "--i": gi } as CSSProperties}>
              <p className="eyebrow mb-5 text-gold">{g.title}</p>
              <ul className="space-y-1">
                {g.items.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={onClose}
                      className="display block py-1.5 text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-normal transition-colors hover:text-gold-soft"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="wrap menu-item flex flex-col gap-6 border-t border-ivory/15 py-8 text-sm text-ivory/75 md:flex-row md:items-end md:justify-between"
          style={{ "--i": 4 } as CSSProperties}
        >
          <address className="not-italic leading-relaxed">
            {contact.address.join(", ")}
            <br />
            <a href={contact.phoneHref} className="link-u">
              {contact.phone}
            </a>
            {" · "}
            <a href={`mailto:${contact.email}`} className="link-u">
              {contact.email}
            </a>
          </address>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href={site.eMedresa} className="link-u" rel="noopener">
              e-medresa
            </a>
            <span className="text-ivory/50">
              {ui.language}: <b className="font-medium text-ivory">BS</b> · {ui.languageSoon}
            </span>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function SearchOverlay({ open, onClose, dict }: { open: boolean; onClose: () => void; dict: Dictionary }) {
  const [q, setQ] = useState("");
  const index = useMemo(
    () => [
      ...dict.nav.groups.flatMap((g) => g.items.map((i) => ({ ...i, kind: g.title }))),
      ...dict.news.items.map((n) => ({ label: n.title, href: n.href, kind: dict.news.heading })),
    ],
    [dict],
  );
  const needle = q.trim().toLocaleLowerCase("bs");
  const results = needle
    ? index.filter((i) => i.label.toLocaleLowerCase("bs").includes(needle))
    : index.slice(0, 6);

  const close = () => {
    setQ("");
    onClose();
  };

  return (
    <Overlay open={open} onClose={close} label={dict.ui.search} className="search-overlay">
      <div
        className="min-h-dvh bg-ivory/[0.97] text-ink backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="wrap max-w-4xl pt-6 md:pt-20">
          <div className="flex items-center gap-4 border-b border-ink/25 pb-4">
            <SearchIcon className="shrink-0 text-gold-deep" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={dict.ui.searchPlaceholder}
              aria-label={dict.ui.search}
              className="display min-w-0 flex-1 bg-transparent font-light text-[clamp(1.5rem,1rem+2vw,2.5rem)] outline-none placeholder:text-ink/35"
            />
            <button
              type="button"
              onClick={close}
              aria-label={dict.ui.close}
              className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-ink/[0.07]"
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="mt-8 divide-y divide-ink/10" aria-live="polite">
            {results.length === 0 && <li className="py-6 text-ink-soft">{dict.ui.searchEmpty}</li>}
            {results.map((r) => (
              <li key={r.href + r.label}>
                <Link
                  href={r.href}
                  onClick={close}
                  className="group flex items-baseline justify-between gap-6 py-4"
                >
                  <span className="h-sub transition-colors group-hover:text-gold-deep">{r.label}</span>
                  <span className="eyebrow hidden shrink-0 text-ink-soft sm:block">{r.kind}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Overlay>
  );
}
