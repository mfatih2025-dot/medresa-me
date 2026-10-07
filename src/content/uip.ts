/**
 * Uprava i profesori — the source data of medresa.me/uip, verbatim.
 *
 * Generated from the published page (accordion by accordion): every role,
 * name, subject and their order exactly as there, including the source's own
 * spellings and name order (e.g. "Dreshaj Sanella" under Istorija and
 * "Dreshaj Sanela" under Geografija are kept as published, not merged). The
 * directory derives its per-person view from these lists, matching names by
 * their exact spelling within one location only — Tuzi and Rožaje never mix.
 */

export type LocationId = "tuzi" | "rozaje";
export type Role = { role: string; name: string };
export type Subject = { name: string; teachers: readonly string[] };
export type Location = {
  id: LocationId;
  /** Short label for the switch. */
  label: string;
  /** The source's heading for this location. */
  title: string;
  management: readonly Role[];
  subjects: readonly Subject[];
};

export const tuzi: Location = {
  id: "tuzi",
  label: "Tuzi",
  title: "Medresa „Mehmed Fatih“ – Tuzi",
  management: [
    { role: "Direktor", name: "Amer Šukurica" },
    { role: "Pomoćnik direktora", name: "Senad Alibašić" },
    { role: "Sekretar", name: "Amer Dautović" },
    { role: "Pomoćnik direktora za učeničke domove", name: "Ernad Redžepović" },
  ],
  subjects: [
    { name: "Kiraet", teachers: ["Bugari Sulejman", "Hajdari Xhemal", "Kačar Rahman"] },
    { name: "Akaid", teachers: ["Burdžović Enis", "Gjokaj Allmir", "Dizdarević Bajram"] },
    { name: "Fikh", teachers: ["Pepić Bajram", "Đoković Vaida"] },
    { name: "Ahlak", teachers: ["Dizdarević Bajram", "Gjokaj Allmir"] },
    { name: "Tefsir / Hadis", teachers: ["Zekić Admir", "Kanaqi Behlul"] },
    { name: "Istorija Islama", teachers: ["Đoković Vaida", "Gjokaj Allmir"] },
    { name: "CSBH", teachers: ["Padović Mensur", "Glavatović Azra", "Mustafić Suljo"] },
    { name: "Arapski jezik", teachers: ["Latić Afan", "Arifaj Xhevahir", "Pepić Azra"] },
    { name: "Engleski jezik", teachers: ["Alibašić Jasmina", "Krnić Jasmin", "Šahman Emina"] },
    { name: "Turski jezik", teachers: ["Kizil Melike", "Ammar Deniz", "Kocak Nihat"] },
    { name: "Albanski jezik", teachers: ["Kalač Liberta"] },
    { name: "Matematika", teachers: ["Višnjić Sead", "Šukurica Maida"] },
    { name: "Fizika", teachers: ["Višnjić Sead", "Kajošević Azemina"] },
    { name: "Hemija", teachers: ["Giljaj Senad"] },
    { name: "Biologija", teachers: ["Alibašić Edita"] },
    { name: "Istorija", teachers: ["Ličina Jasmina", "Šabotić Sait", "Dreshaj Sanella"] },
    { name: "Geografija", teachers: ["Ličina Jasmina", "Dreshaj Sanela", "Šabotić Sait"] },
    { name: "Psihologija", teachers: ["Redžepović Ernad", "Kasumović Fahreta"] },
    { name: "Logika", teachers: ["Osmanović Elmaz", "Kasumović Fahreta"] },
    { name: "Filozofija", teachers: ["Osmanović Elmaz", "Kasumović Fahreta"] },
    { name: "Sociologija", teachers: ["Hasani Elvira", "Kasumović Fahreta"] },
    { name: "Informatika", teachers: ["Ljuljanović Fuad"] },
    { name: "Pojedinac u grupi", teachers: ["Osmanović Elmaz", "Kasumović Fahreta"] },
    { name: "Etika", teachers: ["Osmanović Elmaz", "Kasumović Fahreta"] },
    { name: "Fizičko vaspitanje", teachers: ["Ademović Mirsad", "Dautović Asmira"] },
  ],
};

