import type { Platform, SocialPost, SocialProfile } from "@/lib/social/types";

/**
 * Homepage social cards: content that is not fetched.
 *
 * manualPosts — fill in a real post (copy its link, date, caption and image
 * into /public/images/social/) to show it until the Meta Graph API is
 * connected. Leave a platform as `undefined` to show its profile card instead.
 * Never enter a post that does not exist.
 *
 * Example:
 *   instagram: {
 *     kind: "post", platform: "instagram", source: "manual",
 *     url: "https://www.instagram.com/p/…/",
 *     date: "2026-10-01T10:00:00+02:00",
 *     text: "…caption…",
 *     media: { src: "/images/social/instagram.jpg", alt: "…", width: 1080, height: 1350 },
 *   },
 */
export const manualPosts: Partial<Record<Platform, SocialPost>> = {
  instagram: undefined,
  facebook: undefined,
};

/** Shown when there is no post: the official profiles, with real campus photographs. */
export const socialProfiles: Record<Platform, SocialProfile> = {
  instagram: {
    kind: "profile",
    platform: "instagram",
    url: "https://www.instagram.com/medresacg/",
    handle: "@medresacg",
    text: "Fotografije i kratki trenuci iz svakodnevice Medrese – iz učionica, internata i sa takmičenja.",
    media: {
      src: "/images/life-calligraphy.jpg",
      alt: "Kaligrafija na unutrašnjosti kupole u Medresi",
      width: 1800,
      height: 1350,
    },
  },
  facebook: {
    kind: "profile",
    platform: "facebook",
    url: "https://www.facebook.com/medresacg",
    handle: "medresacg",
    text: "Vijesti, obavještenja i događaji iz Medrese, prvo na našoj Facebook stranici.",
    media: {
      src: "/images/story-arch.jpg",
      alt: "Ulaz s lukom i minaretom u dvorištu Medrese",
      width: 1800,
      height: 1350,
    },
  },
};
