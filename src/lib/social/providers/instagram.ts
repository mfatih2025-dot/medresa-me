import "server-only";
import type { SocialPost } from "../types";

/**
 * Instagram: the latest post of @medresacg, via the Instagram API with
 * Instagram Login (graph.instagram.com, scope instagram_business_basic).
 *
 * Server-only. The token is read from INSTAGRAM_ACCESS_TOKEN (Vercel env,
 * never NEXT_PUBLIC_) and is never logged, returned or sent to the browser.
 * The response is cached in the Next.js data cache for REVALIDATE seconds, so
 * Meta is called at most about twice an hour. Any failure (no token, expired
 * token, rate limit, outage, malformed or empty response) returns null and the
 * section falls back to its manual/profile content.
 */

const API = "https://graph.instagram.com/v26.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
/** 30 minutes. */
export const REVALIDATE = 1800;

type Media = {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

const isVideoUrl = (url?: string) => !!url && /\.mp4(\?|$)/i.test(url);

/** A still image for any media type: the photo, or the cover of a video / Reel. */
function stillOf(m: Media): string | undefined {
  if (m.media_type === "VIDEO") return m.thumbnail_url;
  if (isVideoUrl(m.media_url)) return m.thumbnail_url; // carousel opening with a video
  return m.media_url ?? m.thumbnail_url;
}

export async function latestInstagramPost(): Promise<SocialPost | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;

  const url = `${API}/me/media?fields=${FIELDS}&limit=6&access_token=${encodeURIComponent(token)}`;
  let body: { data?: Media[]; error?: { code?: number; type?: string } };
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ["instagram"] } });
    body = await res.json();
    if (!res.ok || body.error) {
      // Status and Meta's error code/type only — never the URL (it carries the token).
      console.warn(
        `[instagram] request failed: HTTP ${res.status}, code ${body.error?.code ?? "?"} ${body.error?.type ?? ""}`.trim(),
      );
      return null;
    }
  } catch (e) {
    console.warn(`[instagram] request failed: ${e instanceof Error ? e.name : "unknown error"}`);
    return null;
  }

  // Newest first; take the first item that has a usable still image and link.
  const media = Array.isArray(body.data) ? body.data : [];
  for (const m of media) {
    const src = stillOf(m);
    if (!src || !m.permalink || !m.timestamp) continue;
    if (!/^https:\/\/(www\.)?instagram\.com\//.test(m.permalink)) continue;
    return {
      kind: "post",
      platform: "instagram",
      url: m.permalink,
      date: m.timestamp,
      text: m.caption ?? "",
      media: { src, alt: "Najnovija objava Medrese „Mehmed Fatih“ na Instagramu" },
      source: "meta",
    };
  }
  if (media.length === 0) console.warn("[instagram] no media returned");
  return null;
}
