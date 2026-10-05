import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Dictionary } from "@/content";
import { site } from "@/content/site";
import { FooterLines } from "./FooterLines";

/** A hairline that draws in as part of the footer's drawing (delay in seconds). */
function Rule({ at, className = "" }: { at: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`fl-rule block h-px bg-ivory/[0.14] ${className}`}
      style={{ "--t": `${at}s` } as CSSProperties}
    />
  );
}

type Ext = { label: string; href: string };

/** External links (social profiles, e-medresa), in a row. */
function Links({ items, extra, className = "" }: { items: readonly Ext[]; extra?: Ext; className?: string }) {
  return (
    <ul className={`-ml-1 flex flex-wrap gap-x-5 ${className}`}>
      {[...items, ...(extra ? [extra] : [])].map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center px-1 transition-colors md:min-h-11 duration-200 hover:text-ivory"
          >
            <span className="link-u">{s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const eyebrow = "eyebrow text-[0.6875rem] text-gold md:text-xs";

/**
 * The closing composition: identity, contact and a short index over a fragment
 * of a large mihrab drawing; below, the Fund's acknowledgement and the
 * legal line. Phones: one compact column ruled by hairlines. Tablet: identity
 * across, contact and index side by side. Desktop: a 12-column editorial grid
 * (5 · 4 · 3) whose lower band continues the same columns.
 */
export function Footer({ dict }: { dict: Dictionary }) {
  const { footer } = dict;
  const { contact } = site;
  const { support } = footer;
  const year = new Date().getFullYear();
  const [days, hours] = contact.hours.split(" / ");

  return (
    <footer className="relative isolate overflow-clip bg-green-deep text-ivory">
      <FooterLines />

      <div className="wrap relative pb-1.5 pt-6 md:pb-6 md:pt-16 lg:pt-20 xl:pt-24">
        <div className="grid gap-y-3.5 md:grid-cols-2 md:gap-x-10 md:gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Identity */}
          <div className="flex items-center gap-3.5 md:col-span-2 md:gap-6 lg:col-span-4 lg:block">
            <Image
              src={site.logo.src}
              alt={site.name}
              width={site.logo.width}
              height={site.logo.height}
              sizes="(min-width: 1024px) 88px, (min-width: 768px) 72px, 48px"
              className="size-12 shrink-0 md:size-[4.5rem] lg:size-[5.5rem]"
            />
            <p className="display max-w-[16em] text-[1.0625rem] font-light leading-[1.25] text-ivory [text-wrap:balance] min-[400px]:text-[1.1875rem] md:text-[1.625rem] lg:mt-8 lg:max-w-[12em] lg:text-[clamp(1.875rem,1.1rem+1.2vw,2.5rem)] lg:leading-[1.15]">
              {footer.tagline}
            </p>
            <div className="hidden lg:mt-10 lg:block">
              <p className={eyebrow}>{footer.follow}</p>
              <Links items={site.social} className="mt-2 text-[0.9375rem] text-ivory/80" />
            </div>
          </div>

          <Rule at={0.5} className="md:col-span-2 lg:hidden" />

          {/* Contact */}
          <div className="lg:col-span-4 lg:pt-2">
            <p className={eyebrow}>{footer.contact}</p>
            <address className="mt-1.5 not-italic md:mt-4">
              <a
                href={contact.phoneHref}
                className="display inline-flex min-h-10 items-center whitespace-nowrap text-[1.3125rem] font-normal tracking-[0.01em] text-ivory md:text-[1.5rem]"
              >
                <span className="link-u">{contact.phone}</span>
              </a>
              <br />
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex min-h-9 items-center text-[1rem] text-ivory/90 md:min-h-11 md:text-[1.0625rem]"
              >
                <span className="link-u">{contact.email}</span>
              </a>
              <div className="mt-1 grid grid-cols-2 gap-x-6 text-[0.8125rem] leading-[1.5] text-ivory/70 md:mt-4 md:text-[0.9375rem]">
                <p>
                  {contact.address.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </p>
                <p>
                  <span className="block">{days}</span>
                  <span className="block tabular-nums">{hours}</span>
                </p>
              </div>
              <div className="mt-3 md:mt-7">
                <Rule at={1.1} className="hidden !bg-ivory/[0.1] md:block" />
                <p className={`${eyebrow} text-[0.625rem] text-gold/85 md:mt-6 md:text-xs`}>
                  {contact.branch.name}
                </p>
                <p className="mt-0.5 text-[0.875rem] text-ivory/80 md:mt-2 md:text-[0.9375rem]">
                  {contact.branch.address}
                </p>
              </div>
            </address>
          </div>

          <Rule at={0.9} className="md:hidden" />

          {/* Index */}
          <nav aria-label={footer.explore} className="lg:col-span-4 lg:pt-2">
            <p className={eyebrow}>{footer.explore}</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-6 md:mt-3 lg:grid-cols-[auto_auto] lg:justify-start lg:gap-x-8">
              {footer.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-8 items-center whitespace-nowrap text-[0.9375rem] md:min-h-10 text-ivory/80 transition-colors duration-200 hover:text-ivory"
                  >
                    <span className="link-u">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* The Fund's acknowledgement: one small institutional note, linked to the Fund. */}
        <Rule at={0.3} className="mt-4 md:mt-12 lg:mt-16" />
        <a
          href={support.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group grid grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-x-3.5 py-3 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-x-8 md:py-6 lg:grid-cols-12 lg:gap-x-12 lg:py-7"
        >
          <Image
            src={support.logo.src}
            alt={support.logo.alt}
            width={support.logo.width}
            height={support.logo.height}
            unoptimized
            className="h-auto w-full lg:col-span-4 lg:w-[8.5rem]"
          />
          <span className="block lg:col-span-8">
            <span className={`${eyebrow} block text-[0.625rem] text-gold/85 md:text-xs`}>
              {support.label}
            </span>
            <span className="mt-1 block text-[0.6875rem] leading-[1.45] text-ivory/55 transition-colors duration-200 group-hover:text-ivory/75 md:mt-2 md:text-[0.8125rem] md:leading-[1.6] lg:max-w-[46em]">
              {support.note}
            </span>
          </span>
        </a>

        {/* Legal line */}
        <Rule at={0.7} className="!bg-ivory/[0.1]" />
        <div className="flex flex-col-reverse pt-1 text-[0.75rem] text-ivory/55 md:gap-1 md:pt-4 md:text-[0.8125rem] lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <p className="pb-1.5 md:py-2">
            © {year} {footer.rights}
          </p>
          <Links
            items={site.social}
            className="text-ivory/55 lg:hidden"
            extra={{ label: "e-medresa", href: site.eMedresa }}
          />
          <Links
            items={[{ label: "e-medresa", href: site.eMedresa }]}
            className="hidden text-ivory/55 lg:flex"
          />
        </div>
        <span className="sr-only">{dict.ui.language}: BS</span>
      </div>
    </footer>
  );
}
