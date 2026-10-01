"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useMemo, useState, type CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { site } from "@/content/site";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/icons";
import { Overlay } from "./Overlay";

type Props = { dict: Dictionary };

/**
 * One continuous header. A single scroll progress value `--p` (0 → 1) drives
 * bar inset, height, radius, translucency, logo scale and the spacer that
 * keeps the navigation symmetrical around the logo. Everything is a calc() of
 * that variable, so the large signature state *becomes* the compact one.
 */
export function Header({ dict }: Props) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { reduced } = useMotionProfile();
  const { scrollY } = useScroll();
  const raw = useTransform(scrollY, [0, 220], [0, 1], { clamp: true });
  const spring = useSpring(raw, { stiffness: 260, damping: 40, mass: 0.4 });
  const progress: MotionValue<number> = reduced ? raw : spring;

  const style = { "--p": progress } as unknown as CSSProperties;
  const { ui, nav } = dict;

  return (
    <>
      <motion.header className="medresa-header pointer-events-none fixed inset-x-0 top-0 z-50" style={style}>
        <div className="header-bar pointer-events-auto grid grid-cols-[1fr_auto_1fr] items-center text-ink">
          <div className="flex items-center justify-between gap-6 pl-2 pr-4 xl:pl-3 xl:pr-8">
            <IconButton label={ui.search} onClick={() => setSearch(true)}>
              <SearchIcon />
            </IconButton>
            <nav aria-label="Glavna navigacija, lijevo" className="hidden xl:block">
              <ul className="flex items-center gap-8 2xl:gap-11">
                {nav.left.map((l) => (
                  <li key={l.href}>
                    <NavLink {...l} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="header-spacer" aria-hidden />

          <div className="flex items-center justify-between gap-6 pl-4 pr-2 xl:pl-8 xl:pr-3">
            <nav aria-label="Glavna navigacija, desno" className="hidden xl:block">
              <ul className="flex items-center gap-8 2xl:gap-11">
                {nav.right.map((l) => (
                  <li key={l.href}>
                    <NavLink {...l} />
                  </li>
                ))}
              </ul>
            </nav>
            <IconButton
              label={ui.menu}
              onClick={() => setMenu(true)}
              className="ml-auto"
              aria-haspopup="dialog"
            >
              <MenuIcon />
            </IconButton>
          </div>
        </div>

        <Link href="/" aria-label={`${site.name} – početna`} className="header-logo pointer-events-auto">
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
        </Link>
      </motion.header>

      <MenuOverlay open={menu} onClose={() => setMenu(false)} dict={dict} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} dict={dict} />
    </>
  );
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
    <Link href={href} className="link-u whitespace-nowrap text-[0.9375rem] tracking-[0.01em]">
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
                      className="display block py-1.5 text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] transition-colors hover:text-gold-soft"
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
              className="display min-w-0 flex-1 bg-transparent text-[clamp(1.5rem,1rem+2vw,2.5rem)] outline-none placeholder:text-ink/35"
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
