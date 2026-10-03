import { manualPosts, socialProfiles } from "@/content/social";
import "server-only";
import { latestFacebookPost } from "./providers/facebook";
import { latestInstagramPost } from "./providers/instagram";
import type { Platform, SocialItem } from "./types";

export type { Platform, SocialItem, SocialPost, SocialProfile } from "./types";

/**
 * The homepage social cards, per platform, in order of preference:
 *   1. the latest post from its provider (Instagram: live; Facebook: not yet connected),
 *   2. a post entered by hand in `content/social.ts` (when filled in),
 *   3. the official profile — presented as a profile, never as a post.
 * Server-only: call it from a server component.
 */
export async function getLatestSocial(): Promise<Record<Platform, SocialItem>> {
  const [instagram, facebook] = await Promise.all([latestInstagramPost(), latestFacebookPost()]);
  return {
    instagram: instagram ?? manualPosts.instagram ?? socialProfiles.instagram,
    facebook: facebook ?? manualPosts.facebook ?? socialProfiles.facebook,
  };
}
