/*
 * Ramadan edition, on the admissions card: a fine champagne-gold line traces the
 * card's rounded edge once, a small light running ahead of it, and stays as the
 * card's border; now and then one quiet sweep of light goes round. Laid over the
 * card's own border (it follows whatever the card holds); hidden unless
 * data-seasonal-theme="ramadan" (src/seasonal/ramadan.css).
 */
export function RamadanCardBorder() {
  return (
    <span aria-hidden className="rmd rmd-card">
      <svg className="rmd-card-svg">
        <rect className="rmd-card-line" width="100%" height="100%" rx="22" pathLength={1} />
        <rect className="rmd-card-spark" width="100%" height="100%" rx="22" pathLength={1} />
      </svg>
    </span>
  );
}
