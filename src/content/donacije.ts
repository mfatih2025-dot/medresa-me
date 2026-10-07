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

export const donacije = {
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
} as const;
