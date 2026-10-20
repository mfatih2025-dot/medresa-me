import "server-only";
import type { SocialPost } from "../types";

/**
 * Instagram: the latest post of @medresacg, via the Instagram API with
 * Facebook Login (graph.facebook.com, scope instagram_basic), resolving
 * the professional account through the Medresa Page and its Page token.
 *
 * Server-only. The token is read from INSTAGRAM_ACCESS_TOKEN (Vercel env,
 * never NEXT_PUBLIC_) and is never logged, returned or sent to the browser.
 * The response is cached in the Next.js data cache for REVALIDATE seconds, so
 * Meta is called at most about twice an hour. Any failure (no token, expired
 * token, rate limit, outage, malformed or empty response) returns null and the
 * section falls back to its manual/profile content.
 */

const API = "https://graph.facebook.com/v26.0";
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

/** Keep account discovery server-side and separate from Facebook's feed. */
async function linkedAccount(token: string): Promise<{ id: string; token: string }> {
  const pageId = "578640758657974"; // Existing Medresa Page, not an Instagram ID.
  const graph = async (path: string, credential: string) => {
    const response = await fetch(`${API}/${path}&access_token=${encodeURIComponent(credential)}`, {
      next: { revalidate: REVALIDATE, tags: ["instagram"] },
    });
    const body = await response.json();
    if (!response.ok || body.error) {
      console.warn(`[instagram] discovery failed: HTTP ${response.status}, code ${typeof body.error?.code === "number" ? body.error.code : "?"}`);
      throw new Error("Instagram discovery failed");
    }
    return body;
  };
  let after: string | undefined;
  const seen = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const pages = await graph(`me/accounts?fields=id,access_token&limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`, token);
    const page = Array.isArray(pages.data) ? pages.data.find((p: { id?: string }) => p.id === pageId) : undefined;
    if (page) {
      const credential = typeof page.access_token === "string" && page.access_token.trim() ? page.access_token : token;
      const linked = await graph(`${pageId}?fields=instagram_business_account`, credential);
      const id = linked.instagram_business_account?.id;
      if (typeof id !== "string" || !/^\d{1,32}$/.test(id)) throw new Error("Instagram account not returned");
      return { id, token: credential };
    }
    const cursor = pages.paging?.cursors?.after;
    if (!pages.paging?.next || typeof cursor !== "string" || !cursor || seen.has(cursor)) break;
    seen.add(cursor); after = cursor;
  }
  throw new Error("Medresa Page not returned");
}

export async function latestInstagramPost(): Promise<SocialPost | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;

  // Same Facebook Login credential model as the verified Meta integration.
  // Resolve the linked account; never reuse an Instagram Login /me identity.
  let account: { id: string; token: string };
  try {
    account = await linkedAccount(token);
  } catch {
    console.warn("[instagram] linked professional account unavailable");
    return null;
  }
  const url = `${API}/${account.id}/media?fields=${FIELDS}&limit=6&access_token=${encodeURIComponent(account.token)}`;
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

  // Select by publication time, never by image availability or response order.
  // A Reel without a still keeps its own link/date/caption and uses the existing
  // SocialFeed image fallback, rather than silently showing an older post.
  const media = Array.isArray(body.data) ? body.data : [];
  const newest = media
    .filter((m) => m && typeof m.permalink === "string" && /^https:\/\/(www\.)?instagram\.com\//.test(m.permalink) && typeof m.timestamp === "string" && Number.isFinite(Date.parse(m.timestamp)))
    .sort((a, b) => Date.parse(b.timestamp!) - Date.parse(a.timestamp!))[0];
  if (!newest) {
    if (media.length === 0) console.warn("[instagram] no media returned");
    return null;
  }
  const src = stillOf(newest);
  return {
    kind: "post",
    platform: "instagram",
    url: newest.permalink!,
    date: newest.timestamp!,
    text: newest.caption ?? "",
    media: src ? { src, alt: "Najnovija objava Medrese „Mehmed Fatih“ na Instagramu" } : undefined,
    source: "meta",
  };
}