export const rozaje: Location = {
  id: "rozaje",
  label: "Rožaje",
  title: "Područno odjeljenje Rožaje",
  management: [
    { role: "Upravnik", name: "Redžep Murić" },
    { role: "Sekretar", name: "Ramiz Luboder" },
  ],
  subjects: [
    { name: "Kiraet", teachers: ["Hadžić Samra"] },
    { name: "Arapski jezik", teachers: ["Hadžić Samra", "Zilkić Emira"] },
    { name: "Akaid", teachers: ["Hadžić Samra", "Sinanović Naila"] },
    { name: "Ahlak", teachers: ["Ćorović Selma"] },
    { name: "Fikh", teachers: ["Burdžović Mirsada"] },
    { name: "Istorija Islama", teachers: ["Burdžović Mirsada"] },
    { name: "Hadis", teachers: ["Korać Armin"] },
    { name: "Tefsir", teachers: ["Korać Armin"] },
    { name: "CSBH", teachers: ["Mujević Dženisa"] },
    { name: "Engleski jezik", teachers: ["Hadžić Almasa"] },
    { name: "Turski jezik", teachers: ["Kubra Çatan"] },
    { name: "Matematika", teachers: ["Muković Mujević Ilda"] },
    { name: "Fizika", teachers: ["Murić Igbala"] },
    { name: "Hemija", teachers: ["Murić Igbala"] },
    { name: "Biologija", teachers: ["Kurpejović Emira"] },
    { name: "Istorija", teachers: ["Ramović Hajdarpašić Amina"] },
    { name: "Geografija", teachers: ["Ramović Hajdarpašić Amina"] },
    { name: "Pojedinac u grupi", teachers: ["Pepić Fadila"] },
    { name: "Psihologija", teachers: ["Pepić Fadila"] },
    { name: "Etika", teachers: ["Rabija Salihović Murić"] },
    { name: "Logika", teachers: ["Rabija Salihović Murić"] },
    { name: "Filozofija", teachers: ["Emina Kurtanović Hadžić"] },
    { name: "Sociologija", teachers: ["Emina Kurtanović Hadžić"] },
    { name: "Informatika", teachers: ["Kardović Dautović Selma"] },
    { name: "Fizičko vaspitanje", teachers: ["Seferović Fatima"] },
  ],
};

/** Vaspitna služba (Tuzi). Source heading: "MEDRESA \"MEHMED FATIH\" – TUZI (školska 2025/26.)". */
export const service = {
  location: "Tuzi",
  year: "školska 2025/26.",
  teams: [
    {
      title: "Vaspitna služba – Muška medresa",
      short: "Muška medresa",
      coordinator: "Shemsudin Gjokaj",
      members: [
        "Mumin Fejzić",
        "Elsan Kalač",
        "Alem Musić",
        "Haris Murić",
        "Mehdija Demirović",
        "Erlind Curović",
        "Amar Dreshaj",
        "Xhemal Hajdari",
      ],
    },
    {
      title: "Vaspitna služba – Ženska medresa",
      short: "Ženska medresa",
      coordinator: null,
      members: [
        "Amila Hot",
        "Lejla Hadžijić",
        "Ilma Musić",
        "Elifa Redžepović",
        "Azra Pepić",
        "Enisa Kajoshaj",
      ],
    },
  ],
} as const;

export const locations = [tuzi, rozaje] as const;

/** Interface text of the directory (Bosnian master). */
const ui = {
  eyebrow: "Medresa „Mehmed Fatih“",
  title: "Uprava i profesori",
  description:
    "Uprava, profesori i predmeti Medrese „Mehmed Fatih“ u Tuzima i u Područnom odjeljenju Rožaje, te vaspitna služba.",
  location: "Lokacija",
  management: "Uprava",
  faculty: "Profesori",
  view: "Prikaz",
  byPeople: "Po profesorima",
  bySubjects: "Po predmetima",
  search: "Pretraži profesora ili predmet",
  clear: "Obriši pretragu",
  close: "Zatvori",
  letters: "Abecedni indeks",
  subjects: "Predmeti",
  toSubject: "svi profesori ovog predmeta",
  toPerson: "svi predmeti ovog profesora",
  noResults: "Nema rezultata za",
  /** „for “query”“ after a count. */
  forQuery: "za",
  open: "„",
  shut: "“",
  service: "Vaspitna služba",
  coordinator: "Koordinator",
  /** Plural forms: [one, few (2–4), many]. */
  teachers: ["profesor", "profesora", "profesora"],
  subjectsN: ["predmet", "predmeta", "predmeta"],
  results: ["rezultat", "rezultata", "rezultata"],
};
export type UipUi = typeof ui;

