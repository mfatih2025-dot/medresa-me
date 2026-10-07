/**
 * Nastava i predmeti — the text of medresa.me/nastava, word for word and in the
 * source's order. Only typography follows this site: „…“ quotation marks, a
 * dash bound to the word before it, and the source's typed list dashes („–“,
 * „-“) rendered as list markup instead of characters.
 *
 * Media: the page's one photograph (the Medresa's arcaded courtyard), unaltered.
 * The title banner's textbook background is decorative and not used.
 */
export const nastava = {
  /** The page's title (its banner and menu label) and the heading under it. */
  title: "Nastava i predmeti",
  heading: "Nastava i program Medrese „Mehmed Fatih“",

  intro: [
    "Obrazovni program Medrese „Mehmed Fatih“ temelji se na harmoničnom spoju islamskog i opšteobrazovnog kurikuluma, sa ciljem formiranja cjelovite ličnosti – učenika i učenica koji su duhovno izgrađeni, moralno usmjereni i akademski kompetentni.",
    "Medresa funkcioniše kao četverogodišnja srednja škola internatskog tipa, a nastavni plan usklađen je sa standardima Ministarstva prosvjete Crne Gore i Nacionalnog savjeta za obrazovanje.",
  ],

  pillarsLead: "Dva osnovna stuba našeg obrazovanja su:",

  pillars: [
    {
      id: "opsteobrazovni",
      heading: "Opšteobrazovni predmeti",
      lead: "Učenici i učenice pohađaju sve obavezne predmete propisane za srednje škole u Crnoj Gori, uključujući:",
      subjects: [
        "jezik i književnost (bosanski, crnogorski, hrvatski, srpski i albanski jezik)",
        "strani jezici (engleski, arapski, turski)",
        "matematiku, biologiju, fiziku, hemiju",
        "istoriju, geografiju, informatiku",
        "fizičko i zdravstveno obrazovanje",
      ],
      closing: null,
    },
    {
      id: "islamski",
      heading: "Islamski predmeti",
      lead: "Posebno mjesto u kurikulumu zauzimaju predmeti iz islamskih nauka, kao što su:",
      subjects: [
        "Kur’an i tedžvid",
        "Akaid (islamsko vjerovanje)",
        "Fikh (islamsko pravo)",
        "Hadis (Poslanikova tradicija)",
        "Tefsir (tumačenje Kur’ana)",
        "Arapski jezik",
        "Povijest islama",
        "Etika i ahlak (moral)",
      ],
      closing:
        "Ovi predmeti imaju za cilj razvijanje duhovne svijesti, islamskog identiteta i osjetljivosti prema društvenim i etičkim pitanjima.",
    },
  ],

  image: {
    src: "/images/nastava/dvoriste.jpg",
    width: 1536,
    height: 1024,
    alt: "Dvorište Medrese „Mehmed Fatih“ s arkadama, zelenilom i stazom prema ulazu",
  },

  language: {
    heading: "Nastava i jezik",
    // As on the source (it ends without a full stop).
    text: "Nastava se odvija dvojezično – na bosanskom i albanskom jeziku – kako bi se osigurala inkluzivnost i razumijevanje u multikulturalnom i višejezičnom okruženju. Posebna pažnja posvećena je razvijanju komunikacijskih vještina i afirmaciji vlastitog kulturnog identiteta",
  },

  activities: {
    heading: "Praktična nastava i vannastavne aktivnosti",
    items: [
      "učenje Kur’ana i hafiske grupe",
      "hor i recitatorske sekcije",
      "dramska, literarna i debatna sekcija",
      "učešće na takmičenjima, seminarima i manifestacijama",
      "društveno-korisni rad i humanitarne akcije",
    ],
  },

  goals: {
    heading: "Cilj programa",
    items: [
      "moralno stabilne i duhovno svjesne osobe",
      "obrazovani i odgovorni pojedinci spremni za nastavak visokog obrazovanja",
      "aktivni i korisni članovi svojih zajednica",
    ],
  },

  faq: {
    heading: "Često postavljana pitanja",
    items: [
      {
        q: "Koji su uslovi za upis u prvi razred medrese?",
        a: [
          "Upis u prvi razred Medrese „Mehmed Fatih“ vrši se prema jasno definisanim kriterijima. Kandidat/kinja treba da ima završenu osnovnu školu, primjerno vladanje i interesovanje za opšte i islamske nauke.",
          "Upis uključuje provjeru osnovnog znanja, razgovor sa komisijom i predaju potrebne dokumentacije u skladu sa godišnjim konkursom.",
        ],
      },
      {
        q: "Da li Medresa nudi smještaj za učenike koji dolaze iz drugih gradova?",
        a: [
          "Da. Medresa obezbjeđuje smještaj u internatu za učenike iz drugih gradova i država.",
          "Smještaj uključuje organizovan odgojno-obrazovni ambijent, nadzor odgajatelja, ishranu i uslove za učenje i slobodne aktivnosti. Cilj internatskog života je kreiranje sigurnog, disciplinovanog i podsticajnog okruženja za obrazovanje i lični razvoj učenika.",
        ],
      },
      {
        q: "Kako mogu doći do dodatnih informacija ili postaviti pitanje?",
        a: [
          "Dodatne informacije dostupne su putem zvanične web stranice, telefona ili e-maila medrese.",
          "Učenici i roditelji mogu postaviti pitanja o upisu, programu školovanja, internatu i vannastavnim aktivnostima. Stručna služba medrese odgovara u najkraćem roku.",
        ],
      },
    ],
  },

  /** The regional department, as the source closes the page with it. */
  rozaje: {
    heading: "Područno odjeljenje u Rožajama",
    address: "Ulica Raduna Đukića 1, Rožaje",
    contactLabel: "Kontakt",
    contacts: [
      { role: "Upravnik", name: "R. Murić", phone: "+382/67-546-307" },
      { role: "Sekretar", name: "R. Luboder", phone: "+382/69-5250-750" },
    ],
    email: "ramizluboder@gmail.com",
  },
} as const;
