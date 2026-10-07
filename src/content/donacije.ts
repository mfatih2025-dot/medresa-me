import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Donacije — the text of medresa.me/donacije, word for word and in the
 * source's order. Only typography follows this site: „…“ quotation marks and
 * a dash bound to the word before it; the source's typed divider line
 * („———…–“) becomes the space between the two ways of paying.
 *
 * Payment data is copied character for character from the source and is
 * never reformatted (no spaces added to the IBAN or account numbers).
 *
 * One label is added: `abroad` names the international-transfer group, beside
 * the source's own „Uplate za područje Crne Gore“.
 *
 * The source shows the hadith twice: after the reasons, and again (with a
 * capitalised „Hadis“ and the full stop outside the quote) before the closing
 * line. The page sets it once, at the first place, as published there.
 *
 * Media: the page's one photograph (the minaret against the sky), unaltered.
 * The title banner's dome background is decorative and not used.
 */
export type Field = {
  label: string;
  value: string;
  /** A value a donor types into a banking app: offered with a copy control. */
  copy?: boolean;
};

export type Party = { heading: string; english: string; fields: readonly Field[] };

const bs = {
  title: "Donacije",
  /** The source heading „Donacije – Uložite u znanje, vjeru i budućnost“, as its two parts. */
  heading: { lead: "Donacije", rest: "Uložite u znanje, vjeru i budućnost" },

  intro: [
    "Medresa „Mehmed Fatih“ već više od decenije gradi generacije mladih ljudi odanih vjeri, znanju i odgovornosti. Kroz predani rad nastavnika, odgajatelja i cijele zajednice, nastojimo učenicima i učenicama pružiti ne samo obrazovanje, već i stabilno okruženje za duhovni, moralni i lični razvoj.",
    "Kako bismo nastavili ovu plemenitu misiju i unapređivali uslove života i rada u Medresi, otvoreni smo za pomoć i podršku dobrih ljudi – pojedinaca, porodica, firmi i institucija – koji žele učestvovati u izgradnji boljeg društva kroz obrazovanje.",
  ],

  image: {
    src: "/images/donacije/minaret.jpg",
    width: 2048,
    height: 1536,
    alt: "Minaret Medrese naspram vedrog neba, s pticama u letu",
  },

  support: {
    heading: "Vaša podrška može biti:",
    items: [
      "Jednokratna ili mjesečna novčana donacija",
      "Sponzorstvo/stipendiranje jednog učenika ili učenice",
      "Ulaganje u opremanje učionica, biblioteke ili internata",
      "Donacija udžbenika, školskog pribora ili tehničke opreme",
      "Vakufska pomoć u hrani, higijeni ili infrastrukturi",
    ],
  },

  why: {
    heading: "Zašto donirati Medresi?",
    // As on the source: the second and third end without a full stop.
    reasons: [
      "Ulažete direktno u obrazovanje budućih imama, vjeroučitelja, pedagoga, ljekara, umjetnika i odgovornih građana.",
      "Podržavate očuvanje islamskog identiteta i moralnih vrijednosti u Crnoj Gori",
      "Sudjelujete u jedinstvenom lancu dobra koji spaja znanje, vjeru i humanost",
    ],
  },

  hadith: {
    text: "„Kada čovjek umre, prestaju mu djela, osim u tri slučaja: trajna sadaka, korisno znanje, i dobro dijete koje moli za njega.“",
    source: "(hadis, Muslim)",
  },

  payment: {
    heading: "Podaci za uplatu donacija / uplata na račun:",
    lead: "U nastavku se nalaze podaci o žiro računu na koji možete izvršiti uplatu:",
    abroad: "Uplate iz inostranstva",
    parties: [
      {
        heading: "Posrednička banka",
        english: "(Intermediary bank)",
        fields: [
          { label: "SWIFT", value: "RZBAATWW", copy: true },
          { label: "Naziv", value: "Raiffeisen Zentralbank Oesterreich AG, Vienna" },
        ],
      },
      {
        heading: "Banka primaoca",
        english: "(Account with institution)",
        fields: [
          { label: "SWIFT", value: "CKBCMEPG", copy: true },
          { label: "Naziv", value: "Crnogorska komercijalna banka AD, Podgorica" },
          { label: "Identifikacioni broj", value: "000-55.062.301", copy: true },
        ],
      },
      {
        heading: "Primalac",
        english: "(Beneficiary)",
        fields: [
          { label: "IBAN", value: "ME25510000000021094921", copy: true },
          { label: "Naziv", value: "Mešihat Islamske zajednice u Crnoj Gori" },
          { label: "Adresa", value: "Gojka Radonjica 42, 81000 Podgorica, Crna Gora" },
        ],
      },
    ] satisfies Party[],
    domestic: {
      heading: "Uplate za područje Crne Gore",
      accounts: [
        { label: "Žiro račun Mešihata", value: "510-1076-13", copy: true },
        { label: "Žiro račun Medrese", value: "510-1752-22", copy: true },
      ] satisfies Field[],
    },
  },

  closing: "Uključite se – postanite dio dobra koje traje.",

  /** The copy control on payment values. */
  copy: { action: "Kopiraj", done: "Kopirano", announced: "kopiran" },
} as const;

