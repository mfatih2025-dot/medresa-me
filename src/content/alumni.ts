import type { Locale } from "@/i18n/config";
import type { Localized } from "@/i18n/types";
/**
 * Alumni — medresa.me/alumni: its title, introduction and the generations,
 * each with the pano published on its own generation page.
 *
 * Generations are data: the page derives every composition from a generation's
 * position, so a later Generacija XVI is one more entry (with its two files).
 *
 *   pano.src    a 2400px master for the page (Next.js makes responsive sizes)
 *   pano.full   the high-resolution file for the viewer only (≤ 6000px, names
 *               readable), loaded when a pano is opened
 *   source      where it came from: the generation page, the original upload
 *               and its original size (for the audit; XII is only 1600px there)
 *
 * The source's per-generation dates („September 12, 2025 · 8:00 am“) are its
 * events plugin's publishing times, not historical dates, and are not shown.
 */
export type Generation = {
  number: number;
  roman: string;
  pano: {
    src: string;
    full: string;
    width: number;
    height: number;
    fullWidth: number;
    fullHeight: number;
    blur: string;
  };
  source: { page: string; file: string; original: readonly number[] };
};

const bs = {
  title: "Alumni",
  intro:
    "Generacije naših učenika ostavile su trag znanja, prijateljstva i zajedništva. Njihov doprinos zajednici zauvijek svjedoči o snazi Medrese „Mehmed Fatih“.",
  generationsHeading: "Generacije",
  /** The source's label for each generation, and its link text. */
  label: "Generacija",
  open: "Otvori pano",
  /** Interface of the index and the viewer (assistive technology and controls). */
  ui: {
    index: "indeks",
    pano: "Pano",
    close: "Zatvori",
    prev: "Prethodna generacija",
    next: "Sljedeća generacija",
    zoomOut: "Umanji",
    fit: "Prikaži cijeli pano",
    zoomIn: "Uvećaj",
  },
};

