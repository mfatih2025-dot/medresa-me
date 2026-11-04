import type { Locale } from "@/i18n/config";

/*
 * Ramadan edition: thirty hadiths, one for each day of Ramadan (RamadanHadith.tsx).
 * Each entry was checked against the source: the Arabic text and the published
 * English translation as given for the same reference in the standard editions
 * (sunnah.com numbering; Muslim in its Abdul-Baqi numbering, with the letter of the
 * narration). The English is that published translation, only its final
 * punctuation completed (and one cross-reference note left out, day 14). The
 * Bosnian and Albanian are DRAFTS made for this site and must be reviewed by a
 * qualified scholar before they are shown to the public.
 *
 * Nothing here reaches production until an entry is approved (approved: true) and
 * its translation in that language is "published" or "approved"; see hadithReady().
 * The full verification report: docs/ramadan-hadiths.md.
 */

export type HadithCollection = "bukhari" | "muslim" | "tirmidhi";
export type TranslationStatus = "published" | "approved" | "draft";

export type Hadith = {
  /** The day of Ramadan it is shown on (1–30). */
  day: number;
  topic: string;
  collection: HadithCollection;
  /** The hadith's number in its collection (Muslim: Abdul-Baqi number and narration letter). */
  reference: string;
  /** Book and hadith within the book, as in the source edition. */
  inBook: { book: number; hadith: number };
  grade: { label: string; basis: string };
  narrator: Record<Locale, string>;
  /** The Arabic as in the source edition, with its chain of narrators. */
  arabic: string;
  text: Record<Locale, string>;
  translation: Record<Locale, { status: TranslationStatus; by?: string }>;
  /** The selection and its translations approved for publication by the Medresa. */
  approved: boolean;
};

