import type { CSSProperties, ReactNode } from "react";
import { kontakt as k, type ContactField, type Person } from "@/content/kontakt";
import { ArrowUpRight, ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { Depth, Emerge, Line, MapReveal, Path, Row } from "./KontaktMotion";

/*
 * Kontakt: two places, one Medresa.
 *
 *   Opening  „Kontaktirajte nas“, compact; information follows at once
 *   Tuzi     the primary location: the place name and its address on one plane,
 *            a directory (phone, hours, email) on the other; the phone number
 *            is the largest value on the page
 *   Rožaje   the regional department in the same structure, a step quieter;
 *            its two named contacts stay separate (role, person, phone)
 *   Map      the source's map, framed and revealed from its centre line, then
 *            left fully interactive; „Otvori u Google Maps“ beside it
 *
 * A gold line connects the places compositionally (not as a route): it runs
 * over each location's directory and falls, by reading, from Tuzi to Rožaje.
 * Every value that can act does: tel:, mailto:, and map links derived only
 * from the source's own map query or printed address. Icons are line icons
 * from the shared set, always beside a visible label.
 */

const edge = "calc(var(--gutter) + max(0px, (100vw - var(--max)) / 2))";

const icon = {
  phone: (
    <PhoneIcon
      width={20}
      height={20}
      className="transition-transform duration-200 ease-out group-hover:-rotate-12"
    />
  ),
  email: (
    <MailIcon
      width={20}
      height={20}
      className="transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:translate-x-px"
    />
  ),
  hours: <ClockIcon width={20} height={20} />,
} as const;

const valueSize: Record<ContactField["kind"], string> = {
  phone:
    "display text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] leading-[1.1] tracking-[-0.01em] text-green tabular-nums",
  email: "display text-[clamp(1.25rem,1.05rem+1vw,1.875rem)] leading-[1.2] tracking-[-0.005em] text-green",
  hours: "text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] leading-[1.3] text-ink tabular-nums",
};

/** The underline that answers hover and focus on a value. */
const answer =
  "underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-200 group-hover:decoration-gold group-focus-visible:decoration-gold";

/** One directory row: icon, label, value. A linked row is one tap target. */
function Field({ field, index, gold = false }: { field: ContactField; index: number; gold?: boolean }) {
  const body = (
    <span className="grid grid-cols-[1.75rem_1fr] items-start gap-x-3 py-4 md:grid-cols-[2rem_1fr] md:gap-x-4 md:py-5">
      <span aria-hidden className="mt-0.5 text-gold-deep">
        {icon[field.kind]}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] tracking-[0.03em] text-ink-soft md:text-[0.875rem]">
          {field.label}
        </span>
        <span className={`mt-1.5 block whitespace-nowrap ${valueSize[field.kind]}`}>
          <span className={field.href ? answer : ""}>{field.value}</span>
        </span>
      </span>
    </span>
  );
  return (
    <Row index={index} gold={gold}>
      {field.href ? (
        <a href={field.href} className="group block touch-manipulation focus-visible:outline-offset-4">
          {body}
        </a>
      ) : (
        body
      )}
    </Row>
  );
}

function AddressLink({ address, href }: { address: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-4 inline-flex min-h-11 touch-manipulation items-start gap-3 text-[1.0625rem] leading-[1.45] text-ink md:mt-6 md:text-[1.1875rem]"
    >
      <PinIcon aria-hidden width={20} height={20} className="mt-0.5 shrink-0 text-gold-deep" />
      <span>
        {/* The last word and the arrow stay together, so the arrow never wraps alone. */}
        <span className={answer}>{address.slice(0, address.lastIndexOf(" ") + 1)}</span>
        <span className="whitespace-nowrap">
          <span className={answer}>{address.slice(address.lastIndexOf(" ") + 1)}</span>
          <ArrowUpRight
            aria-hidden
            width={14}
            height={14}
            className="ml-1.5 inline-block -translate-y-px align-baseline text-gold-deep transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
        <span className="sr-only"> (otvara Google Maps)</span>
      </span>
    </a>
  );
}

function PersonRow({ person, index }: { person: Person; index: number }) {
  return (
    <Row index={index}>
      <a
        href={person.href}
        className="group grid touch-manipulation grid-cols-[1.75rem_1fr] items-start gap-x-3 py-4 md:grid-cols-[2rem_1fr] md:gap-x-4 md:py-5"
      >
        <span aria-hidden className="mt-0.5 text-gold-deep">
          {icon.phone}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.8125rem] tracking-[0.03em] text-ink-soft md:text-[0.875rem]">
            {person.role}
          </span>
          <span className="mt-0.5 block text-[1.0625rem] text-ink md:text-[1.125rem]">{person.name}</span>
          <span className="display mt-1.5 block whitespace-nowrap text-[clamp(1.5rem,1.25rem+1.2vw,2.25rem)] leading-[1.1] tracking-[-0.01em] text-green tabular-nums">
            <span className={answer}>{person.phone}</span>
          </span>
        </span>
      </a>
    </Row>
  );
}

function Place({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Depth px={10} className={className}>
      {children}
    </Depth>
  );
}