/** Count with its noun: Bosnian has one/few/many, Albanian and English one/other. */
export function plural(n: number, [one, few, many]: readonly string[], bosnian: boolean) {
  if (!bosnian) return `${n} ${n === 1 ? one : many}`;
  const t = n % 10;
  const h = n % 100;
  if (t === 1 && h !== 11) return `${n} ${one}`;
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

/*
 * Albanian and English: roles, subject names and labels are translated; every
 * person's name is the master's string, untouched (the old Weglot pages
 * „translated“ several surnames — never used). Subject names follow the
 * Weglot pages where correct (Fiqh, Tafsir / Hadith, History of Islam, …) and
 * keep the established Islamic terms where Weglot misread them (Ahlak was
 * rendered „Morality“). „CSBH“ is the official Montenegrin subject acronym and
 * stays as published.
 */
const words = {
  en: {
    Kiraet: "Qiraat",
    Akaid: "Aqidah",
    Fikh: "Fiqh",
    Ahlak: "Akhlaq",
    "Tefsir / Hadis": "Tafsir / Hadith",
    Hadis: "Hadith",
    Tefsir: "Tafsir",
    "Istorija Islama": "History of Islam",
    CSBH: "CSBH",
    "Arapski jezik": "Arabic",
    "Engleski jezik": "English",
    "Turski jezik": "Turkish",
    "Albanski jezik": "Albanian",
    Matematika: "Mathematics",
    Fizika: "Physics",
    Hemija: "Chemistry",
    Biologija: "Biology",
    Istorija: "History",
    Geografija: "Geography",
    Psihologija: "Psychology",
    Logika: "Logic",
    Filozofija: "Philosophy",
    Sociologija: "Sociology",
    Informatika: "Informatics",
    "Pojedinac u grupi": "The Individual in the Group",
    Etika: "Ethics",
    "Fizičko vaspitanje": "Physical Education",
    Direktor: "Director",
    "Pomoćnik direktora": "Assistant Director",
    Sekretar: "Secretary",
    "Pomoćnik direktora za učeničke domove": "Assistant Director for Student Dormitories",
    Upravnik: "Head",
  },
  sq: {
    Kiraet: "Kiraet",
    Akaid: "Akaid",
    Fikh: "Fikh",
    Ahlak: "Ahlak",
    "Tefsir / Hadis": "Tefsir / Hadith",
    Hadis: "Hadith",
    Tefsir: "Tefsir",
    "Istorija Islama": "Historia e Islamit",
    CSBH: "CSBH",
    "Arapski jezik": "Gjuhë arabe",
    "Engleski jezik": "Gjuhë angleze",
    "Turski jezik": "Gjuhë turke",
    "Albanski jezik": "Gjuhë shqipe",
    Matematika: "Matematikë",
    Fizika: "Fizikë",
    Hemija: "Kimi",
    Biologija: "Biologji",
    Istorija: "Histori",
    Geografija: "Gjeografi",
    Psihologija: "Psikologji",
    Logika: "Logjikë",
    Filozofija: "Filozofi",
    Sociologija: "Sociologji",
    Informatika: "Informatikë",
    "Pojedinac u grupi": "Individi në grup",
    Etika: "Etikë",
    "Fizičko vaspitanje": "Edukatë fizike",
    Direktor: "Drejtor",
    "Pomoćnik direktora": "Ndihmësdrejtor",
    Sekretar: "Sekretar",
    "Pomoćnik direktora za učeničke domove": "Ndihmësdrejtor për konviktet e nxënësve",
    Upravnik: "Drejtues",
  },
} satisfies Record<"en" | "sq", Record<string, string>>;

function translate(loc: Location, w: Record<string, string>, label: string, title: string): Location {
  const t = (s: string) => {
    if (!(s in w)) throw new Error(`uip: no translation for „${s}“`);
    return w[s];
  };
  return {
    ...loc,
    label,
    title,
    management: loc.management.map((m) => ({ role: t(m.role), name: m.name })),
    subjects: loc.subjects.map((s) => ({ name: t(s.name), teachers: s.teachers })),
  };
}

const bsContent = { locations: [tuzi, rozaje] as readonly Location[], service, ui };
type UipContent = {
  locations: readonly Location[];
  service: {
    location: string;
    year: string;
    teams: readonly {
      title: string;
      short: string;
      coordinator: string | null;
      members: readonly string[];
    }[];
  };
  ui: UipUi;
};

const [male, female] = service.teams;

const en: UipContent = {
  locations: [
    translate(tuzi, words.en, "Tuzi", "Medresa “Mehmed Fatih” – Tuzi"),
    translate(rozaje, words.en, "Rožaje", "Regional Department Rožaje"),
  ],
  service: {
    location: "Tuzi",
    year: "school year 2025/26",
    teams: [
      { ...male, title: "Educational Service – Boys’ Medresa", short: "Boys’ Medresa" },
      { ...female, title: "Educational Service – Girls’ Medresa", short: "Girls’ Medresa" },
    ],
  },
  ui: {
    eyebrow: "Medresa “Mehmed Fatih”",
    title: "Administration and Teachers",
    description:
      "The administration, teachers and subjects of the Medresa “Mehmed Fatih” in Tuzi and in the Regional Department Rožaje, and its educational service.",
    location: "Location",
    management: "Administration",
    faculty: "Teachers",
    view: "View",
    byPeople: "By teacher",
    bySubjects: "By subject",
    search: "Search for a teacher or subject",
    clear: "Clear search",
    close: "Close",
    letters: "Alphabetical index",
    subjects: "Subjects",
    toSubject: "all teachers of this subject",
    toPerson: "all subjects of this teacher",
    noResults: "No results for",
    forQuery: "for",
    open: "“",
    shut: "”",
    service: "Educational Service",
    coordinator: "Coordinator",
    teachers: ["teacher", "teachers", "teachers"],
    subjectsN: ["subject", "subjects", "subjects"],
    results: ["result", "results", "results"],
  },
};

const sq: UipContent = {
  locations: [
    translate(tuzi, words.sq, "Tuz", "Medreseja “Mehmed Fatih” – Tuz"),
    translate(rozaje, words.sq, "Rozhajë", "Njësia rajonale në Rozhajë"),
  ],
  service: {
    location: "Tuz",
    year: "viti shkollor 2025/26",
    teams: [
      { ...male, title: "Shërbimi edukativ – Medreseja e djemve", short: "Medreseja e djemve" },
      { ...female, title: "Shërbimi edukativ – Medreseja e vajzave", short: "Medreseja e vajzave" },
    ],
  },
  ui: {
    eyebrow: "Medreseja “Mehmed Fatih”",
    title: "Drejtoria dhe profesorët",
    description:
      "Drejtoria, profesorët dhe lëndët e Medresesë “Mehmed Fatih” në Tuz dhe në Njësinë rajonale në Rozhajë, si dhe shërbimi edukativ.",
    location: "Vendndodhja",
    management: "Drejtoria",
    faculty: "Profesorët",
    view: "Pamja",
    byPeople: "Sipas profesorëve",
    bySubjects: "Sipas lëndëve",
    search: "Kërkoni profesor ose lëndë",
    clear: "Fshi kërkimin",
    close: "Mbyll",
    letters: "Indeksi alfabetik",
    subjects: "Lëndët",
    toSubject: "të gjithë profesorët e kësaj lënde",
    toPerson: "të gjitha lëndët e këtij profesori",
    noResults: "Nuk ka rezultate për",
    forQuery: "për",
    open: "“",
    shut: "”",
    service: "Shërbimi edukativ",
    coordinator: "Koordinator",
    teachers: ["profesor", "profesorë", "profesorë"],
    subjectsN: ["lëndë", "lëndë", "lëndë"],
    results: ["rezultat", "rezultate", "rezultate"],
  },
};

export const uipContent: Record<"bs" | "sq" | "en", UipContent> = { bs: bsContent, sq, en };
