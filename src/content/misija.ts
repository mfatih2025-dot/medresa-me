/**
 * Misija i vizija — the text of medresa.me/misija, word for word (only the
 * quotation marks follow this site's „…“ convention).
 *
 * Media: the authentic PNG signature of Reis Rifat ef. Fejzić from that page,
 * unaltered. His portrait from that page is intentionally not used.
 */
import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";

const bs = {
  title: "Misija i vizija",
  eyebrow: "Medresa „Mehmed Fatih“",
  heading: ["Misija i vizija", "medrese „Mehmed Fatih“"],

  mission: {
    label: "Misija",
    paragraphs: [
      "Misija Medrese „Mehmed Fatih“ je da pruži cjelovito islamsko i opće obrazovanje, odgajajući mlade naraštaje u duhu vjere, znanja, odgovornosti i humanih vrijednosti. Kroz spoj tradicionalnog islamskog naslijeđa i savremenih pedagoških metoda, Medresa teži oblikovanju učenika koji su čvrsto ukorijenjeni u svojoj vjeri, a istovremeno spremni da doprinesu svojoj zajednici i društvu u cjelini.",
      "Medresa djeluje kao odgojno-obrazovna institucija koja razvija moralni integritet, kritičko mišljenje i svijest o univerzalnim ljudskim vrijednostima, pripremajući učenike i učenice da budu korisni, odgovorni i angažirani pojedinci – u domenu nauke, kulture, vjere i društvene etike.",
    ],
  },

  vision: {
    label: "Vizija",
    paragraphs: [
      "Vizija Medrese „Mehmed Fatih“ jeste da bude vodeća islamska srednjoškolska ustanova u Crnoj Gori i regionu, prepoznatljiva po kvalitetu obrazovanja, odgoju učenika, te duhovnom i kulturnom uticaju u društvu.",
      "Medresa teži da ostane otvorena za nove obrazovne izazove i prilike, osiguravajući obrazovni ambijent u kojem se njeguje identitet, poštuje različitost, afirmiše znanje i razvija osjećaj za pravednost, ljepotu i istinu.",
    ],
  },

  signatory: {
    role: "Reis islamske zajednice u Crnoj Gori",
    name: "Rifat ef. Fejzić",
    signature: {
      src: "/images/misija/potpis-reis.png",
      width: 755,
      height: 413,
      alt: "Potpis Reisa Rifata ef. Fejzića",
    },
  },
} as const;

type MisijaContent = Localized<typeof bs>;

/** English: the medresa.me English page (Weglot), with consistent terms („the Medresa“). */
const en: MisijaContent = {
  title: "Mission and Vision",
  eyebrow: "Medresa “Mehmed Fatih”",
  heading: ["Mission and Vision", "of the Medresa “Mehmed Fatih”"],
  mission: {
    label: "Mission",
    paragraphs: [
      "The mission of the Medresa “Mehmed Fatih” is to provide a complete Islamic and general education, raising young generations in the spirit of faith, knowledge, responsibility and humane values. Through the union of traditional Islamic heritage and contemporary teaching methods, the Medresa strives to form students who are firmly rooted in their faith and at the same time ready to contribute to their community and to society as a whole.",
      "The Medresa works as an educational institution that develops moral integrity, critical thinking and an awareness of universal human values, preparing its male and female students to be useful, responsible and engaged individuals\u00a0– in science, culture, faith and social ethics.",
    ],
  },
  vision: {
    label: "Vision",
    paragraphs: [
      "The vision of the Medresa “Mehmed Fatih” is to be the leading Islamic secondary school in Montenegro and the region, recognised for the quality of its education, the upbringing of its students, and its spiritual and cultural influence in society.",
      "The Medresa strives to remain open to new educational challenges and opportunities, providing an educational environment in which identity is nurtured, diversity is respected, knowledge is affirmed and a sense of justice, beauty and truth is developed.",
    ],
  },
  signatory: {
    role: "Reis of the Islamic Community in Montenegro",
    name: bs.signatory.name,
    signature: { ...bs.signatory.signature, alt: "The signature of Reis Rifat ef. Fejzić" },
  },
};

/** Shqip: the medresa.me Albanian page (Weglot), revised („nxënës“, „Bashkësia Islame“). */
const sq: MisijaContent = {
  title: "Misioni dhe vizioni",
  eyebrow: "Medreseja “Mehmed Fatih”",
  heading: ["Misioni dhe vizioni", "i Medresesë “Mehmed Fatih”"],
  mission: {
    label: "Misioni",
    paragraphs: [
      "Misioni i Medresesë “Mehmed Fatih” është të ofrojë arsim të plotë islam dhe të përgjithshëm, duke edukuar brezat e rinj në frymën e besimit, dijes, përgjegjësisë dhe vlerave humane. Përmes ndërthurjes së trashëgimisë tradicionale islame dhe metodave bashkëkohore pedagogjike, Medreseja synon të formojë nxënës që janë të rrënjosur fort në besimin e tyre dhe, njëkohësisht, të gatshëm të kontribuojnë në bashkësinë e tyre dhe në shoqërinë në tërësi.",
      "Medreseja vepron si institucion edukativo-arsimor që zhvillon integritetin moral, mendimin kritik dhe vetëdijen për vlerat universale njerëzore, duke i përgatitur nxënësit dhe nxënëset të jenë individë të dobishëm, të përgjegjshëm dhe të angazhuar\u00a0– në fushën e shkencës, kulturës, besimit dhe etikës shoqërore.",
    ],
  },
  vision: {
    label: "Vizioni",
    paragraphs: [
      "Vizioni i Medresesë “Mehmed Fatih” është të jetë institucioni kryesor islam i arsimit të mesëm në Mal të Zi dhe në rajon, i njohur për cilësinë e arsimit, edukimin e nxënësve dhe ndikimin shpirtëror e kulturor në shoqëri.",
      "Medreseja synon të mbetet e hapur ndaj sfidave dhe mundësive të reja arsimore, duke siguruar një mjedis arsimor në të cilin kultivohet identiteti, respektohet diversiteti, afirmohet dija dhe zhvillohet ndjenja për drejtësinë, bukurinë dhe të vërtetën.",
    ],
  },
  signatory: {
    role: "Reisi i Bashkësisë Islame në Mal të Zi",
    name: bs.signatory.name,
    signature: { ...bs.signatory.signature, alt: "Nënshkrimi i Reisit Rifat ef. Fejzić" },
  },
};

export const misijaContent: Record<Locale, MisijaContent> = { bs, sq, en };
/** The Bosnian master (kept for existing callers). */
export const misija = bs;