export const generations: readonly Generation[] = [
  {
    number: 1,
    roman: "I",
    pano: {
      src: "/images/alumni/01.jpg",
      full: "/images/alumni/01-full.jpg",
      width: 2400,
      height: 1688,
      fullWidth: 6000,
      fullHeight: 4220,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIDBv/EACMQAAICAgECBwAAAAAAAAAAAAECAxEAIQQSwTFBQnGBobH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/EABYRAQEBAAAAAAAAAAAAAAAAAAARAf/aAAwDAQACEQMRAD8A0kTl5ykagm/NmHb3xj1LG7WjhNNRcV+5KNJIJnZCD4jZrR+MrLNyHikRlSnB9R19ZGSGDjuHisa3sWe+GJxIKitqsm8MgP/Z",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija1/",
      file: "2024/08/PANO-1a-generacija-2.jpg",
      original: [11945, 8401],
    },
  },
  {
    number: 2,
    roman: "II",
    pano: {
      src: "/images/alumni/02.jpg",
      full: "/images/alumni/02-full.jpg",
      width: 2400,
      height: 1692,
      fullWidth: 6000,
      fullHeight: 4232,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAIBAwb/xAAgEAACAQMEAwAAAAAAAAAAAAABAgADETEEEiFSIkFx/8QAFgEBAQEAAAAAAAAAAAAAAAAAAQME/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAERMf/aAAwDAQACEQMRAD8A0NNb1SLEknuRGZAFO1w/yo2JCK6VSRtvzaWVHL0z4jd7MipDQ7RdPcIc57XhG0yEUzjkwgL0/9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija2/",
      file: "2024/08/PANO-2a-generacija.jpg",
      original: [12232, 8627],
    },
  },
  {
    number: 3,
    roman: "III",
    pano: {
      src: "/images/alumni/03.jpg",
      full: "/images/alumni/03-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 4724,
      fullHeight: 3307,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAMBAgX/xAAgEAACAgEEAwEAAAAAAAAAAAABAgARAxITMUFRYdHx/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAIDBP/EABcRAQEBAQAAAAAAAAAAAAAAAAARAVH/2gAMAwEAAhEDEQA/ANrcYhqCEjmmIHP7BMj3WjGaHTn5FlGTOWU9xuR2dAulV8kHmZZxZAyub0bVe2b5CWwY7SyaN9Qi7KI//9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija3/",
      file: "2024/08/PANO-3a-generacija.jpg",
      original: [4724, 3307],
    },
  },
  {
    number: 4,
    roman: "IV",
    pano: {
      src: "/images/alumni/04.jpg",
      full: "/images/alumni/04-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 4724,
      fullHeight: 3307,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAECAwX/xAAoEAACAgEBBAsAAAAAAAAAAAABAgMRABIhIpGhEyMxQUJRYWJxsdH/xAAVAQEBAAAAAAAAAAAAAAAAAAACBP/EABcRAQEBAQAAAAAAAAAAAAAAAAEAEWH/2gAMAwEAAhEDEQA/ANZV0JvRnzIVxVfOCSxPQSOzXhezzypJNI2D0PYL5ZLpkB3IQh7ypG0cMkwqFZ9cCQsQI90gB+sMQlUXangPzDAhsh5f/9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-iv-otvori-pano/",
      file: "2024/08/PANO-4a-generacija.jpg",
      original: [4724, 3307],
    },
  },
  {
    number: 5,
    roman: "V",
    pano: {
      src: "/images/alumni/05.jpg",
      full: "/images/alumni/05-full.jpg",
      width: 2400,
      height: 1800,
      fullWidth: 4724,
      fullHeight: 3543,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAPABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDAQT/xAAlEAACAQMCBQUAAAAAAAAAAAABAgADERITIgQhMTIzQVFxkcH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABsRAAICAwEAAAAAAAAAAAAAAAABAgMTQVJi/9oADAMBAAIRAxEAPwDs1aii5YH4Im1G4injkoUN27wfySaqHQDPE9bEkxVsrg6i2Hpul8cdxJqT6KNUq38ifYhEesS3I5D3uYRKpcoLs9M//9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-v-otvori-pano/",
      file: "2024/08/PANO-5a-generacija.jpg",
      original: [4724, 3543],
    },
  },
  {
    number: 6,
    roman: "VI",
    pano: {
      src: "/images/alumni/06.jpg",
      full: "/images/alumni/06-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 2835,
      fullHeight: 1984,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAIBAwb/xAAiEAABBAECBwAAAAAAAAAAAAABAAIDIRExUQQSIkFh4fD/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAGBEAAwEBAAAAAAAAAAAAAAAAAAIRMQH/2gAMAwEAAhEDEQA/ANFDGS4AEXvn7dS6ExMyXsOaoO8e0sT+WRutpuMmLomB2uTaFZBW0pArXO6EkXU0kHuhA0onMP/Z",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-vi-otvori-pano/",
      file: "2024/08/PANO-2a-i-6a-generacija.jpg",
      original: [2835, 1984],
    },
  },
  {
    number: 7,
    roman: "VII",
    pano: {
      src: "/images/alumni/07.jpg",
      full: "/images/alumni/07-full.jpg",
      width: 2400,
      height: 1800,
      fullWidth: 4724,
      fullHeight: 3543,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAPABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAQCAwX/xAAmEAABAwIEBgMAAAAAAAAAAAABAAIDESESIlFxBDEyQWHwseHx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwL/xAAdEQEAAQMFAAAAAAAAAAAAAAABABESMgIDUVKR/9oADAMBAAIRAxEAPwDQD5WsrQP5a1+FN44hsjcrMLr5STbzolhLHS5bcafSYZPG5ooQPdkth1kXvMrkE+LqA92QiadgeKCtu34hIbZTE8hutrkz/9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-vii-otvori-pano/",
      file: "2024/08/PANO-7a-generacija.jpg",
      original: [4724, 3543],
    },
  },
  {
    number: 8,
    roman: "VIII",
    pano: {
      src: "/images/alumni/08.jpg",
      full: "/images/alumni/08-full.jpg",
      width: 2400,
      height: 1679,
      fullWidth: 6000,
      fullHeight: 4200,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAIEBf/EACAQAQACAgIBBQAAAAAAAAAAAAECEQADElExBEFSsdH/xAAXAQADAQAAAAAAAAAAAAAAAAABAgME/8QAFxEBAQEBAAAAAAAAAAAAAAAAABEBMf/aAAwDAQACEQMRAD8A3ZQTYhKIF3yv9xZnFJO7SnliXf3jvK26u0yZJsm337cjGnOrNEYbIsgfPeGHo7jqR+XeGJAr/9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-viii-otvori-pano/",
      file: "2024/08/PANO-8a-generacija.jpg",
      original: [12004, 8402],
    },
  },
  {
    number: 9,
    roman: "IX",
    pano: {
      src: "/images/alumni/09.jpg",
      full: "/images/alumni/09-full.jpg",
      width: 2400,
      height: 1800,
      fullWidth: 4724,
      fullHeight: 3543,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAPABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAIDBAX/xAAjEAACAgEDAwUAAAAAAAAAAAABAgADEQQhMRITwTJBYXFy/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAIDBP/EABkRAQACAwAAAAAAAAAAAAAAAAABEQISIf/aAAwDAQACEQMRAD8A7KUV2PhAh/QPP3HbQH1BaQp42Y+Yqo/bDNt8A+ZoW8dGHOTnGcTPULdSq0ta1qH6Wb3I2zCXO3HEIuuIuX//2Q==",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-ix-otvori-pano/",
      file: "2024/08/PANO-9a-generacija.jpg",
      original: [4724, 3543],
    },
  },
  {
    number: 10,
    roman: "X",
    pano: {
      src: "/images/alumni/10.jpg",
      full: "/images/alumni/10-full.jpg",
      width: 2400,
      height: 1800,
      fullWidth: 6000,
      fullHeight: 4501,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAPABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAMEAf/EACMQAAEEAQQBBQAAAAAAAAAAAAEAAgMRBBITIUExFCJRYdH/xAAVAQEBAAAAAAAAAAAAAAAAAAAEA//EABgRAAMBAQAAAAAAAAAAAAAAAAABEQMC/9oADAMBAAIRAxEAPwCmSOJ2SdMRLO9bzd9+FbHjbLWk7IBFj3EkrXYx3X1HYt3ivlN9PM6jpJr7H6k6dVEMs1y6W48sQha3mxwa4FoS4caRrSHDtCLBlR//2Q==",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-x-otvori-pano/",
      file: "2024/08/PANOA-10a-generacija.jpg",
      original: [9638, 7230],
    },
  },
  {
    number: 11,
    roman: "XI",
    pano: {
      src: "/images/alumni/11.jpg",
      full: "/images/alumni/11-full.jpg",
      width: 2400,
      height: 1675,
      fullWidth: 6000,
      fullHeight: 4187,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAQDBf/EACEQAAICAQQCAwAAAAAAAAAAAAECAAMRBCEiQRMxMsHR/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgED/8QAHREAAQMFAQAAAAAAAAAAAAAAAAECUQMEERQVMf/aAAwDAQACEQMRAD8AqZUZssGbJ3w5H1A0ylQRW2D35T+TZNNy9g9bmW1UhK9+RIjdXRDBlnn0iqretSq5xntsxOjWihfiDEO0sF5zZP/Z",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-xi-otvori-pano/",
      file: "2024/08/PANO-11a-generacija.jpg",
      original: [12002, 8376],
    },
  },
  {
    number: 12,
    roman: "XII",
    pano: {
      src: "/images/alumni/12.jpg",
      full: "/images/alumni/12-full.jpg",
      width: 1600,
      height: 1120,
      fullWidth: 1600,
      fullHeight: 1120,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAMBAgb/xAAhEAABAwMEAwAAAAAAAAAAAAABAAMRAhIhBCIjMVFh4f/EABQBAQAAAAAAAAAAAAAAAAAAAAL/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDT6p/kqFIIgkdApDrbmOSk+dn1W1TcPudZqKHDi71KJF224QoExkyhAn//2Q==",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-xii-otvori-pano/",
      file: "2024/08/PANO-12a-generacija.jpg",
      original: [1600, 1120],
    },
  },
  {
    number: 13,
    roman: "XIII",
    pano: {
      src: "/images/alumni/13.jpg",
      full: "/images/alumni/13-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 6000,
      fullHeight: 4200,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAIBAwQF/8QAIBAAAQUAAQUBAAAAAAAAAAAAAQACAxEhMRJBYXHB4f/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFREBAQAAAAAAAAAAAAAAAAAAAAH/2gAMAwEAAhEDEQA/AOpFBW4bHdv6kldWULB0UdV8bxQwrLID1OOc/VEgpCLJoEeEKWnn2hFS/9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-xiii-otvori-pano/",
      file: "2024/08/PANO-13a-generacija.jpg",
      original: [11812, 8268],
    },
  },
  {
    number: 14,
    roman: "XIV",
    pano: {
      src: "/images/alumni/14.jpg",
      full: "/images/alumni/14-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 2835,
      fullHeight: 1984,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAMEAgX/xAAgEAABBAEEAwAAAAAAAAAAAAABAAIDESESMTJRgcHh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDpQtAGWtJ7I+pgaZG8avtpHtLaarZUxuAj8qAllg0vwd84GyFuSW3cUIS//9k=",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-xiv-otvori-pano/",
      file: "2024/08/PANO-14a-generacija-1.jpg",
      original: [2835, 1984],
    },
  },
  {
    number: 15,
    roman: "XV",
    pano: {
      src: "/images/alumni/15.jpg",
      full: "/images/alumni/15-full.jpg",
      width: 2400,
      height: 1680,
      fullWidth: 6000,
      fullHeight: 4200,
      blur: "data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAOABQDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAECBf/EAB0QAAICAwEBAQAAAAAAAAAAAAECABESIVGRMsH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAQL/xAAVEQEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEQMRAD8A2UTos9KxqusimuFa/YgVCnIeSQ6WBifIMhBjZJGhyEr4NQmKr//Z",
    },
    source: {
      page: "https://www.medresa.me/generacija/generacija-xv-otvori-pano/",
      file: "2026/05/PETNAESTA.jpg",
      original: [11812, 8268],
    },
  },
];