type DonacijeContent = Localized<typeof bs>;

/**
 * A party's fields with translated labels; every value (SWIFT, names, numbers,
 * IBAN, address) is the Bosnian master's, never retyped.
 */
const relabel = (
  party: (typeof bs.payment.parties)[number],
  heading: string,
  english: string,
  labels: Record<string, string>,
) => ({
  heading,
  english,
  fields: party.fields.map((f) => ({ ...f, label: labels[f.label] ?? f.label })),
});
const [intermediary, bank, beneficiary] = bs.payment.parties;
const [mesihat, medresa] = bs.payment.domestic.accounts;

const enLabels = {
  SWIFT: "SWIFT",
  Naziv: "Name",
  "Identifikacioni broj": "Identification number",
  IBAN: "IBAN",
  Adresa: "Address",
};
const sqLabels = {
  SWIFT: "SWIFT",
  Naziv: "Emri",
  "Identifikacioni broj": "Numri i identifikimit",
  IBAN: "IBAN",
  Adresa: "Adresa",
};

/** English: the medresa.me English page (Weglot), revised; payment data copied from the master. */
const en: DonacijeContent = {
  title: "Donations",
  heading: { lead: "Donations", rest: "Invest in knowledge, faith and the future" },
  intro: [
    "For more than a decade, the Medresa “Mehmed Fatih” has been raising generations of young people devoted to faith, knowledge and responsibility. Through the dedicated work of teachers, tutors and the whole community, we strive to give our male and female students not only an education, but also a stable environment for spiritual, moral and personal growth.",
    "To continue this noble mission and to improve living and working conditions at the Medresa, we welcome the help and support of good people – individuals, families, companies and institutions – who wish to take part in building a better society through education.",
  ],
  image: { ...bs.image, alt: "A minaret of the Medresa against a clear sky, with birds in flight" },
  support: {
    heading: "Your support can be:",
    items: [
      "A one-time or monthly financial donation",
      "Sponsoring or funding a scholarship for one male or female student",
      "Investing in equipment for classrooms, the library or the boarding house",
      "Donating textbooks, school supplies or technical equipment",
      "Waqf support with food, hygiene or infrastructure",
    ],
  },
  why: {
    heading: "Why donate to the Medresa?",
    reasons: [
      "You invest directly in the education of future imams, religious teachers, educators, doctors, artists and responsible citizens.",
      "You support the preservation of Islamic identity and moral values in Montenegro",
      "You take part in a unique chain of good that brings together knowledge, faith and humanity",
    ],
  },
  hadith: {
    text: "“When a person dies, his deeds come to an end except in three cases: an ongoing charity, beneficial knowledge, and a righteous child who prays for him.”",
    source: "(Hadith, Muslim)",
  },
  payment: {
    heading: "Details for donations / payment to the account:",
    lead: "Below are the details of the account to which you can make a payment:",
    abroad: "Payments from abroad",
    parties: [
      relabel(intermediary, "Intermediary bank", "", enLabels),
      relabel(bank, "Beneficiary’s bank", "(Account with institution)", enLabels),
      relabel(beneficiary, "Beneficiary", "", enLabels),
    ],
    domestic: {
      heading: "Payments within Montenegro",
      accounts: [
        { ...mesihat, label: "Current account of the Meshihat" },
        { ...medresa, label: "Current account of the Medresa" },
      ],
    },
  },
  closing: "Get involved – become part of the good that lasts.",
  copy: { action: "Copy", done: "Copied", announced: "copied" },
};