export function Kontakt() {
  const { tuzi, rozaje, map } = k;
  return (
    <article
      className="overflow-x-clip bg-paper pb-16 text-ink md:pb-24"
      style={{ "--edge": edge } as CSSProperties}
    >
      {/* ---------- Opening ---------- */}
      <header className="wrap pt-32 md:pt-40 lg:pt-44">
        <p className="eyebrow eyebrow-display text-gold-deep">
          <Emerge immediate>{k.title}</Emerge>
        </p>
        <h1 className="display mt-3 text-[clamp(2.5rem,1.6rem+4vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-green md:mt-4">
          <Emerge immediate delay={0.1}>
            {k.heading}
          </Emerge>
        </h1>
        <div className="relative mt-6 h-px md:mt-8">
          <Line
            origin="left"
            immediate
            delay={0.55}
            duration={0.9}
            className="top-0 left-[calc(-1*var(--edge))] w-[calc(var(--edge)+4rem)] md:w-[calc(var(--edge)+6rem)]"
          />
        </div>
      </header>

      {/* ---------- Tuzi: the primary location ---------- */}
      <section aria-labelledby="kon-tuzi" className="wrap mt-8 md:mt-12 lg:mt-14 lg:grid lg:grid-cols-12">
        <Place className="lg:col-span-4 lg:pr-8">
          <h2
            id="kon-tuzi"
            className="display text-[clamp(3rem,2rem+4.6vw,6.5rem)] leading-[0.9] tracking-[-0.035em] text-green"
          >
            <Emerge delay={0.2}>{tuzi.place}</Emerge>
          </h2>
          <AddressLink address={tuzi.address} href={tuzi.addressHref} />
        </Place>
        <div className="mt-6 border-b border-ink/12 lg:col-span-7 lg:col-start-6 lg:mt-2">
          {tuzi.fields.map((f, i) => (
            <Field key={f.label} field={f} index={i} gold={i === 0} />
          ))}
        </div>
      </section>

      {/* ---------- The connection: falls, by reading, from Tuzi to Rožaje ---------- */}
      <div aria-hidden className="wrap">
        <div className="relative h-16 md:h-24 lg:h-28">
          <Path className="top-0 bottom-0 left-0" />
        </div>
      </div>

      {/* ---------- Rožaje: the regional department ---------- */}
      <section aria-labelledby="kon-rozaje" className="wrap lg:grid lg:grid-cols-12">
        <Place className="lg:col-span-4 lg:pr-8">
          <h2 id="kon-rozaje" className="text-green">
            <span className="block text-[0.9375rem] tracking-[0.02em] text-ink-soft md:text-[1rem]">
              {rozaje.heading.replace(` ${rozaje.place}`, "")}
            </span>{" "}
            <span className="display mt-1 block text-[clamp(2.5rem,1.7rem+3.6vw,5rem)] leading-[0.92] tracking-[-0.03em]">
              <Emerge>{rozaje.place}</Emerge>
            </span>
          </h2>
          <AddressLink address={rozaje.address} href={rozaje.addressHref} />
        </Place>
        <div className="mt-6 border-b border-ink/12 lg:col-span-7 lg:col-start-6 lg:mt-7">
          <Row gold>
            <p className="pt-4 text-[0.8125rem] tracking-[0.03em] text-ink-soft md:pt-5 md:text-[0.875rem]">
              {rozaje.phoneLabel}
            </p>
          </Row>
          <div className="-mt-1">
            {rozaje.people.map((p, i) => (
              <PersonRow key={p.name} person={p} index={i + 1} />
            ))}
          </div>
          {rozaje.fields.map((f, i) => (
            <Field key={f.label} field={f} index={i + 3} />
          ))}
        </div>
      </section>

      {/* ---------- Map: the final destination ---------- */}
      <section aria-label={map.title} className="wrap mt-16 md:mt-24 lg:mt-28">
        <div className="flex items-end justify-between gap-4">
          <span aria-hidden className="hidden h-px flex-1 lg:block" />
          <a
            href={map.open.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 touch-manipulation items-center gap-2.5 text-[1rem] text-green md:text-[1.0625rem]"
          >
            <PinIcon aria-hidden width={18} height={18} className="text-gold-deep" />
            <span className={answer}>{map.open.label}</span>
            <ArrowUpRight
              aria-hidden
              width={14}
              height={14}
              className="text-gold-deep transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
        <div className="relative mx-[calc(-1*var(--edge))] mt-3 md:mx-0 md:mt-4">
          {/* The frame resolves first: gold over the top, and down the left side (wider screens). */}
          <Line origin="left" duration={1} className="-top-px left-0 right-0 z-10" />
          <Line
            origin="top"
            duration={0.9}
            delay={0.2}
            className="-left-px -top-px -bottom-px z-10 hidden md:block"
          />
          <MapReveal className="h-[min(72vh,30rem)] min-h-[22rem] border-y border-ink/12 bg-sand md:h-[32rem] md:border md:border-t-0 lg:h-[36rem]">
            <iframe
              src={map.embed}
              title={map.title}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-full w-full border-0"
            />
          </MapReveal>
        </div>
      </section>
    </article>
  );
}