/** English: the source's intro (medresa.me English page, revised); the rest written for this page. */
const en: Localized<typeof bs> = {
  title: "Alumni",
  intro:
    "Generations of our students have left a trace of knowledge, friendship and togetherness. Their contribution to the community will always bear witness to the strength of the Medresa “Mehmed Fatih”.",
  generationsHeading: "Generations",
  label: "Generation",
  open: "Open the panel",
  ui: {
    index: "index",
    pano: "Graduation panel",
    close: "Close",
    prev: "Previous generation",
    next: "Next generation",
    zoomOut: "Zoom out",
    fit: "Show the whole panel",
    zoomIn: "Zoom in",
  },
};

/** Shqip: the source's intro (medresa.me Albanian page, revised); the rest written for this page. */
const sq: Localized<typeof bs> = {
  title: "Alumni",
  intro:
    "Gjeneratat e nxënësve tanë kanë lënë gjurmë dijeje, miqësie dhe bashkimi. Kontributi i tyre në bashkësi do të dëshmojë përgjithmonë për forcën e Medresesë “Mehmed Fatih”.",
  generationsHeading: "Gjeneratat",
  label: "Gjenerata",
  open: "Hap tablonë",
  ui: {
    index: "indeksi",
    pano: "Tabloja",
    close: "Mbyll",
    prev: "Gjenerata e mëparshme",
    next: "Gjenerata e radhës",
    zoomOut: "Zvogëlo",
    fit: "Shfaq gjithë tablonë",
    zoomIn: "Zmadho",
  },
};

export const alumniContent: Record<Locale, Localized<typeof bs>> = { bs, sq, en };
/** The Bosnian master text (kept for existing callers). */
export const alumni = bs;
