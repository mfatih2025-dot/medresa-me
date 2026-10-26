# SEO migracija: stari WordPress medresa.me → novi Next.js/Vercel

Audit pripremljen na razvojnoj grani `claude/seo-migration-audit`, oktobar 2026. Produkcija, DNS i dizajn nisu mijenjani.

## Izvori starih URL-ova

1. **Sitemap starog sajta** (All in One SEO): `/sitemap.xml` → `post-`, `page-`, `category-`, `team-category-`, `rt-research-category-`, `rt-program-category-`, `tribe_events_cat-sitemap.xml`, uključujući `hreflang` alternative za `/sq/` i `/en/`.
2. **WordPress REST API** starog sajta: sve javne objave (17), stranice (32) i mediji (510 javnih, od toga 5 PDF-ova).
3. **Linkovi koje stari sajt sam objavljuje**: stranice generacija (`/generacija/…`) i demo unosi teme (`/rt-program/…`, `/rt-research/…`, `/teams/…`), kojih nema u sitemap-u ni u REST-u.

Uzeti su samo URL-ovi koje stari server vraća sa **HTTP 200**. Nijedan URL nije izmišljen.

## Rezultat

**Ukupno pronađeno: 409 starih URL-ova** (bs 143 · sq 133 · en 133).

| Vrsta | Ukupno | Tačan ekvivalent | Ista tema | Vanjski | 410 Gone | Neriješeno |
|---|---|---|---|---|---|---|
| Vijesti | 51 | 51 | 0 | 0 | 0 | 0 |
| Stranice | 95 | 50 | 6 | 3 | 36 | 0 |
| Generacije (Alumni) | 45 | 45 | 0 | 0 | 0 | 0 |
| Kategorije | 12 | 0 | 12 | 0 | 0 | 0 |
| Paginacija vijesti | 9 | 0 | 9 | 0 | 0 | 0 |
| Događaji (Events Calendar) | 21 | 0 | 6 | 0 | 15 | 0 |
| PDF dokumenti | 5 | 0 | 3 | 0 | 0 | 2 |
| Demo sadržaj teme | 171 | 0 | 0 | 0 | 171 | 0 |
| **Ukupno** | **409** | **146** | **36** | **3** | **222** | **2** |

- **Tačan ekvivalent** (146): ista stranica, isti članak ili ista generacija, u istom jeziku. Od toga 6 adresa postoji nepromijenjeno; ostale idu preko 301/308.
- **Ista tema** (36): stari sadržaj nema posebnu stranicu na novom sajtu (kategorije, paginacija, PDF), pa vodi na stranicu koja nosi tu temu. Nikad na naslovnu.
- **410 Gone** (222): stranice bez Medresa sadržaja (demo programi/istraživanja/osoblje teme, prodavnica, registracije, Events šabloni). Pretraživači ih brišu iz indeksa.

Na naslovnu vode samo naslovna i `/home/`, njena druga kopija na starom sajtu.

## Neriješeno (2)

| Stari URL | Šta je | Zašto nema preusmjeravanja |
|---|---|---|
| `/wp-content/uploads/2024/08/Spisak1.pdf` | Spisak kandidata primljenih u I razred 2025/2026 (sken, 3 str.) | Nema tog dokumenta ni stranice za prošlu godinu. Odluka: postaviti PDF na novi sajt ili prihvatiti 404/410. |
| `/wp-content/uploads/2024/07/pdf_files.pdf` | **Nije PDF: fajl počinje sa `<?php`** (PHP kod podmetnut kao PDF na starom sajtu) | Ne treba preusmjeravati. **Sigurnosno: preporučujem da se fajl odmah ukloni sa starog servera i provjeri WordPress.** |

## Napomene

- **Generacije** vode na mjesto svake generacije na stranici Alumni (`/alumni#generacija-N`, `/sq/alumni#…`, `/en/alumni#…`), jer trenutni `main` nema posebne stranice generacija. Kada se uvede neobjavljeni Alumni commit `6fd7466`, koji ima stranicu za svaku generaciju, njegova preusmjeravanja treba da zamijene ova (preklapaju se u `src/seo/legacy.ts`).
- **Dokumenti:** novi sajt ne čuva kopije starih PDF-ova. Konkurs 2026/27 (bs, alb) i spisak primljenih 2026/27 vode na Upis (`/upis`, `/sq/regjistrimi`), gdje su trenutni rezultati i PDF. Ako je bitno da stari linkovi i dalje otvaraju same dokumente, PDF-ove treba postaviti na novi sajt.
- **Privatnost:** spiskovi primljenih (2025/26 i 2026/27) sadrže imena maloljetnika i javno su indeksirani na starom sajtu. Vrijedi odlučiti da li ih treba zadržati javno.
- **Slike:** 510 slika iz `/wp-content/uploads/` nije preusmjereno; novi sajt ima svoje kopije pod drugim adresama. To je očekivano i ne utiče na stranice.
- **Lanac preusmjeravanja:** stari URL-ovi sa kosom crtom na kraju idu u dva koraka (308 uklanja kosu crtu, pa 301). Google to prati bez gubitka. Optimizacija u jedan korak je moguća, ali nije neophodna.

## Tehnički SEO novog sajta

Provjereno na svih 93 odredišnih stranica:

- **canonical**: na samu stranicu, `https://www.medresa.me`, 93/93.
- **hreflang** bs/sq/en/x-default sa samoreferencom: 93/93; uzajamnost: 0 grešaka.
- **sitemap.xml**: 96 URL-ova sa hreflang alternativama; sva odredišta su u njemu. Stari sitemap-ovi (`/sitemap_index.xml`, `/post-sitemap.xml` …) vode na `/sitemap.xml`.
- **robots.txt**: `Allow: /`, zatvoreni `/admin`, `/ulaz7`, `/api/` (osim slika vijesti), `Sitemap: https://www.medresa.me/sitemap.xml`. Stranice imaju `index, follow`.

## Fajlovi

- `docs/seo-migration/url-map.csv`: svih 409 starih URL-ova sa novom adresom, stvarnim lancem statusa, kvalitetom podudaranja i napomenom.
- `src/seo/legacy.ts`: nova pravila (generacije, dokumenti, 410 za demo sadržaj teme i `my-account`).
- `tests/seo-legacy-redirects.test.mjs`: regresioni test za nova pravila.
