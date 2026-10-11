import type { PageId } from "@/i18n/routes";
import type { ShareImage } from "@/i18n/metadata";

/*
 * The share image of each page: a landscape photograph the page itself shows
 * (unchanged files under /public). Pages without one use the campus from the
 * air (src/seo/config.ts). Sizes are the files' real pixel sizes.
 */
export const pageShareImages: Partial<Record<PageId, Omit<ShareImage, "alt">>> = {
  historijat: { url: "/images/historijat/medresa-zrak.jpg", width: 1536, height: 1024 },
  oiu: { url: "/images/oiu/amfiteatar.jpg", width: 1536, height: 1024 },
  nastava: { url: "/images/nastava/dvoriste.jpg", width: 1536, height: 1024 },
  alumni: { url: "/images/alumni/01.jpg", width: 2400, height: 1688 },
  galerija: { url: "/images/galerija/01.jpg", width: 2048, height: 1152 },
  donacije: { url: "/images/donacije/minaret.jpg", width: 2048, height: 1536 },
};
