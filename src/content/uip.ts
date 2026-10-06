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
