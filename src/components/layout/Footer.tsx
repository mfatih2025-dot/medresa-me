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
      <div className="wrap relative grid gap-14 py-20 md:py-28 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <Image src={site.logo.src} alt={site.name} width={96} height={96} className="size-24" />
          <p className="display mt-8 max-w-[16em] text-2xl font-light text-ivory md:text-3xl">
            {footer.tagline}
          </p>
        </div>

        <nav aria-label={footer.explore} className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-4">
          {nav.groups.map((g) => (
            <div key={g.title}>
              <p className="eyebrow mb-4 text-gold">{g.title}</p>
              <ul className="space-y-1">
                {g.items.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-u inline-block py-1.5 text-[0.9375rem]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-8 lg:col-span-4">
          <div>
            <p className="eyebrow mb-4 text-gold">{footer.contact}</p>
            <address className="space-y-1 text-[0.9375rem] not-italic leading-relaxed">
              <p>{contact.address.join(", ")}</p>
              <p>
                <a href={contact.phoneHref} className="link-u">
                  {contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${contact.email}`} className="link-u">
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
                    className="link-u inline-block py-1.5"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="wrap relative flex flex-col gap-3 border-t border-ivory/15 py-6 text-sm text-ivory/55 md:flex-row md:justify-between">
        <p>
          © {year} {footer.rights}
        </p>
        <a href={site.eMedresa} className="link-u self-start" rel="noopener">
          e-medresa
        </a>
        <span className="sr-only">{ui.language}: BS</span>
      </div>
    </footer>
  );
}
