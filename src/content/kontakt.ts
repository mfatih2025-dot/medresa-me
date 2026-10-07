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

export const kontakt = {
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
} as const;
