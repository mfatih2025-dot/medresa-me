import { href, pages, type PageSlug } from "./site";

type Link = { label: string; href: string };

/** Imagery lives in /public/images — swap a file or its `src` here, nothing else. */
export type Img = { src: string; alt: string; placeholder?: boolean; position?: string };

const img = (src: string, alt: string, position = "50% 50%", placeholder = false): Img => ({
  src: `/images/${src}.jpg`,
  alt,
  position,
  placeholder,
});

const link = (slug: PageSlug): Link => ({ label: pages[slug].title, href: href(slug) });

export const bs = {
  lang: "bs",
  meta: {
    title: "Medresa „Mehmed Fatih“ – Podgorica",
    description:
      "Zvanična stranica Medrese „Mehmed Fatih“ u Tuzima, Podgorica. Spoj islamskih vrijednosti, savremenog obrazovanja i odgoja za život.",
  },
  ui: {
    skip: "Preskoči na sadržaj",
    menu: "Meni",
    closeMenu: "Zatvori meni",
    search: "Pretraga",
    searchPlaceholder: "Pretražite stranice i vijesti",
    searchEmpty: "Nema rezultata.",
    close: "Zatvori",
    language: "Jezik",
    languageSoon: "Albanski i engleski uskoro",
    comingSoon: "Ova stranica je u izradi.",
    comingSoonBody: "Sadržaj Medrese „Mehmed Fatih“ uskoro stiže u novom izdanju.",
    backHome: "Nazad na početnu",
    scrollDown: "Pomaknite se prema dolje",
  },
  nav: {
    left: [link("historijat"), link("nastava"), link("oiu")],
    right: [link("alumni"), link("vijesti"), link("upis")],
    groups: [
      { title: "Medresa", items: [link("historijat"), link("misija"), link("uip"), link("oiu")] },
      {
        title: "Učenici i alumni",
        items: [link("nastava"), link("tiu"), link("alumni"), link("galerija"), link("kucni-red")],
      },
      {
        title: "Aktuelno",
        items: [link("vijesti"), link("upis"), link("donacije"), link("kontakt")],
      },
    ],
  },
  hero: {
    // Identity composition: small pre-title, dominant name (one entry per line), signature.
    pre: "MEDRESA",
    name: ["„MEHMED", "FATIH“"],
    signature: "Zvanična stranica",
    admissions: { kicker: "Prijemni 2026", label: "Rezultati prijemnog ispita", href: href("upis") },
    // Not rendered in the hero composition; kept for reuse elsewhere.
    eyebrow: ["Znanje", "Vrijednosti", "Odgovornost"],
    lead: "Spoj islamskih vrijednosti, savremenog obrazovanja i odgoja za život.",
    video: { label: "Pogledajte video", href: "https://www.youtube.com/@medresacg" },
    image: img(
      "hero-campus",
      "Zgrada Medrese „Mehmed Fatih“ u Tuzima sa minaretima i kupolom, u podnožju brda",
      "34% 50%",
    ),
  },
  glance: {
    label: "Medresa ukratko",
    items: [
      { value: "2008.", label: "Početak rada", note: "6. oktobra 2008." },
      { value: "800+", label: "Svršenika", note: "svršenih učenika i učenica" },
      { value: "6.000 m²", label: "Savremeni objekat", note: "sa svim pratećim sadržajima" },
      { value: "Internat", label: "200+ učenika", note: "dvije odvojene zgrade" },
      { value: "Biblioteka", label: "i amfiteatar", note: "hifz učionice, Book Caffe" },
    ],
  },
  story: {
    eyebrow: "Naša priča",
    heading: ["Više od škole.", "Zajednica za cijeli život."],
    body: [
      "Naša medresa je dom odgoja, učenja i služenja zajednici. Njeni učenici ne uče samo kako da znaju – već kako da budu.",
      "Prva savremena islamska srednjoškolska ustanova u Crnoj Gori, osnovana pod okriljem Mešihata Islamske zajednice u Crnoj Gori.",
    ],
    pull: "Medresa „Mehmed Fatih“ – gdje znanje postaje amanet.",
    cta: { label: "Saznajte više", href: href("historijat") },
    main: img("story-dome", "Kupola i zgrada Medrese uz cvjetajući oleander", "50% 55%"),
    detail: img("story-arch", "Ulaz s lukom i minaretom u dvorištu Medrese", "40% 50%"),
    facts: [
      { value: "360+", label: "učenika i učenica" },
      { value: "2015.", label: "akreditacija programa" },
    ],
    links: [link("misija"), link("uip")],
  },
  education: {
    eyebrow: "Obrazovanje",
    heading: ["Vjera i znanje,", "jedan put."],
    lead: "Obrazovni program temelji se na harmoničnom spoju islamskog i opšteobrazovnog kurikuluma, s ciljem formiranja cjelovite ličnosti – duhovno izgrađene, moralno usmjerene i akademski kompetentne.",
    pillars: [
      {
        title: "Islamski predmeti",
        text: "Duhovna svijest, islamski identitet i osjetljivost prema društvenim i etičkim pitanjima.",
        items: [
          "Kur’an i tedžvid",
          "Akaid",
          "Fikh",
          "Hadis",
          "Tefsir",
          "Arapski jezik",
          "Povijest islama",
          "Etika i ahlak",
        ],
      },
      {
        title: "Opšteobrazovni predmeti",
        text: "Svi obavezni predmeti propisani za srednje škole u Crnoj Gori.",
        items: [
          "Jezik i književnost",
          "Engleski, arapski i turski",
          "Matematika",
          "Biologija, fizika, hemija",
          "Istorija i geografija",
          "Informatika",
        ],
      },
    ],
    facts: [
      "Četverogodišnja srednja škola internatskog tipa",
      "Dvojezična nastava – bosanski i albanski",
      "Nastavni plan usklađen sa standardima Ministarstva prosvjete",
    ],
    cta: { label: "Nastava i predmeti", href: href("nastava") },
    image: img("education-arches", "Tri kamena luka na ulazu u Medresu", "50% 50%"),
    image2: img("education-classroom", "Učionica s drvenim klupama u toplom svjetlu", "50% 50%"),
  },
  life: {
    eyebrow: "Život u Medresi",
    heading: ["Dom, ne samo", "školska zgrada."],
    lead: "Internat, biblioteka, amfiteatar, sportska sala i vannastavne aktivnosti – svakodnevica u kojoj učenici rastu u ambijentu koji njeguje znanje, vjeru i etičke vrijednosti.",
    items: [
      {
        title: "Internat",
        text: "Dvije odvojene zgrade za učenike i učenice, s čitaonicama i prostorima za učenje i odmor.",
        image: img("life-dormitory", "Zgrada internata Medrese uz maslinu u zalasku sunca", "50% 50%", true),
      },
      {
        title: "Biblioteka",
        text: "Bogat fond islamske i opšte literature te posebne učionice za hifz.",
        image: img("life-library", "Svijetla čitaonica s velikim prozorima", "50% 50%", true),
      },
      {
        title: "Amfiteatar",
        text: "Za predavanja, prezentacije, radionice i javne nastupe učenika i gostiju.",
        image: img(
          "life-amphitheatre",
          "Prostor sa stepenastim sjedenjem i zajedničkim stolom",
          "50% 50%",
          true,
        ),
      },
      {
        title: "Sportska sala",
        text: "Košarka, odbojka, mali fudbal i druge timske igre.",
        image: img("life-sports", "Pogled iz zraka na sportski teren kampusa", "50% 50%", true),
      },
      {
        title: "Vannastavne aktivnosti",
        text: "Hor, recitatorske, dramske, literarne i debatne sekcije, hafiske grupe i humanitarne akcije.",
        image: img("life-calligraphy", "Kaligrafija na unutrašnjosti kupole", "50% 50%", true),
      },
    ],
    cta: { label: "Objekat i uslovi", href: href("oiu") },
  },
  generations: {
    eyebrow: "Generacije",
    words: ["Znanje.", "Karakter.", "Zajednica.", "Bolji ljudi."],
    lead: "Od 6. oktobra 2008. godine, generacije svršenika i svršenica nose Medresu dalje – na univerzitete u zemlji i svijetu i u svoje zajednice.",
    total: "800+",
    totalLabel: "svršenika i svršenica",
    numerals: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"],
    cta: { label: "Alumni", href: href("alumni") },
    image: img("generations-aerial", "Pogled iz zraka na kampus Medrese", "50% 50%", true),
  },
  news: {
    eyebrow: "Aktuelno",
    heading: "Vijesti",
    all: { label: "Pogledaj sve vijesti", href: href("vijesti") },
    notice: {
      label: "Upis",
      title: "Rezultati upisa u Medresu 2026/2027",
      href: href("upis"),
    },
    items: [
      {
        category: "Donacije",
        date: "2026-09-09",
        dateLabel: "9. septembar 2026.",
        title: "Zahvalnica Hazbiji Eroviću i njegovoj porodici za vrijednu donaciju",
        excerpt:
          "Za izuzetan doprinos radu Medrese i donaciju 12 klima-uređaja za učionice, direktor Amer Šukurica uručio je zahvalnicu porodici Erović.",
        href: "https://www.medresa.me/zahvalnica-hazbiji-erovicu-i-njegovoj-porodici-za-vrijednu-donaciju/",
        image: img("news-a", "Kameni portal Medrese s lukovima", "50% 50%", true),
      },
      {
        category: "Gosti",
        date: "2026-07-02",
        dateLabel: "2. juli 2026.",
        title: "Medresa „Mehmed Fatih“ ugostila polaznike Ljetne škole „Mala medresa“",
        excerpt:
          "Projekt Islamske zajednice Bošnjaka Sjeverne Amerike i Medrese „Osman ef. Redžović“ iz Visokog, pokrenut 2013. godine.",
        href: "https://www.medresa.me/medresa-mehmed-fatih-ugostila-polaznike-ljetne-skole-mala-medresa/",
        image: img("news-b", "Dvorište Medrese s maslinom i kamenim zgradama", "50% 50%", true),
      },
    ],
  },
  social: {
    eyebrow: "Zajednica",
    heading: "Medresa iz dana u dan.",
    body: "Trenuci iz učionica, internata i sa takmičenja – uskoro i ovdje.",
    soon: "Uskoro",
    channels: [
      { label: "Instagram", handle: "@medresacg", href: "https://www.instagram.com/medresacg/" },
      { label: "Facebook", handle: "medresacg", href: "https://www.facebook.com/medresacg" },
      { label: "YouTube", handle: "@medresacg", href: "https://www.youtube.com/@medresacg" },
    ],
  },
  admissions: {
    eyebrow: "Upis i prijemni",
    heading: ["Dobro došli", "u naš svijet učenja."],
    body: "Kandidat treba da ima završenu osnovnu školu, primjerno vladanje i interesovanje za opšte i islamske nauke. Upis uključuje provjeru osnovnog znanja, razgovor sa komisijom i predaju potrebne dokumentacije.",
    status: "Upis za školsku 2026/2027. godinu je završen.",
    primary: { label: "Rezultati upisa 26/27", href: href("upis") },
    secondary: { label: "Kontaktirajte nas", href: href("kontakt") },
  },
  closing: {
    line: ["Znanje je", "svjetlo koje", "ostaje."],
    image: img("closing-minaret", "Minaret Medrese na plavom nebu", "50% 40%"),
  },
  footer: {
    tagline: "Medresa „Mehmed Fatih“ – gdje znanje postaje amanet.",
    contact: "Kontakt",
    explore: "Medresa",
    follow: "Pratite nas",
    rights: "Medresa „Mehmed Fatih“ – Podgorica. Sva prava zadržana.",
  },
};

export type Dictionary = typeof bs;
