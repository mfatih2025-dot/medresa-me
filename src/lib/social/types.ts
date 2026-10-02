/** What the homepage social cards render, whatever the source. */

export type Platform = "instagram" | "facebook";

export type SocialMedia = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

/** A real post: from the Meta Graph API, or entered by hand in `content/social.ts`. */
export type SocialPost = {
  kind: "post";
  platform: Platform;
  /** Link to the original post. */
  url: string;
  /** ISO 8601 publication time. */
  date: string;
  /** Full caption/message; the UI shortens it. */
  text: string;
  media?: SocialMedia;
  source: "meta" | "manual";
};

/** No post available: the card presents the official profile instead (never a fake post). */
export type SocialProfile = {
  kind: "profile";
  platform: Platform;
  url: string;
  handle: string;
  text: string;
  media: SocialMedia;
};

export type SocialItem = SocialPost | SocialProfile;
