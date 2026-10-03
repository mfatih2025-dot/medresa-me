import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/content";
import { site } from "@/content/site";

export function Footer({ dict }: { dict: Dictionary }) {
  const { footer, nav, ui } = dict;
  const { contact } = site;
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-green-deep text-ivory/80">
      <div aria-hidden className="geo pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen" />
      <div className="wrap relative grid gap-14 py-20 md:grid-cols-12 md:gap-x-8 md:gap-y-14 md:py-20 xl:gap-x-12 xl:py-24">
        <div className="md:col-span-12 xl:col-span-4">
          <Image src={site.logo.src} alt={site.name} width={96} height={96} className="size-24" />
          <p className="display mt-8 max-w-[16em] text-2xl font-light text-ivory md:max-w-[22em] xl:max-w-[14em] xl:text-[1.75rem] 2xl:text-3xl">
            {footer.tagline}
          </p>
        </div>

        <nav
          aria-label={footer.explore}
          className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-12 md:gap-8 xl:col-span-5 xl:gap-6 2xl:gap-10"
        >
          {nav.groups.map((g) => (
            <div key={g.title}>
              <p className="eyebrow mb-4 whitespace-nowrap text-gold">{g.title}</p>
              <ul>
                {g.items.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="link-u inline-flex min-h-10 items-center whitespace-nowrap text-[0.9375rem]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-8 md:col-span-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 xl:col-span-3 xl:block xl:space-y-8">
          <div>
            <p className="eyebrow mb-4 text-gold">{footer.contact}</p>
            <address className="space-y-1 text-[0.9375rem] not-italic leading-relaxed">
              <p>{contact.address.join(", ")}</p>
              <p>
                <a href={contact.phoneHref} className="link-u inline-flex min-h-11 items-center">
                  {contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`} className="link-u inline-flex min-h-11 items-center">
                  {contact.email}
                </a>
              </p>
              <p className="text-ivory/60">{contact.hours}</p>
              <p className="pt-3 text-ivory/60">
                {contact.branch.name}: {contact.branch.address}
              </p>
            </address>
          </div>
          <div>
            <p className="eyebrow mb-4 text-gold">{footer.follow}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem]">
              {site.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-u inline-flex min-h-11 items-center"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="wrap relative flex flex-col gap-3 border-t border-ivory/15 py-6 text-sm font-normal text-ivory/55 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {footer.rights}
        </p>
        <a
          href={site.eMedresa}
          className="link-u inline-flex min-h-11 items-center self-start"
          rel="noopener"
        >
          e-medresa
        </a>
        <span className="sr-only">{ui.language}: BS</span>
      </div>
    </footer>
  );
}
