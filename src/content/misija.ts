/**
 * Misija i vizija — the text of medresa.me/misija, word for word (only the
 * quotation marks follow this site's „…“ convention).
 *
 * Media: the authentic PNG signature of Reis Rifat ef. Fejzić from that page,
 * unaltered. His portrait from that page is intentionally not used.
 */
export const misija = {
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