/** Shqip: the medresa.me Albanian page (Weglot), revised; payment data copied from the master. */
const sq: DonacijeContent = {
  title: "Donacionet",
  heading: { lead: "Donacionet", rest: "Investoni në dije, besim dhe të ardhmen" },
  intro: [
    "Medreseja “Mehmed Fatih” prej më shumë se një dekade ndërton breza të rinjsh të përkushtuar ndaj besimit, dijes dhe përgjegjësisë. Përmes punës së përkushtuar të mësimdhënësve, edukatorëve dhe gjithë bashkësisë, përpiqemi t’u ofrojmë nxënësve dhe nxënëseve jo vetëm arsim, por edhe një mjedis të qëndrueshëm për zhvillim shpirtëror, moral dhe personal.",
    "Për të vazhduar këtë mision fisnik dhe për të përmirësuar kushtet e jetës dhe të punës në Medrese, jemi të hapur për ndihmën dhe mbështetjen e njerëzve të mirë – individëve, familjeve, firmave dhe institucioneve – që dëshirojnë të marrin pjesë në ndërtimin e një shoqërie më të mirë përmes arsimit.",
  ],
  image: { ...bs.image, alt: "Minare e Medresesë në qiellin e kthjellët, me zogj në fluturim" },
  support: {
    heading: "Mbështetja juaj mund të jetë:",
    items: [
      "Donacion financiar i njëhershëm ose mujor",
      "Sponsorizim/bursë për një nxënës ose nxënëse",
      "Investim në pajisjen e klasave, bibliotekës ose konviktit",
      "Dhurim tekstesh shkollore, mjetesh shkollore ose pajisjesh teknike",
      "Ndihmë vakëfi në ushqim, higjienë ose infrastrukturë",
    ],
  },
  why: {
    heading: "Pse të dhuroni për Medresenë?",
    reasons: [
      "Investoni drejtpërdrejt në arsimimin e imamëve, mësuesve të fesë, pedagogëve, mjekëve, artistëve dhe qytetarëve të përgjegjshëm të ardhshëm.",
      "Mbështetni ruajtjen e identitetit islam dhe të vlerave morale në Mal të Zi",
      "Merrni pjesë në një zinxhir unik të së mirës që bashkon dijen, besimin dhe humanizmin",
    ],
  },
  hadith: {
    text: "“Kur vdes njeriu, i ndërpriten veprat, përveç në tri raste: sadakaja e vazhdueshme, dija e dobishme dhe fëmija i mirë që lutet për të.”",
    source: "(hadith, Muslim)",
  },
  payment: {
    heading: "Të dhënat për pagesën e donacioneve / pagesë në llogari:",
    lead: "Më poshtë gjenden të dhënat e llogarisë në të cilën mund të kryeni pagesën:",
    abroad: "Pagesat nga jashtë",
    parties: [
      relabel(intermediary, "Banka ndërmjetëse", "(Intermediary bank)", sqLabels),
      relabel(bank, "Banka e përfituesit", "(Account with institution)", sqLabels),
      relabel(beneficiary, "Përfituesi", "(Beneficiary)", sqLabels),
    ],
    domestic: {
      heading: "Pagesat brenda Malit të Zi",
      accounts: [
        { ...mesihat, label: "Llogaria rrjedhëse e Mesihatit" },
        { ...medresa, label: "Llogaria rrjedhëse e Medresesë" },
      ],
    },
  },
  closing: "Përfshihuni – bëhuni pjesë e së mirës që zgjat.",
  copy: { action: "Kopjo", done: "U kopjua", announced: "u kopjua" },
};

export const donacijeContent: Record<Locale, typeof sq> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const donacije = bs;
