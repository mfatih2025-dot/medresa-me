# medresa-me

Official website of Medresa „Mehmed Fatih“ – Podgorica. Next.js (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Kanit (next/font). Vercel-ready (zero config).

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint && npm run typecheck && npm run build
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/content/site.ts` | Language-neutral facts, contacts, routes (slugs mirror medresa.me) |
| `src/content/bs.ts` | All homepage copy + image references (Bosnian/Montenegrin). Add `sq.ts` / `en.ts` implementing `Dictionary` |
| `src/i18n/config.ts` | Locale registry (bs enabled; sq, en reserved) |
| `src/components/layout` | Signature header (CSS lays out the large state; scroll maps to transforms/opacity only), menu/search overlays, footer |
| `src/components/sections` | One file per homepage chapter, in story order |
| `src/components/ui` | `ParallaxImage`, `Reveal`, `LineReveal`, icons |
| `src/hooks` | `useMotionProfile` (reduced-motion + phone tuning), `useScrollProgress`, `useScrollDrift` (velocity) |
| `src/app/[slug]` | Placeholder pages for the existing medresa.me routes (Historijat, Upis, Alumni …) |

## Replacing imagery

Photos live in `public/images` and are referenced only from `src/content/bs.ts` (`placeholder: true` marks temporary ones, taken from the current medresa.me gallery). The logo is the official roundel at `public/brand/medresa-logo.png`. Swap the file or the `src`; layout and crops (`position`) are data-driven.

## Motion principles

Native scrolling only (no scroll hijacking). Scroll position drives parallax, clip-path masks, the header transformation and the sticky *Generacije* stage. Phones and coarse pointers get shorter travel and no velocity response; `prefers-reduced-motion` disables all of it and shows final states.

## Roadmap hooks

Sanity (replace `getDictionary` data source), `app/[locale]` routing, real pages for each slug, social feed (mount point `#social-feed`), `Vijesti` listing.