export const hadiths: readonly Hadith[] = [
  {
    day: 1,
    topic: "Ramazan",
    collection: "bukhari",
    reference: "1899",
    inBook: { book: 30, hadith: 9 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنِي يَحْيَى بْنُ بُكَيْرٍ، قَالَ حَدَّثَنِي اللَّيْثُ، عَنْ عُقَيْلٍ، عَنِ ابْنِ شِهَابٍ، قَالَ أَخْبَرَنِي ابْنُ أَبِي أَنَسٍ، مَوْلَى التَّيْمِيِّينَ أَنَّ أَبَاهُ، حَدَّثَهُ أَنَّهُ، سَمِعَ أَبَا هُرَيْرَةَ ـ رضى الله عنه ـ يَقُولُ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ إِذَا دَخَلَ شَهْرُ رَمَضَانَ فُتِّحَتْ أَبْوَابُ السَّمَاءِ، وَغُلِّقَتْ أَبْوَابُ جَهَنَّمَ، وَسُلْسِلَتِ الشَّيَاطِينُ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Kada nastupi mjesec ramazan, otvore se kapije neba, zatvore se kapije Džehennema, a šejtani se okuju u lance.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kur hyn muaji i ramazanit, hapen dyert e qiellit, mbyllen dyert e Xhehenemit dhe shejtanët lidhen me zinxhirë.“",
      en: 'Narrated Abu Huraira: Allah\'s Messenger (ﷺ) said, "When the month of Ramadan starts, the gates of the heaven are opened and the gates of Hell are closed and the devils are chained."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 2,
    topic: "Post",
    collection: "bukhari",
    reference: "38",
    inBook: { book: 2, hadith: 31 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا ابْنُ سَلاَمٍ، قَالَ أَخْبَرَنَا مُحَمَّدُ بْنُ فُضَيْلٍ، قَالَ حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ، عَنْ أَبِي سَلَمَةَ، عَنْ أَبِي هُرَيْرَةَ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko bude postio ramazan iz vjerovanja i nadajući se Allahovoj nagradi, bit će mu oprošteni njegovi prethodni grijesi.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush e agjëron ramazanin me besim dhe duke shpresuar shpërblimin e Allahut, i falen mëkatet e mëparshme.“",
      en: "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Whoever observes fasts during the month of Ramadan out of sincere faith, and hoping to attain Allah's rewards, then all his past sins will be forgiven.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 3,
    topic: "Mlađak",
    collection: "bukhari",
    reference: "1909",
    inBook: { book: 30, hadith: 19 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا آدَمُ، حَدَّثَنَا شُعْبَةُ، حَدَّثَنَا مُحَمَّدُ بْنُ زِيَادٍ، قَالَ سَمِعْتُ أَبَا هُرَيْرَةَ ـ رضى الله عنه ـ يَقُولُ قَالَ النَّبِيُّ صلى الله عليه وسلم أَوْ قَالَ قَالَ أَبُو الْقَاسِمِ صلى الله عليه وسلم ‏ "‏ صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلاَثِينَ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Vjerovjesnik, s.a.v.s. – ili je rekao: Ebul-Kasim, s.a.v.s. – rekao: „Počnite postiti kada ga (mlađak) ugledate i prestanite postiti kada ga ugledate, a ako vam bude zaklonjen, upotpunite broj dana ša’bana na trideset.“",
      sq: "Ebu Hurejra, r.a., transmeton se Profeti ﷺ – ose tha: Ebul-Kasimi ﷺ – ka thënë: „Agjëroni kur ta shihni (hënën e re) dhe ndërpriteni agjërimin kur ta shihni; e nëse ju fshihet, plotësojeni numrin e ditëve të sha’banit në tridhjetë.“",
      en: 'Narrated Abu Huraira: The Prophet (ﷺ) or Abul-Qasim said, "Start fasting on seeing the crescent (of Ramadan), and give up fasting on seeing the crescent (of Shawwal), and if the sky is overcast (and you cannot see it), complete thirty days of Sha\'ban."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 4,
    topic: "Vrijednost posta",
    collection: "bukhari",
    reference: "1904",
    inBook: { book: 30, hadith: 14 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا إِبْرَاهِيمُ بْنُ مُوسَى، أَخْبَرَنَا هِشَامُ بْنُ يُوسُفَ، عَنِ ابْنِ جُرَيْجٍ، قَالَ أَخْبَرَنِي عَطَاءٌ، عَنْ أَبِي صَالِحٍ الزَّيَّاتِ، أَنَّهُ سَمِعَ أَبَا هُرَيْرَةَ ـ رضى الله عنه ـ يَقُولُ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ قَالَ اللَّهُ كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلاَّ الصِّيَامَ، فَإِنَّهُ لِي، وَأَنَا أَجْزِي بِهِ‏.‏ وَالصِّيَامُ جُنَّةٌ، وَإِذَا كَانَ يَوْمُ صَوْمِ أَحَدِكُمْ، فَلاَ يَرْفُثْ وَلاَ يَصْخَبْ، فَإِنْ سَابَّهُ أَحَدٌ، أَوْ قَاتَلَهُ فَلْيَقُلْ إِنِّي امْرُؤٌ صَائِمٌ‏.‏ وَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَخُلُوفُ فَمِ الصَّائِمِ أَطْيَبُ عِنْدَ اللَّهِ مِنْ رِيحِ الْمِسْكِ، لِلصَّائِمِ فَرْحَتَانِ يَفْرَحُهُمَا إِذَا أَفْطَرَ فَرِحَ، وَإِذَا لَقِيَ رَبَّهُ فَرِحَ بِصَوْمِهِ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Allah kaže: ‘Svako djelo sina Ademova pripada njemu, osim posta – on je Moj i Ja za njega nagrađujem.’ Post je štit. Kada neko od vas posti, neka ne govori nepristojno i neka ne viče, a ako ga neko izgrdi ili napadne, neka kaže: ‘Ja sam čovjek koji posti.’ Tako mi Onoga u Čijoj je ruci Muhammedova duša, miris iz usta postača kod Allaha je ugodniji od mirisa miska. Postač ima dvije radosti kojima se raduje: kada iftari, raduje se, a kada susretne svoga Gospodara, radovat će se svome postu.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Allahu thotë: ‘Çdo vepër e birit të Ademit është për të, përveç agjërimit – ai është për Mua dhe Unë shpërblej për të.’ Agjërimi është mburojë. Kur njëri prej jush agjëron, të mos flasë fjalë të turpshme dhe të mos bërtasë; e nëse dikush e shan apo e sulmon, le të thotë: ‘Unë jam njeri që agjëron.’ Pasha Atë në dorë të të Cilit është shpirti i Muhamedit, era e gojës së agjëruesit është më e mirë te Allahu se aroma e miskut. Agjëruesi ka dy gëzime me të cilat gëzohet: kur çel iftarin, gëzohet; dhe kur ta takojë Zotin e tij, do të gëzohet për agjërimin e tij.“",
      en: "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Allah said, 'All the deeds of Adam's sons (people) are for them, except fasting which is for Me, and I will give the reward for it.' Fasting is a shield or protection from the fire and from committing sins. If one of you is fasting, he should avoid sexual relation with his wife and quarreling, and if somebody should fight or quarrel with him, he should say, 'I am fasting.' By Him in Whose Hands my soul is, the unpleasant smell coming out from the mouth of a fasting person is better in the sight of Allah than the smell of musk. There are two pleasures for the fasting person, one at the time of breaking his fast, and the other at the time when he will meet his Lord; then he will be pleased because of his fasting.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 5,
    topic: "Vrijednost posta",
    collection: "bukhari",
    reference: "1896",
    inBook: { book: 30, hadith: 6 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Sehl b. Sa’d", sq: "Sehl ibn Sa’di", en: "Sahl bin Sa'd" },
    arabic:
      'حَدَّثَنَا خَالِدُ بْنُ مَخْلَدٍ، حَدَّثَنَا سُلَيْمَانُ بْنُ بِلاَلٍ، قَالَ حَدَّثَنِي أَبُو حَازِمٍ، عَنْ سَهْلٍ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏ "‏ إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ، لاَ يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ يُقَالُ أَيْنَ الصَّائِمُونَ فَيَقُومُونَ، لاَ يَدْخُلُ مِنْهُ أَحَدٌ غَيْرُهُمْ، فَإِذَا دَخَلُوا أُغْلِقَ، فَلَمْ يَدْخُلْ مِنْهُ أَحَدٌ ‏"‏‏.‏',
    text: {
      bs: "Sehl, r.a., prenosi da je Vjerovjesnik, s.a.v.s., rekao: „U Džennetu su vrata koja se zovu Rejjan. Kroz njih će na Sudnjem danu ući postači i niko osim njih neće kroz njih ući. Reći će se: ‘Gdje su postači?’ Pa će oni ustati i niko osim njih neće kroz njih ući. Kada oni uđu, vrata će se zatvoriti i više niko neće kroz njih ući.“",
      sq: "Sehli, r.a., transmeton se Profeti ﷺ ka thënë: „Në Xhenet ka një derë që quhet Rejjan. Nëpër të do të hyjnë agjëruesit në Ditën e Kiametit dhe askush tjetër përveç tyre nuk do të hyjë nëpër të. Do të thuhet: ‘Ku janë agjëruesit?’ Ata do të ngrihen dhe askush tjetër përveç tyre nuk do të hyjë nëpër të. Pasi të hyjnë ata, dera do të mbyllet dhe askush tjetër nuk do të hyjë nëpër të.“",
      en: "Narrated Sahl: The Prophet (ﷺ) said, \"There is a gate in Paradise called Ar-Raiyan, and those who observe fasts will enter through it on the Day of Resurrection and none except them will enter through it. It will be said, 'Where are those who used to observe fasts?' They will get up, and none except them will enter through it. After their entry the gate will be closed and nobody will enter through it.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 6,
    topic: "Čistoća posta",
    collection: "bukhari",
    reference: "1903",
    inBook: { book: 30, hadith: 13 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا آدَمُ بْنُ أَبِي إِيَاسٍ، حَدَّثَنَا ابْنُ أَبِي ذِئْبٍ، حَدَّثَنَا سَعِيدٌ الْمَقْبُرِيُّ، عَنْ أَبِيهِ، عَنْ أَبِي هُرَيْرَةَ ـ رضى الله عنه ـ قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ مَنْ لَمْ يَدَعْ قَوْلَ الزُّورِ وَالْعَمَلَ بِهِ فَلَيْسَ لِلَّهِ حَاجَةٌ فِي أَنْ يَدَعَ طَعَامَهُ وَشَرَابَهُ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Vjerovjesnik, s.a.v.s., rekao: „Ko ne ostavi lažan govor i postupanje po njemu, Allahu nije potrebno da on ostavi svoje jelo i piće.“",
      sq: "Ebu Hurejra, r.a., transmeton se Profeti ﷺ ka thënë: „Kush nuk e lë fjalën e rreme dhe veprimin sipas saj, Allahu nuk ka nevojë që ai ta lërë ushqimin dhe pijen e tij.“",
      en: 'Narrated Abu Huraira: The Prophet (ﷺ) said, "Whoever does not give up forged speech and evil actions, Allah is not in need of his leaving his food and drink (i.e. Allah will not accept his fasting)."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 7,
    topic: "Sehur",
    collection: "bukhari",
    reference: "1923",
    inBook: { book: 30, hadith: 32 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Enes b. Malik", sq: "Enes ibn Maliku", en: "Anas bin Malik" },
    arabic:
      'حَدَّثَنَا آدَمُ بْنُ أَبِي إِيَاسٍ، حَدَّثَنَا شُعْبَةُ، حَدَّثَنَا عَبْدُ الْعَزِيزِ بْنُ صُهَيْبٍ، قَالَ سَمِعْتُ أَنَسَ بْنَ مَالِكٍ ـ رضى الله عنه ـ قَالَ قَالَ النَّبِيُّ صلى الله عليه وسلم ‏ "‏ تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً ‏"‏‏.‏',
    text: {
      bs: "Enes b. Malik, r.a., prenosi da je Vjerovjesnik, s.a.v.s., rekao: „Jedite sehur, jer je u sehuru bereket.“",
      sq: "Enes ibn Maliku, r.a., transmeton se Profeti ﷺ ka thënë: „Hani syfyr, sepse në syfyr ka bereqet.“",
      en: 'Narrated Anas bin Malik: The Prophet (ﷺ) said, "Take Suhur as there is a blessing in it."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 8,
    topic: "Iftar",
    collection: "bukhari",
    reference: "1957",
    inBook: { book: 30, hadith: 64 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Sehl b. Sa’d", sq: "Sehl ibn Sa’di", en: "Sahl bin Sa'd" },
    arabic:
      'حَدَّثَنَا عَبْدُ اللَّهِ بْنُ يُوسُفَ، أَخْبَرَنَا مَالِكٌ، عَنْ أَبِي حَازِمٍ، عَنْ سَهْلِ بْنِ سَعْدٍ، أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ لاَ يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ ‏"‏‏.‏',
    text: {
      bs: "Sehl b. Sa’d, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ljudi će biti u dobru sve dok budu požurivali s iftarom.“",
      sq: "Sehl ibn Sa’di, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Njerëzit do të jenë në mirësi për sa kohë që nxitojnë me iftarin.“",
      en: 'Narrated Sahl bin Sa`d: Allah\'s Messenger (ﷺ) said, "The people will remain on the right path as long as they hasten the breaking of the fast."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 9,
    topic: "Post",
    collection: "bukhari",
    reference: "1933",
    inBook: { book: 30, hadith: 40 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا عَبْدَانُ، أَخْبَرَنَا يَزِيدُ بْنُ زُرَيْعٍ، حَدَّثَنَا هِشَامٌ، حَدَّثَنَا ابْنُ سِيرِينَ، عَنْ أَبِي هُرَيْرَةَ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏ "‏ إِذَا نَسِيَ فَأَكَلَ وَشَرِبَ فَلْيُتِمَّ صَوْمَهُ، فَإِنَّمَا أَطْعَمَهُ اللَّهُ وَسَقَاهُ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Vjerovjesnik, s.a.v.s., rekao: „Ko iz zaborava jede ili pije, neka upotpuni svoj post, jer ga je Allah nahranio i napojio.“",
      sq: "Ebu Hurejra, r.a., transmeton se Profeti ﷺ ka thënë: „Kush nga harresa ha ose pi, le ta plotësojë agjërimin e tij, sepse Allahu e ka ushqyer dhe e ka ujitur.“",
      en: 'Narrated Abu Huraira: The Prophet (ﷺ) said, "If somebody eats or drinks forgetfully then he should complete his fast, for what he has eaten or drunk, has been given to him by Allah."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 10,
    topic: "Iftar i darežljivost",
    collection: "tirmidhi",
    reference: "807",
    inBook: { book: 8, hadith: 126 },
    grade: {
      label: "Sahih",
      basis:
        "Ahmad Muhammad Shakir: Sahih; Al-Albani: Sahih; Bashar Awad Maarouf: Hasan Sahih; Zubair Ali Zai: Isnaad Sahih",
    },
    narrator: {
      bs: "Zejd b. Halid el-Džuheni",
      sq: "Zejd ibn Halid el-Xhuheni",
      en: "Zaid bin Khalid Al-Juhani",
    },
    arabic:
      'حَدَّثَنَا هَنَّادٌ، حَدَّثَنَا عَبْدُ الرَّحِيمِ بْنُ سُلَيْمَانَ، عَنْ عَبْدِ الْمَلِكِ بْنِ أَبِي سُلَيْمَانَ، عَنْ عَطَاءٍ، عَنْ زَيْدِ بْنِ خَالِدٍ الْجُهَنِيِّ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ مَنْ فَطَّرَ صَائِمًا كَانَ لَهُ مِثْلُ أَجْرِهِ غَيْرَ أَنَّهُ لاَ يَنْقُصُ مِنْ أَجْرِ الصَّائِمِ شَيْئًا ‏"‏ ‏.‏ قَالَ أَبُو عِيسَى هَذَا حَدِيثٌ حَسَنٌ صَحِيحٌ ‏.‏',
    text: {
      bs: "Zejd b. Halid el-Džuheni, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko nahrani postača za iftar, imat će nagradu kao i on, a da se postaču nagrada nimalo ne umanji.“",
      sq: "Zejd ibn Halid el-Xhuheni, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush i jep iftar një agjëruesi, do të ketë shpërblim sa ai, pa iu pakësuar agjëruesit asgjë nga shpërblimi i tij.“",
      en: 'Zaid bin Khalid Al-Juhani narrated that: The Messenger of Allah said: "Whoever provides the food for a fasting person to break his fast with, then for him is the same reward as his (the fasting person\'s), without anything being diminished from the reward of the fasting person."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abu Khaliyl (Darussalam)" },
    },
    approved: false,
  },
  {
    day: 11,
    topic: "Darežljivost",
    collection: "bukhari",
    reference: "6",
    inBook: { book: 1, hadith: 6 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ibn Abbas", sq: "Ibn Abbasi", en: "Ibn 'Abbas" },
    arabic:
      "حَدَّثَنَا عَبْدَانُ، قَالَ أَخْبَرَنَا عَبْدُ اللَّهِ، قَالَ أَخْبَرَنَا يُونُسُ، عَنِ الزُّهْرِيِّ، ح وَحَدَّثَنَا بِشْرُ بْنُ مُحَمَّدٍ، قَالَ أَخْبَرَنَا عَبْدُ اللَّهِ، قَالَ أَخْبَرَنَا يُونُسُ، وَمَعْمَرٌ، عَنِ الزُّهْرِيِّ، نَحْوَهُ قَالَ أَخْبَرَنِي عُبَيْدُ اللَّهِ بْنُ عَبْدِ اللَّهِ، عَنِ ابْنِ عَبَّاسٍ، قَالَ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم أَجْوَدَ النَّاسِ، وَكَانَ أَجْوَدُ مَا يَكُونُ فِي رَمَضَانَ حِينَ يَلْقَاهُ جِبْرِيلُ، وَكَانَ يَلْقَاهُ فِي كُلِّ لَيْلَةٍ مِنْ رَمَضَانَ فَيُدَارِسُهُ الْقُرْآنَ، فَلَرَسُولُ اللَّهِ صلى الله عليه وسلم أَجْوَدُ بِالْخَيْرِ مِنَ الرِّيحِ الْمُرْسَلَةِ‏.‏",
    text: {
      bs: "Ibn Abbas, r.a., kaže: „Allahov Poslanik, s.a.v.s., bio je najdarežljiviji od svih ljudi, a najdarežljiviji je bio u ramazanu, kada bi ga susretao Džibril. Džibril ga je susretao svake noći u ramazanu i s njim proučavao Kur’an. Allahov Poslanik, s.a.v.s., bio je darežljiviji u dobru od puštenog vjetra.“",
      sq: "Ibn Abbasi, r.a., thotë: „I Dërguari i Allahut ﷺ ishte më bujari i njerëzve, e më bujar ishte në ramazan, kur e takonte Xhibrili. Xhibrili e takonte çdo natë të ramazanit dhe e studionte me të Kur’anin. I Dërguari i Allahut ﷺ ishte më bujar në mirësi se era që fryn lirshëm.“",
      en: "Narrated Ibn 'Abbas: Allah's Messenger (ﷺ) was the most generous of all the people, and he used to reach the peak in generosity in the month of Ramadan when Gabriel met him. Gabriel used to meet him every night of Ramadan to teach him the Qur'an. Allah's Messenger (ﷺ) was the most generous person, even more generous than the strong uncontrollable wind (in readiness and haste to do charitable deeds).",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 12,
    topic: "Sadaka",
    collection: "muslim",
    reference: "2588",
    inBook: { book: 45, hadith: 90 },
    grade: { label: "Sahih", basis: "Sahih Muslim" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا يَحْيَى بْنُ أَيُّوبَ، وَقُتَيْبَةُ، وَابْنُ، حُجْرٍ قَالُوا حَدَّثَنَا إِسْمَاعِيلُ، - وَهُوَ ابْنُ جَعْفَرٍ - عَنِ الْعَلاَءِ، عَنْ أَبِيهِ، عَنْ أَبِي هُرَيْرَةَ، عَنْ رَسُولِ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلاَّ عِزًّا وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ ‏"‏ ‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Sadaka ne umanjuje imetak. Allah robu koji oprašta samo povećava ugled, a ko se ponizi radi Allaha, Allah ga uzdigne.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Sadakaja nuk e pakëson pasurinë. Allahu robit që fal vetëm ia shton nderin, dhe kush përulet për hir të Allahut, Allahu e lartëson.“",
      en: 'Abu Huraira reported Allah\'s Messenger (ﷺ) as saying: "Charity does not decrease wealth, no one forgives another except that Allah increases his honor, and no one humbles himself for the sake of Allah except that Allah raises his status."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abdul Hamid Siddiqui" },
    },
    approved: false,
  },
  {
    day: 13,
    topic: "Sadaka",
    collection: "bukhari",
    reference: "1417",
    inBook: { book: 24, hadith: 21 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Adij b. Hatim", sq: "Adij ibn Hatimi", en: "'Adi bin Hatim" },
    arabic:
      'حَدَّثَنَا سُلَيْمَانُ بْنُ حَرْبٍ، حَدَّثَنَا شُعْبَةُ، عَنْ أَبِي إِسْحَاقَ، قَالَ سَمِعْتُ عَبْدَ اللَّهِ بْنَ مَعْقِلٍ، قَالَ سَمِعْتُ عَدِيَّ بْنَ حَاتِمٍ ـ رضى الله عنه ـ قَالَ سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ ‏ "‏ اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ ‏"‏‏.‏',
    text: {
      bs: "Adij b. Hatim, r.a., kaže da je čuo Vjerovjesnika, s.a.v.s., kako kaže: „Sačuvajte se Vatre, makar i polovinom hurme.“",
      sq: "Adij ibn Hatimi, r.a., thotë se e ka dëgjuar Profetin ﷺ duke thënë: „Ruajuni nga Zjarri, qoftë edhe me gjysmë hurme.“",
      en: 'Narrated `Adi bin Hatim: I heard the Prophet (ﷺ) saying: "Save yourself from Hell-fire even by giving half a date-fruit in charity."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 14,
    topic: "Lijep ahlak",
    collection: "bukhari",
    reference: "3559",
    inBook: { book: 61, hadith: 68 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Abdullah b. Amr", sq: "Abdullah ibn Amri", en: "'Abdullah bin 'Amr" },
    arabic:
      'حَدَّثَنَا عَبْدَانُ، عَنْ أَبِي حَمْزَةَ، عَنِ الأَعْمَشِ، عَنْ أَبِي وَائِلٍ، عَنْ مَسْرُوقٍ، عَنْ عَبْدِ اللَّهِ بْنِ عَمْرٍو ـ رضى الله عنهما ـ قَالَ لَمْ يَكُنِ النَّبِيُّ صلى الله عليه وسلم فَاحِشًا وَلاَ مُتَفَحِّشًا وَكَانَ يَقُولُ ‏ "‏ إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلاَقًا ‏"‏‏.‏',
    text: {
      bs: "Abdullah b. Amr, r.a., kaže: „Vjerovjesnik, s.a.v.s., nije bio nepristojan niti je nepristojno govorio, a govorio je: ‘Zaista su najbolji među vama oni koji su najljepšeg ahlaka.’“",
      sq: "Abdullah ibn Amri, r.a., thotë: „Profeti ﷺ nuk ishte i pahijshëm dhe as nuk fliste fjalë të pahijshme, dhe thoshte: ‘Vërtet, më të mirët prej jush janë ata që kanë moralin më të mirë.’“",
      en: 'Narrated `Abdullah bin `Amr: The Prophet (ﷺ) never used bad language neither a "Fahish nor a Mutafahish." He used to say "The best amongst you are those who have the best manners and character."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 15,
    topic: "Lijep ahlak",
    collection: "bukhari",
    reference: "6018",
    inBook: { book: 78, hadith: 49 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا قُتَيْبَةُ بْنُ سَعِيدٍ، حَدَّثَنَا أَبُو الأَحْوَصِ، عَنْ أَبِي حَصِينٍ، عَنْ أَبِي صَالِحٍ، عَنْ أَبِي هُرَيْرَةَ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلاَ يُؤْذِ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko vjeruje u Allaha i Sudnji dan, neka ne uznemirava svoga komšiju. Ko vjeruje u Allaha i Sudnji dan, neka počasti svoga gosta. Ko vjeruje u Allaha i Sudnji dan, neka govori dobro ili neka šuti.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush beson në Allahun dhe në Ditën e Fundit, të mos e shqetësojë fqinjin e tij. Kush beson në Allahun dhe në Ditën e Fundit, ta nderojë mysafirin e tij. Kush beson në Allahun dhe në Ditën e Fundit, le të flasë mirë ose të heshtë.“",
      en: 'Narrated Abu Huraira: Allah\'s Messenger (ﷺ) said, "Anybody who believes in Allah and the Last Day should not harm his neighbor, and anybody who believes in Allah and the Last Day should entertain his guest generously and anybody who believes in Allah and the Last Day should talk what is good or keep quiet. (i.e. abstain from all kinds of evil and dirty talk)."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 16,
    topic: "Strpljenje i samokontrola",
    collection: "bukhari",
    reference: "6114",
    inBook: { book: 78, hadith: 141 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا عَبْدُ اللَّهِ بْنُ يُوسُفَ، أَخْبَرَنَا مَالِكٌ، عَنِ ابْنِ شِهَابٍ، عَنْ سَعِيدِ بْنِ الْمُسَيَّبِ، عَنْ أَبِي هُرَيْرَةَ ـ رضى الله عنه ـ أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Jak nije onaj ko druge obara u hrvanju, nego je jak onaj ko vlada sobom kada se rasrdi.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „I fortë nuk është ai që i mund të tjerët në mundje, por i fortë është ai që e përmban veten kur zemërohet.“",
      en: 'Narrated Abu Huraira: Allah\'s Messenger (ﷺ) said, "The strong is not the one who overcomes the people by his strength, but the strong is the one who controls himself while in anger."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 17,
    topic: "Strpljenje i zahvalnost",
    collection: "muslim",
    reference: "2999",
    inBook: { book: 55, hadith: 82 },
    grade: { label: "Sahih", basis: "Sahih Muslim" },
    narrator: { bs: "Suhejb", sq: "Suhejbi", en: "Suhaib" },
    arabic:
      'حَدَّثَنَا هَدَّابُ بْنُ خَالِدٍ الأَزْدِيُّ، وَشَيْبَانُ بْنُ فَرُّوخَ، جَمِيعًا عَنْ سُلَيْمَانَ بْنِ الْمُغِيرَةِ، - وَاللَّفْظُ لِشَيْبَانَ - حَدَّثَنَا سُلَيْمَانُ، حَدَّثَنَا ثَابِتٌ، عَنْ عَبْدِ الرَّحْمَنِ بْنِ أَبِي لَيْلَى، عَنْ صُهَيْبٍ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ عَجَبًا لأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ وَلَيْسَ ذَاكَ لأَحَدٍ إِلاَّ لِلْمُؤْمِنِ إِنْ أَصَابَتْهُ سَرَّاءُ شَكَرَ فَكَانَ خَيْرًا لَهُ وَإِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ ‏"‏ ‏.‏',
    text: {
      bs: "Suhejb, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Čudno je stanje vjernika! Sve njegovo stanje je za njega dobro, a to nema niko osim vjernika: ako ga zadesi nešto radosno, on zahvali, pa mu to bude dobro; a ako ga zadesi nevolja, on se strpi, pa mu i to bude dobro.“",
      sq: "Suhejbi, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Sa e çuditshme është gjendja e besimtarit! E gjithë gjendja e tij është mirë për të, dhe këtë nuk e ka askush tjetër përveç besimtarit: nëse e gjen diçka e gëzueshme, ai falënderon, dhe kjo është mirë për të; e nëse e godet ndonjë fatkeqësi, ai bën durim, dhe edhe kjo është mirë për të.“",
      en: 'Suhaib reported that Allah\'s Messenger (ﷺ) said: "Strange are the ways of a believer for there is good in every affair of his and this is not the case with anyone else except in the case of a believer for if he has an occasion to feel delight, he thanks (God), thus there is a good for him in it, and if he gets into trouble and shows resignation (and endures it patiently), there is a good for him in it."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abdul Hamid Siddiqui" },
    },
    approved: false,
  },
  {
    day: 18,
    topic: "Kur'an",
    collection: "bukhari",
    reference: "5027",
    inBook: { book: 66, hadith: 49 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Osman", sq: "Osmani", en: "'Uthman" },
    arabic:
      'حَدَّثَنَا حَجَّاجُ بْنُ مِنْهَالٍ، حَدَّثَنَا شُعْبَةُ، قَالَ أَخْبَرَنِي عَلْقَمَةُ بْنُ مَرْثَدٍ، سَمِعْتُ سَعْدَ بْنَ عُبَيْدَةَ، عَنْ أَبِي عَبْدِ الرَّحْمَنِ السُّلَمِيِّ، عَنْ عُثْمَانَ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏ "‏ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ‏"‏‏.‏ قَالَ وَأَقْرَأَ أَبُو عَبْدِ الرَّحْمَنِ فِي إِمْرَةِ عُثْمَانَ حَتَّى كَانَ الْحَجَّاجُ، قَالَ وَذَاكَ الَّذِي أَقْعَدَنِي مَقْعَدِي هَذَا‏.‏',
    text: {
      bs: "Osman, r.a., prenosi da je Vjerovjesnik, s.a.v.s., rekao: „Najbolji od vas je onaj ko nauči Kur’an i druge ga podučava.“",
      sq: "Osmani, r.a., transmeton se Profeti ﷺ ka thënë: „Më i miri prej jush është ai që e mëson Kur’anin dhe ua mëson të tjerëve.“",
      en: 'Narrated `Uthman: The Prophet (ﷺ) said, "The best among you (Muslims) are those who learn the Qur\'an and teach it."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 19,
    topic: "Kur'an",
    collection: "muslim",
    reference: "804a",
    inBook: { book: 6, hadith: 302 },
    grade: { label: "Sahih", basis: "Sahih Muslim" },
    narrator: { bs: "Ebu Umame", sq: "Ebu Umame", en: "Abu Umama" },
    arabic:
      'حَدَّثَنِي الْحَسَنُ بْنُ عَلِيٍّ الْحُلْوَانِيُّ، حَدَّثَنَا أَبُو تَوْبَةَ، - وَهُوَ الرَّبِيعُ بْنُ نَافِعٍ - حَدَّثَنَا مُعَاوِيَةُ، - يَعْنِي ابْنَ سَلاَّمٍ - عَنْ زَيْدٍ، أَنَّهُ سَمِعَ أَبَا سَلاَّمٍ، يَقُولُ حَدَّثَنِي أَبُو أُمَامَةَ، الْبَاهِلِيُّ قَالَ سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ ‏ "‏ اقْرَءُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لأَصْحَابِهِ اقْرَءُوا الزَّهْرَاوَيْنِ الْبَقَرَةَ وَسُورَةَ آلِ عِمْرَانَ فَإِنَّهُمَا تَأْتِيَانِ يَوْمَ الْقِيَامَةِ كَأَنَّهُمَا غَمَامَتَانِ أَوْ كَأَنَّهُمَا غَيَايَتَانِ أَوْ كَأَنَّهُمَا فِرْقَانِ مِنْ طَيْرٍ صَوَافَّ تُحَاجَّانِ عَنْ أَصْحَابِهِمَا اقْرَءُوا سُورَةَ الْبَقَرَةِ فَإِنَّ أَخْذَهَا بَرَكَةٌ وَتَرْكَهَا حَسْرَةٌ وَلاَ تَسْتَطِيعُهَا الْبَطَلَةُ ‏"‏ ‏.‏ قَالَ مُعَاوِيَةُ بَلَغَنِي أَنَّ الْبَطَلَةَ السَّحَرَةُ ‏.‏',
    text: {
      bs: "Ebu Umame, r.a., kaže da je čuo Allahovog Poslanika, s.a.v.s., kako kaže: „Učite Kur’an, jer će on na Sudnjem danu doći kao zagovornik onima koji su ga učili. Učite dvije blistave – suru El-Bekare i suru Ali ‘Imran, jer će one na Sudnjem danu doći kao dva oblaka, ili dvije sjene, ili dva jata ptica poredanih u redove, braneći one koji su ih učili. Učite suru El-Bekare, jer je njeno uzimanje bereket, a njeno ostavljanje žalost, i ne mogu joj ništa čarobnjaci.“ (Muavija kaže: „Do mene je doprlo da riječ el-betale znači čarobnjaci.“)",
      sq: "Ebu Umame, r.a., thotë se e ka dëgjuar të Dërguarin e Allahut ﷺ duke thënë: „Lexoni Kur’anin, sepse ai në Ditën e Kiametit do të vijë si ndërmjetësues për ata që e kanë lexuar. Lexoni dy të ndriturat – suren El-Bekare dhe suren Ali Imran, sepse ato në Ditën e Kiametit do të vijnë si dy re, ose dy hije, ose dy tufa zogjsh të rreshtuar, duke mbrojtur ata që i kanë lexuar. Lexoni suren El-Bekare, sepse marrja e saj është bereqet, lënia e saj është pikëllim, dhe magjistarët nuk mund t’i bëjnë ballë.“ (Muavija thotë: „Më ka arritur se fjala el-betale do të thotë magjistarët.“)",
      en: "Abu Umama said he heard Allah's Messenger (ﷺ) say: \"Recite the Qur'an, for on the Day of Resurrection it will come as an intercessor for those who recite It. Recite the two bright ones, al-Baqara and Surah Al 'Imran, for on the Day of Resurrection they will come as two clouds or two shades, or two flocks of birds in ranks, pleading for those who recite them. Recite Surah al-Baqara, for to take recourse to it is a blessing and to give it up is a cause of grief, and the magicians cannot confront it.\" (Mu'awiya said: It has been conveyed to me that here Batala means magicians.)",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abdul Hamid Siddiqui" },
    },
    approved: false,
  },
  {
    day: 20,
    topic: "Dova",
    collection: "bukhari",
    reference: "1145",
    inBook: { book: 19, hadith: 26 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا عَبْدُ اللَّهِ بْنُ مَسْلَمَةَ، عَنْ مَالِكٍ، عَنِ ابْنِ شِهَابٍ، عَنْ أَبِي سَلَمَةَ، وَأَبِي عَبْدِ اللَّهِ الأَغَرِّ، عَنْ أَبِي هُرَيْرَةَ ـ رضى الله عنه ـ أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ يَقُولُ مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ مَنْ يَسْأَلُنِي فَأُعْطِيَهُ مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Naš Gospodar, Blagoslovljeni i Uzvišeni, spušta se svake noći na najbliže nebo kada ostane posljednja trećina noći i kaže: ‘Ima li ko da Me zamoli, pa da mu se odazovem? Ima li ko da od Mene nešto traži, pa da mu dam? Ima li ko da od Mene oprost traži, pa da mu oprostim?’“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Zoti ynë, i Bekuari dhe i Lartësuari, zbret çdo natë në qiellin më të afërt kur mbetet e treta e fundit e natës dhe thotë: ‘A ka ndonjë që më lutet, që t’i përgjigjem? A ka ndonjë që më kërkon diçka, që t’ia jap? A ka ndonjë që më kërkon falje, që ta fal?’“",
      en: "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Our Lord, the Blessed, the Superior, comes every night down on the nearest Heaven to us when the last third of the night remains, saying: 'Is there anyone to invoke Me, so that I may respond to invocation? Is there anyone to ask Me, so that I may grant him his request? Is there anyone seeking My forgiveness, so that I may forgive him?'\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 21,
    topic: "Posljednjih deset noći",
    collection: "bukhari",
    reference: "2024",
    inBook: { book: 32, hadith: 11 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Aiša", sq: "Aishja", en: "Aisha" },
    arabic:
      "حَدَّثَنَا عَلِيُّ بْنُ عَبْدِ اللَّهِ، حَدَّثَنَا سُفْيَانُ، عَنْ أَبِي يَعْفُورٍ، عَنْ أَبِي الضُّحَى، عَنْ مَسْرُوقٍ، عَنْ عَائِشَةَ ـ رضى الله عنها ـ قَالَتْ كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا دَخَلَ الْعَشْرُ شَدَّ مِئْزَرَهُ، وَأَحْيَا لَيْلَهُ، وَأَيْقَظَ أَهْلَهُ‏.‏",
    text: {
      bs: "Aiša, r.a., kaže: „Kada bi nastupilo posljednjih deset noći ramazana, Vjerovjesnik, s.a.v.s., bi pritegnuo svoj pojas, oživljavao noć ibadetom i budio svoju porodicu.“",
      sq: "Aishja, r.a., thotë: „Kur hynin dhjetë netët e fundit të ramazanit, Profeti ﷺ e shtrëngonte brezin, e gjallëronte natën me ibadet dhe e zgjonte familjen e tij.“",
      en: "Narrated Aisha: With the start of the last ten days of Ramadan, the Prophet (ﷺ) used to tighten his waist belt (i.e. work hard) and used to pray all the night, and used to keep his family awake for the prayers.",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 22,
    topic: "Posljednjih deset noći",
    collection: "bukhari",
    reference: "2025",
    inBook: { book: 33, hadith: 1 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Abdullah b. Omer", sq: "Abdullah ibn Omeri", en: "'Abdullah bin 'Umar" },
    arabic:
      "حَدَّثَنَا إِسْمَاعِيلُ بْنُ عَبْدِ اللَّهِ، قَالَ حَدَّثَنِي ابْنُ وَهْبٍ، عَنْ يُونُسَ، أَنَّ نَافِعًا، أَخْبَرَهُ عَنْ عَبْدِ اللَّهِ بْنِ عُمَرَ ـ رضى الله عنهما ـ قَالَ كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَعْتَكِفُ الْعَشْرَ الأَوَاخِرَ مِنْ رَمَضَانَ‏.‏",
    text: {
      bs: "Abdullah b. Omer, r.a., kaže: „Allahov Poslanik, s.a.v.s., boravio je u itikafu posljednjih deset dana ramazana.“",
      sq: "Abdullah ibn Omeri, r.a., thotë: „I Dërguari i Allahut ﷺ qëndronte në itikaf dhjetë ditët e fundit të ramazanit.“",
      en: "Narrated `Abdullah bin `Umar: Allah's Messenger (ﷺ) used to practice I`tikaf in the last ten days of the month of Ramadan.",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 23,
    topic: "Lejletul-kadr",
    collection: "bukhari",
    reference: "2017",
    inBook: { book: 32, hadith: 4 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Aiša", sq: "Aishja", en: "Aisha" },
    arabic:
      'حَدَّثَنَا قُتَيْبَةُ بْنُ سَعِيدٍ، حَدَّثَنَا إِسْمَاعِيلُ بْنُ جَعْفَرٍ، حَدَّثَنَا أَبُو سُهَيْلٍ، عَنْ أَبِيهِ، عَنْ عَائِشَةَ ـ رضى الله عنها ـ أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ تَحَرَّوْا لَيْلَةَ الْقَدْرِ فِي الْوِتْرِ مِنَ الْعَشْرِ الأَوَاخِرِ مِنْ رَمَضَانَ ‏"‏‏.‏',
    text: {
      bs: "Aiša, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Tražite Lejletul-kadr u neparnim noćima od posljednjih deset noći ramazana.“",
      sq: "Aishja, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kërkojeni Natën e Kadrit në netët tek të dhjetë netëve të fundit të ramazanit.“",
      en: 'Narrated `Aisha: Allah\'s Messenger (ﷺ) said, "Search for the Night of Qadr in the odd nights of the last ten days of Ramadan."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 24,
    topic: "Lejletul-kadr",
    collection: "bukhari",
    reference: "35",
    inBook: { book: 2, hadith: 28 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا أَبُو الْيَمَانِ، قَالَ أَخْبَرَنَا شُعَيْبٌ، قَالَ حَدَّثَنَا أَبُو الزِّنَادِ، عَنِ الأَعْرَجِ، عَنْ أَبِي هُرَيْرَةَ، قَالَ قَالَ رَسُولُ اللَّهِ صلى الله عليه وسلم ‏ "‏ مَنْ يَقُمْ لَيْلَةَ الْقَدْرِ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko provede Lejletul-kadr u namazu iz vjerovanja i nadajući se Allahovoj nagradi, bit će mu oprošteni njegovi prethodni grijesi.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush e kalon Natën e Kadrit në namaz me besim dhe duke shpresuar shpërblimin e Allahut, i falen mëkatet e mëparshme.“",
      en: "Narrated Abu Huraira: Allah's Messenger (ﷺ) said, \"Whoever establishes the prayers on the night of Qadr out of sincere faith and hoping to attain Allah's rewards (not to show off) then all his past sins will be forgiven.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 25,
    topic: "Lejletul-kadr i dova",
    collection: "tirmidhi",
    reference: "3513",
    inBook: { book: 48, hadith: 144 },
    grade: {
      label: "Sahih",
      basis:
        "Ahmad Muhammad Shakir: Sahih; Al-Albani: Sahih; Bashar Awad Maarouf: Hasan Sahih; Zubair Ali Zai: Daif",
    },
    narrator: { bs: "Aiša", sq: "Aishja", en: "Aishah" },
    arabic:
      'حَدَّثَنَا قُتَيْبَةُ بْنُ سَعِيدٍ، حَدَّثَنَا جَعْفَرُ بْنُ سُلَيْمَانَ الضُّبَعِيُّ، عَنْ كَهْمَسِ بْنِ الْحَسَنِ، عَنْ عَبْدِ اللَّهِ بْنِ بُرَيْدَةَ، عَنْ عَائِشَةَ، قَالَتْ قُلْتُ يَا رَسُولَ اللَّهِ أَرَأَيْتَ إِنْ عَلِمْتُ أَىُّ لَيْلَةٍ لَيْلَةُ الْقَدْرِ مَا أَقُولُ فِيهَا قَالَ ‏ "‏ قُولِي اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي ‏"‏ ‏.‏ قَالَ هَذَا حَدِيثٌ حَسَنٌ صَحِيحٌ ‏.‏',
    text: {
      bs: "Aiša, r.a., kaže: „Upitala sam: ‘Allahov Poslaniče, šta misliš, ako saznam koja je noć Lejletul-kadr, šta da u njoj kažem?’ Rekao je: ‘Reci: Allahumme inneke ‘afuvvun [kerimun] tuhibbul-‘afve fa‘fu ‘anni – Allahu moj, Ti si Onaj Koji prašta, [Plemeniti], voliš praštati, pa mi oprosti.’“",
      sq: "Aishja, r.a., thotë: „Pyeta: ‘O i Dërguari i Allahut, ç’mendon, nëse e di cila natë është Nata e Kadrit, çfarë të them në të?’ Tha: ‘Thuaj: Allahumme inneke afuvvun [kerimun] tuhibbul-afve fa’fu anni – O Allah, Ti je Falës, [Bujar], e do faljen, andaj më fal mua.’“",
      en: "Aishah narrated: \"I said: 'O Messenger of Allah, what is your view if I know when the Night of Al-Qadr is, then what should I say in it?' He said: 'Say: \"O Allah, indeed You are Pardoning, [Generous,] You love pardon, so pardon me (Allāhumma innaka `Afuwwun [Karīmun], tuḥibbul-`afwa fa`fu `annī).\"'\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abu Khaliyl (Darussalam)" },
    },
    approved: false,
  },
  {
    day: 26,
    topic: "Noćni namaz u ramazanu",
    collection: "bukhari",
    reference: "37",
    inBook: { book: 2, hadith: 30 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنَا إِسْمَاعِيلُ، قَالَ حَدَّثَنِي مَالِكٌ، عَنِ ابْنِ شِهَابٍ، عَنْ حُمَيْدِ بْنِ عَبْدِ الرَّحْمَنِ، عَنْ أَبِي هُرَيْرَةَ، أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ مَنْ قَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ ‏"‏‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko provede noći ramazana u namazu iz vjerovanja i nadajući se Allahovoj nagradi, bit će mu oprošteni njegovi prethodni grijesi.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush i kalon netët e ramazanit në namaz me besim dhe duke shpresuar shpërblimin e Allahut, i falen mëkatet e mëparshme.“",
      en: "Narrated Abu Huraira: Allah's Messenger (ﷺ) said: \"Whoever establishes prayers during the nights of Ramadan faithfully out of sincere faith and hoping to attain Allah's rewards (not for showing off), all his past sins will be forgiven.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 27,
    topic: "Oprost i pročišćenje",
    collection: "muslim",
    reference: "233c",
    inBook: { book: 2, hadith: 19 },
    grade: { label: "Sahih", basis: "Sahih Muslim" },
    narrator: { bs: "Ebu Hurejre", sq: "Ebu Hurejra", en: "Abu Huraira" },
    arabic:
      'حَدَّثَنِي أَبُو الطَّاهِرِ، وَهَارُونُ بْنُ سَعِيدٍ الأَيْلِيُّ، قَالاَ أَخْبَرَنَا ابْنُ وَهْبٍ، عَنْ أَبِي صَخْرٍ، أَنَّ عُمَرَ بْنَ إِسْحَاقَ، مَوْلَى زَائِدَةَ حَدَّثَهُ عَنْ أَبِيهِ، عَنْ أَبِي هُرَيْرَةَ، أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم كَانَ يَقُولُ ‏ "‏ الصَّلَوَاتُ الْخَمْسُ وَالْجُمُعَةُ إِلَى الْجُمُعَةِ وَرَمَضَانُ إِلَى رَمَضَانَ مُكَفِّرَاتٌ مَا بَيْنَهُنَّ إِذَا اجْتَنَبَ الْكَبَائِرَ ‏"‏ ‏.‏',
    text: {
      bs: "Ebu Hurejre, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Pet dnevnih namaza, od džume do džume i od ramazana do ramazana iskupljuju grijehe počinjene između njih, sve dok se čovjek kloni velikih grijeha.“",
      sq: "Ebu Hurejra, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Pesë namazet, nga xhumaja në xhuma dhe nga ramazani në ramazan, i shlyejnë mëkatet e bëra ndërmjet tyre, për sa kohë që njeriu i shmanget mëkateve të mëdha.“",
      en: 'Abu Huraira reported: Verily the Messenger of Allah (ﷺ) said: "The five (daily) prayers and from one Friday prayer to the (next) Friday prayer, and from Ramadhan to Ramadhan are expiations for the (sins) committed in between (their intervals) provided one shuns the major sins."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abdul Hamid Siddiqui" },
    },
    approved: false,
  },
  {
    day: 28,
    topic: "Iskrenost namjere",
    collection: "bukhari",
    reference: "1",
    inBook: { book: 1, hadith: 1 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Omer b. el-Hattab", sq: "Omer ibn el-Hattabi", en: "'Umar bin Al-Khattab" },
    arabic:
      'حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، يَقُولُ : " إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ',
    text: {
      bs: "Omer b. el-Hattab, r.a., kaže da je čuo Allahovog Poslanika, s.a.v.s., kako kaže: „Djela se vrednuju samo prema namjerama i svakom čovjeku pripada samo ono što je namjeravao. Pa ko je učinio hidžru radi dunjaluka koji želi postići ili radi žene kojom se želi oženiti, njegova je hidžra radi onoga radi čega je učinio hidžru.“",
      sq: "Omer ibn el-Hattabi, r.a., thotë se e ka dëgjuar të Dërguarin e Allahut ﷺ duke thënë: „Veprat vlerësohen vetëm sipas qëllimeve dhe çdo njeriu i takon vetëm ajo që ka pasur për qëllim. Kush ka bërë hixhret për ndonjë të mirë të kësaj bote që dëshiron ta arrijë, ose për një grua me të cilën dëshiron të martohet, hixhreti i tij është për atë për të cilën ka bërë hixhret.“",
      en: "Narrated 'Umar bin Al-Khattab: I heard Allah's Messenger (ﷺ) saying, \"The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended. So whoever emigrated for worldly benefits or for a woman to marry, his emigration was for what he emigrated for.\"",
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 29,
    topic: "Postojanost u dobru",
    collection: "bukhari",
    reference: "6464",
    inBook: { book: 81, hadith: 53 },
    grade: { label: "Sahih", basis: "Sahih al-Bukhari" },
    narrator: { bs: "Aiša", sq: "Aishja", en: "Aisha" },
    arabic:
      'حَدَّثَنَا عَبْدُ الْعَزِيزِ بْنُ عَبْدِ اللَّهِ، حَدَّثَنَا سُلَيْمَانُ، عَنْ مُوسَى بْنِ عُقْبَةَ، عَنْ أَبِي سَلَمَةَ بْنِ عَبْدِ الرَّحْمَنِ، عَنْ عَائِشَةَ، أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ سَدِّدُوا وَقَارِبُوا، وَاعْلَمُوا أَنْ لَنْ يُدْخِلَ أَحَدَكُمْ عَمَلُهُ الْجَنَّةَ، وَأَنَّ أَحَبَّ الأَعْمَالِ أَدْوَمُهَا إِلَى اللَّهِ، وَإِنْ قَلَّ ‏"‏',
    text: {
      bs: "Aiša, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Činite dobro ispravno i umjereno i znajte da nikoga od vas njegova djela neće uvesti u Džennet. A Allahu je najdraže djelo ono koje je najpostojanije, makar bilo i malo.“",
      sq: "Aishja, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Bëni vepra të drejta dhe të matura dhe dijeni se askënd prej jush nuk do ta fusë vepra e tij në Xhenet. Vepra më e dashur te Allahu është ajo që është më e vazhdueshme, edhe nëse është e pakët.“",
      en: 'Narrated `Aisha: Allah\'s Messenger (ﷺ) said, "Do good deeds properly, sincerely and moderately and know that your deeds will not make you enter Paradise, and that the most beloved deed to Allah is the most regular and constant even if it were little."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Muhammad Muhsin Khan" },
    },
    approved: false,
  },
  {
    day: 30,
    topic: "Nakon ramazana",
    collection: "muslim",
    reference: "1164a",
    inBook: { book: 13, hadith: 264 },
    grade: { label: "Sahih", basis: "Sahih Muslim" },
    narrator: { bs: "Ebu Ejjub el-Ensari", sq: "Ebu Ejjub el-Ensariu", en: "Abu Ayyub al-Ansari" },
    arabic:
      'حَدَّثَنَا يَحْيَى بْنُ أَيُّوبَ، وَقُتَيْبَةُ بْنُ سَعِيدٍ، وَعَلِيُّ بْنُ حُجْرٍ، جَمِيعًا عَنْ إِسْمَاعِيلَ، - قَالَ ابْنُ أَيُّوبَ حَدَّثَنَا إِسْمَاعِيلُ بْنُ جَعْفَرٍ، - أَخْبَرَنِي سَعْدُ بْنُ سَعِيدِ بْنِ قَيْسٍ، عَنْ عُمَرَ، بْنِ ثَابِتِ بْنِ الْحَارِثِ الْخَزْرَجِيِّ عَنْ أَبِي أَيُّوبَ الأَنْصَارِيِّ، - رضى الله عنه - أَنَّهُ حَدَّثَهُ أَنَّ رَسُولَ اللَّهِ صلى الله عليه وسلم قَالَ ‏ "‏ مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ ‏"‏ ‏.‏',
    text: {
      bs: "Ebu Ejjub el-Ensari, r.a., prenosi da je Allahov Poslanik, s.a.v.s., rekao: „Ko isposti ramazan, a zatim za njim isposti šest dana ševala, kao da je postio stalno.“",
      sq: "Ebu Ejjub el-Ensariu, r.a., transmeton se i Dërguari i Allahut ﷺ ka thënë: „Kush e agjëron ramazanin dhe pas tij agjëron gjashtë ditë të shevalit, është sikur të ketë agjëruar përherë.“",
      en: 'Abu Ayyub al-Ansari (Allah be pleased with him) reported Allah\'s Messenger (ﷺ) as saying: "He who observed the fast of Ramadan and then followed it with six (fasts) of Shawwal, it would be as if he fasted perpetually."',
    },
    translation: {
      bs: { status: "draft" },
      sq: { status: "draft" },
      en: { status: "published", by: "Abdul Hamid Siddiqui" },
    },
    approved: false,
  },
];

/** The collection's name in each language. */
export const collectionName: Record<HadithCollection, Record<Locale, string>> = {
  bukhari: { bs: "Sahih el-Buhari", sq: "Sahih el-Buhari", en: "Sahih al-Bukhari" },
  muslim: { bs: "Sahih Muslim", sq: "Sahih Muslim", en: "Sahih Muslim" },
  tirmidhi: { bs: "Sunen et-Tirmizi", sq: "Sunen et-Tirmidhi", en: "Jami` at-Tirmidhi" },
};

/** Whether every hadith may be shown to the public in this language. */
export function hadithReady(locale: Locale) {
  return hadiths.every((h) => h.approved && h.translation[locale].status !== "draft");
}
