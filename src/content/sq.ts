import { bs, genFor, linkFor, newsFallbacks, type Dictionary, type Img } from "./bs";
import { homeNews } from "./vijesti/home";
import { href as pageHref, type PageSlug } from "./site";

/**
 * Shqip. Sources: the Albanian pages of medresa.me (Weglot) where they exist
 * and read correctly — the Director's letter, the tagline („ku dija bëhet
 * amanet“), the Fund's note — revised for consistent terminology („Medreseja“,
 * „nxënës/nxënëse“ for secondary-school students, „Bashkësia Islame“); the rest
 * translated from the Bosnian master. Names, numbers and the identity lockup
 * (MEDRESA · MEHMED FATIH) are unchanged.
 */
const link = linkFor("sq");
const href = (slug: PageSlug) => pageHref(slug, "sq");
const alt = (image: Img, text: string): Img => ({ ...image, alt: text });
const gen = genFor(
  "sq",
  (numeral, n, years) =>
    `Tabloja e gjeneratës ${numeral} të ${n >= 5 ? "maturantëve dhe maturanteve" : "maturantëve"} të Medresesë “Mehmed Fatih”, ${years}.`,
);

export const sq: Dictionary = {
  lang: "sq",
  meta: {
    title: "Medreseja “Mehmed Fatih” – Mali i Zi",
    description:
      "Faqja zyrtare e Medresesë “Mehmed Fatih” në Mal të Zi. Ndërthurje e vlerave islame, arsimit bashkëkohor dhe edukimit për jetë.",
  },
  ui: {
    skip: "Kalo te përmbajtja",
    menu: "Menyja",
    closeMenu: "Mbyll menynë",
    search: "Kërko",
    searchPlaceholder: "Kërkoni faqe dhe lajme",
    searchEmpty: "Nuk ka rezultate.",
    close: "Mbyll",
    language: "Gjuha",
    languageSoon: "Shqip dhe anglisht së shpejti",
    comingSoon: "Kjo faqe është në përgatitje.",
    comingSoonBody: "Përmbajtja e Medresesë “Mehmed Fatih” vjen së shpejti në një botim të ri.",
    backHome: "Kthehu në ballinë",
    scrollDown: "Lëvizni poshtë",
    navLeft: "Navigimi kryesor, majtas",
    navRight: "Navigimi kryesor, djathtas",
    home: "ballina",
    notFound: "Faqja nuk u gjet.",
    playGenerations: "Lësho lëvizjen e gjeneratave",
    pauseGenerations: "Ndal lëvizjen e gjeneratave",
    generation: "Gjenerata",
    prevPost: "Postimi i mëparshëm",
    nextPost: "Postimi i radhës",
    intl: "sq-AL",
  },
  contact: {
    address: ["Donji Milješ, Tuz", "Mali i Zi"],
    hours: "E hënë – E premte / 08:00 – 17:00",
    branch: { name: "Njësia rajonale në Rozhajë", address: "Rruga Raduna Đukića 1, Rožaje" },
  },
  nav: {
    left: [link("historijat"), link("nastava"), link("oiu")],
    right: [link("alumni"), link("vijesti"), link("upis")],
    groups: [
      { title: "Medreseja", items: [link("historijat"), link("misija"), link("uip"), link("oiu")] },
      {
        title: "Nxënësit dhe alumni",
        items: [link("nastava"), link("tiu"), link("alumni"), link("galerija"), link("kucni-red")],
      },
      {
        title: "Aktuale",
        items: [link("vijesti"), link("upis"), link("donacije"), link("kontakt")],
      },
    ],
  },
  hero: {
    pre: bs.hero.pre,
    name: bs.hero.name,
    signature: "Faqja zyrtare",
    admissions: {
      kicker: "Provimi pranues 2026",
      label: "Rezultatet e provimit pranues",
      href: href("upis"),
    },
    eyebrow: ["Dija", "Vlerat", "Përgjegjësia"],
    lead: "Ndërthurje e vlerave islame, arsimit bashkëkohor dhe edukimit për jetë.",
    video: { label: "Shikoni videon", href: bs.hero.video.href },
    image: alt(
      bs.hero.image,
      "Ndërtesa e Medresesë “Mehmed Fatih” në Tuz me minaret dhe kupolën, në rrëzë të kodrës",
    ),
  },
  glance: {
    label: "Medreseja shkurt",
    items: [
      { value: "2008", label: "Fillimi i punës", note: "6 tetor 2008" },
      { value: "800+", label: "Të diplomuar", note: "maturantë dhe maturante" },
      { value: "6.000 m²", label: "Objekt bashkëkohor", note: "me të gjitha përmbajtjet përcjellëse" },
      { value: "Konvikti", label: "200+ nxënës", note: "dy ndërtesa të veçanta" },
      { value: "Biblioteka", label: "dhe amfiteatri", note: "klasat e hifzit, Book Caffe" },
    ],
  },
  story: {
    eyebrow: "Historia jonë",
    heading: ["Më shumë se shkollë.", "Bashkësi për gjithë jetën."],
    body: [
      "Medreseja jonë është shtëpi e edukimit, e të mësuarit dhe e shërbimit ndaj bashkësisë. Nxënësit e saj nuk mësojnë vetëm si të dinë – por edhe si të jenë.",
      "Institucioni i parë bashkëkohor islam i arsimit të mesëm në Mal të Zi, i themeluar nën kujdesin e Mesihatit të Bashkësisë Islame në Mal të Zi.",
    ],
    pull: "Medreseja “Mehmed Fatih” – ku dija bëhet amanet.",
    cta: { label: "Mësoni më shumë", href: href("historijat") },
    main: alt(bs.story.main, "Kupola dhe ndërtesa e Medresesë pranë një oleandri në lulëzim"),
    detail: alt(bs.story.detail, "Hyrje me hark dhe minare në oborrin e Medresesë"),
    facts: [
      { value: "360+", label: "nxënës dhe nxënëse" },
      { value: "2015", label: "akreditimi i programit" },
    ],
    links: [link("misija"), link("uip")],
  },
  education: {
    eyebrow: "Arsimi",
    heading: ["Besimi dhe dija,", "një rrugë."],
    lead: "Programi arsimor mbështetet në një ndërthurje harmonike të kurrikulës islame dhe asaj të arsimit të përgjithshëm, me qëllim formimin e një personaliteti të plotë – të ndërtuar shpirtërisht, të orientuar moralisht dhe të aftë akademikisht.",
    pillars: [
      {
        title: "Lëndët islame",
        text: "Vetëdija shpirtërore, identiteti islam dhe ndjeshmëria ndaj çështjeve shoqërore dhe etike.",
        items: [
          "Kurani dhe texhvidi",
          "Akaidi",
          "Fikhu",
          "Hadithi",
          "Tefsiri",
          "Gjuha arabe",
          "Historia e Islamit",
          "Etika dhe ahlaku",
        ],
      },
      {
        title: "Lëndët e arsimit të përgjithshëm",
        text: "Të gjitha lëndët e detyrueshme të përcaktuara për shkollat e mesme në Mal të Zi.",
        items: [
          "Gjuha dhe letërsia",
          "Anglisht, arabisht dhe turqisht",
          "Matematika",
          "Biologjia, fizika, kimia",
          "Historia dhe gjeografia",
          "Informatika",
        ],
      },
    ],
    facts: [
      "Shkollë e mesme katërvjeçare me konvikt",
      "Mësim dygjuhësh – boshnjakisht dhe shqip",
      "Plan mësimor në përputhje me standardet e Ministrisë së Arsimit",
    ],
    cta: { label: "Mësimi dhe lëndët", href: href("nastava") },
    image: alt(bs.education.image, "Tre harqe guri në hyrje të Medresesë"),
    image2: alt(bs.education.image2, "Klasë me banka druri në dritë të ngrohtë"),
  },
  life: {
    eyebrow: "Jeta në Medrese",
    heading: ["Shtëpi, jo vetëm", "ndërtesë shkollore."],
    lead: "Konvikti, biblioteka, amfiteatri, salla sportive dhe aktivitetet jashtëmësimore – përditshmëri në të cilën nxënësit rriten në një mjedis që kultivon dijen, besimin dhe vlerat etike.",
    items: [
      {
        title: "Konvikti",
        text: "Dy ndërtesa të veçanta për nxënës dhe nxënëse, me salla leximi dhe hapësira për mësim dhe pushim.",
        image: alt(
          bs.life.items[0].image,
          "Ndërtesa e konviktit të Medresesë pranë një ulliri në perëndim të diellit",
        ),
      },
      {
        title: "Biblioteka",
        text: "Fond i pasur i literaturës islame dhe të përgjithshme, si dhe klasa të veçanta për hifz.",
        image: alt(bs.life.items[1].image, "Sallë leximi e ndriçuar me dritare të mëdha"),
      },
      {
        title: "Amfiteatri",
        text: "Për ligjërata, prezantime, punëtori dhe paraqitje publike të nxënësve dhe mysafirëve.",
        image: alt(bs.life.items[2].image, "Hapësirë me ulëse shkallëzuese dhe një tavolinë të përbashkët"),
      },
      {
        title: "Salla sportive",
        text: "Basketboll, volejboll, futboll i vogël dhe lojëra të tjera ekipore.",
        image: alt(bs.life.items[3].image, "Pamje nga ajri e fushës sportive të kampusit"),
      },
      {
        title: "Aktivitetet jashtëmësimore",
        text: "Kori, seksionet e recitimit, dramës, letërsisë dhe debatit, grupet e hafizëve dhe aksionet humanitare.",
        image: alt(bs.life.items[4].image, "Kaligrafi në brendësinë e një kupole"),
      },
    ],
    cta: { label: "Objekti dhe kushtet", href: href("oiu") },
    stack: {
      heading: "Më shumë se mësim.",
      text: "Mësimi, konvikti, biblioteka, sporti dhe shoqërimi – përditshmëri në të cilën nxënësit rriten me dije, besim dhe miqësi.",
      cta: { label: "Zbuloni jetën në Medrese", href: href("oiu") },
      cards: [
        {
          id: "biblioteka",
          label: "Biblioteka",
          image: alt(
            bs.life.stack.cards[0].image,
            "Biblioteka e Medresesë: rafte me literaturë islame dhe të përgjithshme",
          ),
        },
        {
          id: "sportska-sala",
          label: "Salla sportive",
          image: alt(
            bs.life.stack.cards[1].image,
            "Salla sportive e Medresesë me kosh dhe portë në dritën e pasdites",
          ),
        },
        {
          id: "internat",
          label: "Konvikti",
          image: alt(
            bs.life.stack.cards[2].image,
            "Dhomë në konviktin e Medresesë me shtretër marinarë dhe dollapë",
          ),
        },
        {
          id: "amfiteatar",
          label: "Amfiteatri",
          image: alt(
            bs.life.stack.cards[3].image,
            "Amfiteatri i Medresesë me rreshta ulësesh shkallëzuese dhe tavolinë për folësit",
          ),
        },
      ],
    },
  },
  generations: {
    eyebrow: "Gjeneratat",
    words: ["Dija.", "Karakteri.", "Bashkësia.", "Njerëz më të mirë."],
    lead: "Që nga 6 tetori 2008, gjenerata maturantësh dhe maturantesh e çojnë Medresenë më tej – në universitete në vend dhe në botë, dhe në bashkësitë e tyre.",
    total: "800+",
    totalLabel: "maturantë dhe maturante",
    numerals: bs.generations.numerals,
    cta: { label: "Alumni", href: href("alumni") },
    image: alt(bs.generations.image, "Pamje nga ajri e kampusit të Medresesë"),
  },
  alumni: {
    eyebrow: "Gjeneratat",
    heading: ["Gjenerata që lënë gjurmë."],
    link: { label: "Alumni", href: href("alumni") },
    galleryLabel: "Gjeneratat e maturantëve të Medresesë, nga I deri në XV",
    open: "hap tablonë",
    items: bs.alumni.items.map((g, i) => gen(g.numeral, i + 1)),
  },
  news: {
    eyebrow: "Aktuale",
    heading: "Lajme",
    all: { label: "Shiko të gjitha lajmet", href: href("vijesti") },
    read: "Lexo",
    archive: "Arkivi",
    filterAll: "Të gjitha",
    more: "Shfaq lajmet më të vjetra",
    items: homeNews("sq", [
      alt(newsFallbacks[0], "Portali prej guri i Medresesë me harqe"),
      alt(newsFallbacks[1], "Oborri i Medresesë me një ulli dhe ndërtesa prej guri"),
    ]),
  },
  feed: {
    eyebrow: "Ndiqni jetën e Medresesë",
    heading: "Medreseja, ditë pas dite.",
    lead: "Çaste, ngjarje dhe tregime nga jeta e Medresesë sonë.",
    platforms: { instagram: "Instagram", facebook: "Facebook" },
    profiles: {
      instagram: {
        text: "Fotografi dhe çaste të shkurtra nga përditshmëria e Medresesë – nga klasat, konvikti dhe garat.",
        alt: "Kaligrafi në brendësinë e një kupole në Medrese",
      },
      facebook: {
        text: "Lajme, njoftime dhe ngjarje nga Medreseja, së pari në faqen tonë në Facebook.",
        alt: "Hyrje me hark dhe minare në oborrin e Medresesë",
      },
    },
    open: { post: "Shiko postimin", profile: "Vizitoni profilin" },
  },
  social: {
    eyebrow: "Bashkësia",
    heading: "Medreseja, ditë pas dite.",
    body: "Çaste nga klasat, konvikti dhe garat – së shpejti edhe këtu.",
    soon: "Së shpejti",
    channels: bs.social.channels,
  },
  admissions: {
    eyebrow: "Regjistrimi dhe provimi pranues",
    heading: ["Mirë se vini", "në botën tonë të dijes."],
    body: "Kandidati duhet të ketë përfunduar shkollën fillore, të ketë sjellje shembullore dhe interes për shkencat e përgjithshme dhe islame. Regjistrimi përfshin verifikimin e njohurive bazë, bisedën me komisionin dhe dorëzimin e dokumentacionit të nevojshëm.",
    status: "Regjistrimi për vitin shkollor 2026/2027 ka përfunduar.",
    primary: { label: "Rezultatet e regjistrimit 26/27", href: href("upis") },
    secondary: { label: "Na kontaktoni", href: href("kontakt") },
  },
  closing: {
    line: ["Dija është", "drita që", "mbetet."],
    letter: {
      eyebrow: "Fjala e drejtorit",
      paragraphs: [
        "Misioni ynë është i qartë: të edukojmë breza që do ta duan besimin e tyre, do t’i respektojnë të tjerët dhe do t’i shërbejnë bashkësisë. Në kohë sfidash, Medreseja mbetet një fanar që u jep nxënësve të saj siguri, kuptim dhe drejtim.",
        "Jemi krenarë për traditën tonë, por po aq të përkushtuar ndaj së ardhmes. Në këtë rrugë, çdo dije është amanet, dhe çdo nxënës – besim që e ruajmë me dashuri dhe përkushtim.",
      ],
      thanks: "Faleminderit për besimin tuaj.",
      role: "Drejtori i Medresesë,",
      name: bs.closing.letter.name,
      signature: { ...bs.closing.letter.signature, alt: "Nënshkrimi i drejtorit Amer Šukurica" },
    },
    image: alt(bs.closing.image, "Minare e Medresesë në qiellin e kaltër"),
  },
  footer: {
    tagline: "Medreseja “Mehmed Fatih” – ku dija bëhet amanet.",
    contact: "Kontakti",
    explore: "Medreseja",
    follow: "Na ndiqni",
    rights: "Medreseja “Mehmed Fatih” – Mali i Zi. Të gjitha të drejtat e rezervuara.",
    links: [
      link("historijat"),
      link("misija"),
      link("nastava"),
      link("upis"),
      link("vijesti"),
      link("galerija"),
      link("donacije"),
      link("kontakt"),
    ],
    support: {
      label: "Projekti u mbështet nga",
      href: bs.footer.support.href,
      logo: {
        ...bs.footer.support.logo,
        alt: "Fondi për mbrojtjen dhe realizimin e të drejtave të pakicave i Malit të Zi",
      },
      note: "Projekti është mbështetur nga Fondi për mbrojtjen dhe realizimin e të drejtave të pakicave. Fondi nuk mban përgjegjësi për përmbajtjen, qëndrimet e shprehura dhe interpretimet, të cilat janë tërësisht në kompetencë të autorëve dhe realizuesve të projektit.",
    },
  },
};
