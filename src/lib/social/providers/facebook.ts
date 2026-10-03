import "server-only";
import type { SocialPost } from "../types";

/**
 * Facebook Page: not connected yet. The homepage uses the manual/profile
 * fallback until a Page API provider is implemented here (Graph API
 * /{page-id}/posts with a Page access token, server-only, same contract:
 * resolve to a SocialPost or null).
 */
export async function latestFacebookPost(): Promise<SocialPost | null> {
  return null;
}
