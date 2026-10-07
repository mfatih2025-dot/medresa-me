import { bs, genFor, linkFor, newsFallbacks, type Dictionary, type Img } from "./bs";
import { homeNews } from "./vijesti/home";
import { href as pageHref, type PageSlug } from "./site";

/**
 * English. Sources: the English pages of medresa.me (Weglot) where they exist
 * and read correctly — the Director's letter, the tagline, the Fund's note —
 * revised for consistent terminology („the Medresa“, never „madrasa/madrasah“);
 * the rest translated from the Bosnian master. Names, numbers and the identity
 * lockup (MEDRESA · MEHMED FATIH) are unchanged.
 */
const link = linkFor("en");
const href = (slug: PageSlug) => pageHref(slug, "en");
const alt = (image: Img, text: string): Img => ({ ...image, alt: text });
const gen = genFor(
  "en",
  (numeral, n, years) =>
    `Graduation panel of the ${numeral} generation of ${n >= 5 ? "male and female graduates" : "graduates"} of the Medresa “Mehmed Fatih”, ${years}.`,
);

export const en: Dictionary = {
  lang: "en",
  meta: {
    title: "Medresa “Mehmed Fatih” – Montenegro",
    description:
      "The official website of the Medresa “Mehmed Fatih” in Montenegro. Islamic values, contemporary education and upbringing for life, together.",
  },
  ui: {
    skip: "Skip to content",
    menu: "Menu",
    closeMenu: "Close menu",
    search: "Search",
    searchPlaceholder: "Search pages and news",
    searchEmpty: "No results.",
    close: "Close",
    language: "Language",
    languageSoon: "Albanian and English coming soon",
    comingSoon: "This page is being prepared.",
    comingSoonBody: "The content of the Medresa “Mehmed Fatih” is coming soon in a new edition.",
    backHome: "Back to the homepage",
    scrollDown: "Scroll down",
    navLeft: "Main navigation, left",
    navRight: "Main navigation, right",
    home: "homepage",
    notFound: "Page not found.",
    playGenerations: "Play the moving generations",
    pauseGenerations: "Pause the moving generations",
    generation: "Generation",
    prevPost: "Previous post",
    nextPost: "Next post",
    intl: "en-GB",
  },
  contact: {
    address: ["Donji Milješ, Tuzi", "Montenegro"],
    hours: "Mon – Fri / 08:00 – 17:00",
    branch: { name: "Regional Department Rožaje", address: "Raduna Đukića Street 1, Rožaje" },
  },
  nav: {
    left: [link("historijat"), link("nastava"), link("oiu")],
    right: [link("alumni"), link("vijesti"), link("upis")],
    groups: [
      { title: "Medresa", items: [link("historijat"), link("misija"), link("uip"), link("oiu")] },
      {
        title: "Students and alumni",
        items: [link("nastava"), link("tiu"), link("alumni"), link("galerija"), link("kucni-red")],
      },
      {
        title: "Current",
        items: [link("vijesti"), link("upis"), link("donacije"), link("kontakt")],
      },
    ],
  },
  hero: {
    pre: bs.hero.pre,
    name: bs.hero.name,
    signature: "Official website",
    admissions: { kicker: "Entrance exam 2026", label: "Entrance exam results", href: href("upis") },
    eyebrow: ["Knowledge", "Values", "Responsibility"],
    lead: "Islamic values, contemporary education and upbringing for life, together.",
    video: { label: "Watch the video", href: bs.hero.video.href },
    image: alt(
      bs.hero.image,
      "The Medresa “Mehmed Fatih” building in Tuzi with its minarets and dome, at the foot of a hill",
    ),
  },
  glance: {
    label: "The Medresa at a glance",
    items: [
      { value: "2008", label: "Founded", note: "6 October 2008" },
      { value: "800+", label: "Graduates", note: "male and female graduates" },
      { value: "6,000 m²", label: "A modern campus", note: "with all its facilities" },
      { value: "Boarding", label: "200+ students", note: "two separate buildings" },
      { value: "Library", label: "and amphitheatre", note: "hifz classrooms, Book Caffe" },
    ],
  },
  story: {
    eyebrow: "Our story",
    heading: ["More than a school.", "A community for life."],
    body: [
      "Our Medresa is a home of upbringing, learning and service to the community. Its students learn not only how to know – but how to be.",
      "The first contemporary Islamic secondary school in Montenegro, founded under the auspices of the Meshihat of the Islamic Community in Montenegro.",
    ],
    pull: "Medresa “Mehmed Fatih” – where knowledge becomes a trust.",
    cta: { label: "Learn more", href: href("historijat") },
    main: alt(bs.story.main, "The dome and building of the Medresa beside a flowering oleander"),
    detail: alt(bs.story.detail, "An arched entrance and a minaret in the Medresa courtyard"),
    facts: [
      { value: "360+", label: "male and female students" },
      { value: "2015", label: "programme accredited" },
    ],
    links: [link("misija"), link("uip")],
  },
  education: {
    eyebrow: "Education",
    heading: ["Faith and knowledge,", "one path."],
    lead: "The educational programme rests on a harmonious union of the Islamic and the general curriculum, with the aim of forming a whole person – spiritually grounded, morally oriented and academically competent.",
    pillars: [
      {
        title: "Islamic subjects",
        text: "Spiritual awareness, Islamic identity and sensitivity to social and ethical questions.",
        items: [
          "Qur’an and Tajweed",
          "Aqidah",
          "Fiqh",
          "Hadith",
          "Tafsir",
          "Arabic",
          "History of Islam",
          "Ethics and akhlaq",
        ],
      },
      {
        title: "General education subjects",
        text: "All compulsory subjects prescribed for secondary schools in Montenegro.",
        items: [
          "Language and literature",
          "English, Arabic and Turkish",
          "Mathematics",
          "Biology, physics, chemistry",
          "History and geography",
          "Computer science",
        ],
      },
    ],
    facts: [
      "A four-year boarding secondary school",
      "Bilingual teaching – Bosnian and Albanian",
      "Curriculum aligned with the standards of the Ministry of Education",
    ],
    cta: { label: "Teaching and Subjects", href: href("nastava") },
    image: alt(bs.education.image, "Three stone arches at the entrance to the Medresa"),
    image2: alt(bs.education.image2, "A classroom with wooden desks in warm light"),
  },
  life: {
    eyebrow: "Life at the Medresa",
    heading: ["A home, not just", "a school building."],
    lead: "Boarding, the library, the amphitheatre, the sports hall and extracurricular activities – everyday life in which students grow in a setting that nurtures knowledge, faith and ethical values.",
    items: [
      {
        title: "Boarding",
        text: "Two separate buildings for male and female students, with reading rooms and spaces for study and rest.",
        image: alt(bs.life.items[0].image, "The Medresa boarding house beside an olive tree at sunset"),
      },
      {
        title: "Library",
        text: "A rich collection of Islamic and general literature, and dedicated hifz classrooms.",
        image: alt(bs.life.items[1].image, "A bright reading room with large windows"),
      },
      {
        title: "Amphitheatre",
        text: "For lectures, presentations, workshops and public appearances by students and guests.",
        image: alt(bs.life.items[2].image, "A room with tiered seating and a shared table"),
      },
      {
        title: "Sports hall",
        text: "Basketball, volleyball, futsal and other team games.",
        image: alt(bs.life.items[3].image, "An aerial view of the campus sports ground"),
      },
      {
        title: "Extracurricular activities",
        text: "Choir, recitation, drama, literary and debate sections, hafiz groups and humanitarian projects.",
        image: alt(bs.life.items[4].image, "Calligraphy inside a dome"),
      },
    ],
    cta: { label: "Campus and Facilities", href: href("oiu") },
    stack: {
      heading: "More than lessons.",
      text: "Lessons, boarding, the library, sport and friendship – everyday life in which students grow with knowledge, faith and friends.",
      cta: { label: "Explore life at the Medresa", href: href("oiu") },
      cards: [
        {
          id: "biblioteka",
          label: "Library",
          image: alt(
            bs.life.stack.cards[0].image,
            "The Medresa library: shelves of Islamic and general literature",
          ),
        },
        {
          id: "sportska-sala",
          label: "Sports hall",
          image: alt(
            bs.life.stack.cards[1].image,
            "The Medresa sports hall with a basket and a goal in afternoon light",
          ),
        },
        {
          id: "internat",
          label: "Boarding",
          image: alt(
            bs.life.stack.cards[2].image,
            "A room in the Medresa boarding house with bunk beds and wardrobes",
          ),
        },
        {
          id: "amfiteatar",
          label: "Amphitheatre",
          image: alt(
            bs.life.stack.cards[3].image,
            "The Medresa amphitheatre with tiered rows of seats and a speakers’ table",
          ),
        },
      ],
    },
  },
  generations: {
    eyebrow: "Generations",
    words: ["Knowledge.", "Character.", "Community.", "Better people."],
    lead: "Since 6 October 2008, generations of male and female graduates have carried the Medresa further – to universities at home and abroad, and into their communities.",
    total: "800+",
    totalLabel: "male and female graduates",
    numerals: bs.generations.numerals,
    cta: { label: "Alumni", href: href("alumni") },
    image: alt(bs.generations.image, "An aerial view of the Medresa campus"),
  },
  alumni: {
    eyebrow: "Generations",
    heading: ["Generations that leave a mark."],
    link: { label: "Alumni", href: href("alumni") },
    galleryLabel: "Generations of Medresa graduates, from I to XV",
    open: "open the panel",
    items: bs.alumni.items.map((g, i) => gen(g.numeral, i + 1)),
  },
  news: {
    eyebrow: "Current",
    heading: "News",
    all: { label: "See all news", href: href("vijesti") },
    read: "Read",
    archive: "Archive",
    filterAll: "All",
    more: "Show older news",
    notice: {
      label: "Admissions",
      title: "Admission results for the Medresa, 2026/2027",
      href: href("upis"),
    },
    items: homeNews("en", [
      alt(newsFallbacks[0], "The stone portal of the Medresa with its arches"),
      alt(newsFallbacks[1], "The Medresa courtyard with an olive tree and stone buildings"),
    ]),
  },
  feed: {
    eyebrow: "Follow life at the Medresa",
    heading: "The Medresa, day by day.",
    lead: "Moments, events and stories from the life of our Medresa.",
    platforms: { instagram: "Instagram", facebook: "Facebook" },
    profiles: {
      instagram: {
        text: "Photographs and short moments from everyday life at the Medresa – from classrooms, the boarding house and competitions.",
        alt: "Calligraphy inside a dome at the Medresa",
      },
      facebook: {
        text: "News, announcements and events from the Medresa, first on our Facebook page.",
        alt: "An arched entrance and a minaret in the Medresa courtyard",
      },
    },
    open: { post: "View the post", profile: "Visit the profile" },
  },
  social: {
    eyebrow: "Community",
    heading: "The Medresa, day by day.",
    body: "Moments from classrooms, the boarding house and competitions – here soon.",
    soon: "Soon",
    channels: bs.social.channels,
  },
  admissions: {
    eyebrow: "Admissions and Entrance Exam",
    heading: ["Welcome", "to our world of learning."],
    body: "Candidates must have completed primary school, show exemplary conduct and an interest in general and Islamic sciences. Admission includes a test of basic knowledge, an interview with the committee and submission of the required documents.",
    status: "Admission for the 2026/2027 school year has closed.",
    primary: { label: "Admission results 26/27", href: href("upis") },
    secondary: { label: "Contact us", href: href("kontakt") },
  },
  closing: {
    line: ["Knowledge is", "a light that", "remains."],
    letter: {
      eyebrow: "A word from the Director",
      paragraphs: [
        "Our mission is clear: to raise generations who will love their faith, respect others and serve the community. In times of challenge, the Medresa remains a beacon that gives its students security, meaning and direction.",
        "We are proud of our tradition, yet equally devoted to the future. On this path, all knowledge is an amanah, and every student – a trust we keep with love and devotion.",
      ],
      thanks: "Thank you for your trust.",
      role: "Director of the Medresa,",
      name: bs.closing.letter.name,
      signature: { ...bs.closing.letter.signature, alt: "The signature of Director Amer Šukurica" },
    },
    image: alt(bs.closing.image, "A minaret of the Medresa against a blue sky"),
  },
  footer: {
    tagline: "Medresa “Mehmed Fatih” – where knowledge becomes a trust.",
    contact: "Contact",
    explore: "Medresa",
    follow: "Follow us",
    rights: "Medresa “Mehmed Fatih” – Montenegro. All rights reserved.",
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
      label: "Project supported by",
      href: bs.footer.support.href,
      logo: {
        ...bs.footer.support.logo,
        alt: "Fund for the Protection and Exercise of Minority Rights of Montenegro",
      },
      note: "The project is supported by the Fund for the Protection and Exercise of Minority Rights. The Fund is not responsible for the content, the views expressed or their interpretation, which are entirely the responsibility of the authors and implementers of the project.",
    },
  },
};
