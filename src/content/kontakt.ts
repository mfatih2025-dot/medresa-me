import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Kontakt — the contact page's own content from medresa.me/kontakt, character
 * for character (the old site's footer, which that page also shows, is not
 * part of it: the new footer already carries the site-wide details).
 *
 * Links are derived only from what the source publishes: tel: from the printed
 * numbers, mailto: from the (decoded) addresses, and map links from the source
 * map's own query („Donji Miljes Tuzi“) or the printed address.
 *
 * Note: the Rožaje secretary's number here is „+382 69 520 750“; the Nastava
 * page of the same source prints it as „+382/69-5250-750“. This page's value is
 * used as published here.
 */
export type ContactField = {
  kind: "phone" | "email" | "hours";
  label: string;
  value: string;
  href?: string;
};

export type Person = { role: string; name: string; phone: string; href: string };

const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;
const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** The source page's map embed, unchanged. */
const MAP_QUERY = "Donji Miljes Tuzi";

const bs = {
  title: "Kontakt",
  heading: "Kontaktirajte nas",

  tuzi: {
    place: "Tuzi",
    address: "Donji Milješ, Tuzi, Podgorica, Montenegro",
    addressHref: maps(MAP_QUERY),
    fields: [
      { kind: "phone", label: "Broj telefona", value: "+382 20 513 363", href: tel("+382 20 513 363") },
      { kind: "hours", label: "Radno vrijeme", value: "Pon - Pet / 08:00 - 17:00" },
      { kind: "email", label: "Email", value: "medresapg@gmail.com", href: "mailto:medresapg@gmail.com" },
    ] satisfies ContactField[],
  },

  rozaje: {
    place: "Rožaje",
    heading: "Područno odjeljenje Rožaje",
    address: "Ulica Raduna Đukića 1, Rožaje",
    addressHref: maps("Ulica Raduna Đukića 1, Rožaje"),
    phoneLabel: "Broj telefona:",
    people: [
      { role: "Upravnik", name: "Redžep Murić", phone: "+382 67 546 307", href: tel("+382 67 546 307") },
      { role: "Sekretar", name: "Ramiz Luboder", phone: "+382 69 520 750", href: tel("+382 69 520 750") },
    ] satisfies Person[],
    fields: [
      { kind: "hours", label: "Radno vrijeme", value: "Pon - Pet / 08:00 - 17:00" },
      {
        kind: "email",
        label: "Email",
        value: "ramizluboder@gmail.com",
        href: "mailto:ramizluboder@gmail.com",
      },
    ] satisfies ContactField[],
  },

  map: {
    embed: `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&t=m&z=10&output=embed&iwloc=near`,
    title: "Mapa: Donji Milješ, Tuzi",
    open: { label: "Otvori u Google Maps", href: maps(MAP_QUERY) },
  },
  /** Read after a link that opens Google Maps (screen readers). */
  opensMaps: "(otvara Google Maps)",
} as const;

type KontaktContent = Localized<typeof bs>;
const [tPhone, tHours, tEmail] = bs.tuzi.fields;
const [rHours, rEmail] = bs.rozaje.fields;
const [boss, secretary] = bs.rozaje.people;

/** English: the medresa.me English page (Weglot), revised; numbers, e-mails, names and map from the master. */
const en: KontaktContent = {
  title: "Contact",
  heading: "Contact us",
  tuzi: {
    place: "Tuzi",
    address: "Donji Milješ, Tuzi, Podgorica, Montenegro",
    addressHref: bs.tuzi.addressHref,
    fields: [
      { ...tPhone, label: "Phone number" },
      { ...tHours, label: "Working hours", value: "Mon - Fri / 08:00 - 17:00" },
      { ...tEmail, label: "Email" },
    ],
  },
  rozaje: {
    place: "Rožaje",
    heading: "Regional Department Rožaje",
    address: "Raduna Đukića Street 1, Rožaje",
    addressHref: bs.rozaje.addressHref,
    phoneLabel: "Phone numbers:",
    people: [
      { ...boss, role: "Head" },
      { ...secretary, role: "Secretary" },
    ],
    fields: [
      { ...rHours, label: "Working hours", value: "Mon - Fri / 08:00 - 17:00" },
      { ...rEmail, label: "Email" },
    ],
  },
  map: {
    embed: bs.map.embed,
    title: "Map: Donji Milješ, Tuzi",
    open: { ...bs.map.open, label: "Open in Google Maps" },
  },
  opensMaps: "(opens Google Maps)",
};

/** Shqip: the medresa.me Albanian page (Weglot), revised; numbers, e-mails, names and map from the master. */
const sq: KontaktContent = {
  title: "Kontakti",
  heading: "Na kontaktoni",
  tuzi: {
    place: "Tuz",
    address: "Donji Milješ, Tuz, Podgoricë, Mali i Zi",
    addressHref: bs.tuzi.addressHref,
    fields: [
      { ...tPhone, label: "Numri i telefonit" },
      { ...tHours, label: "Orari i punës", value: "E hënë - E premte / 08:00 - 17:00" },
      { ...tEmail, label: "Email" },
    ],
  },
  rozaje: {
    place: "Rozhajë",
    heading: "Njësia rajonale në Rozhajë",
    address: "Rruga Raduna Đukića 1, Rožaje",
    addressHref: bs.rozaje.addressHref,
    phoneLabel: "Numrat e telefonit:",
    people: [
      { ...boss, role: "Drejtues" },
      { ...secretary, role: "Sekretar" },
    ],
    fields: [
      { ...rHours, label: "Orari i punës", value: "E hënë - E premte / 08:00 - 17:00" },
      { ...rEmail, label: "Email" },
    ],
  },
  map: {
    embed: bs.map.embed,
    title: "Harta: Donji Milješ, Tuz",
    open: { ...bs.map.open, label: "Hape në Google Maps" },
  },
  opensMaps: "(hap Google Maps)",
};

export const kontaktContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const kontakt = bs;
