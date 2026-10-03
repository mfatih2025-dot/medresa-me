import "server-only";
import type { SocialPost } from "../types";

/**
 * Facebook: the latest published post of the Medresa's Facebook Page, via the
 * Graph API (graph.facebook.com) with a Page access token
 * (pages_show_list, pages_read_engagement).
 *
 * One request: `/me` with a Page token resolves to the Page itself, so the
 * Page ID never has to be configured; asking for the Page-only `category`
 * field makes a non-Page (user) token fail instead of returning a person's
 * posts. Its recent posts are expanded in the same call.
 *
 * Server-only. The token is read from FACEBOOK_PAGE_ACCESS_TOKEN (Vercel env,
 * never NEXT_PUBLIC_) and is never logged, returned or sent to the browser.
 * Cached in the Next.js data cache for REVALIDATE seconds. Any failure (no
 * token, wrong token type, expired token, rate limit, outage, malformed or
 * empty response, no post with a picture) returns null and the card keeps its
 * profile fallback.
 */

const API = "https://graph.facebook.com/v26.0";
const POST_FIELDS = "message,created_time,permalink_url,full_picture";
const FIELDS = `id,name,category,posts.limit(10){${POST_FIELDS}}`;
/** 30 minutes, as for Instagram. */
export const REVALIDATE = 1800;

type Post = {
  message?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
};
type Page = {
  id?: string;
  name?: string;
  category?: string;
  posts?: { data?: Post[] };
  error?: { code?: number; type?: string };
};

export async function latestFacebookPost(): Promise<SocialPost | null> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const url = `${API}/me?fields=${encodeURIComponent(FIELDS)}&access_token=${encodeURIComponent(token)}`;
  let page: Page;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ["facebook"] } });
    page = await res.json();
    if (!res.ok || page.error) {
      // Status and Meta's error code/type only — never the URL (it carries the token).
      console.warn(
        `[facebook] request failed: HTTP ${res.status}, code ${page.error?.code ?? "?"} ${page.error?.type ?? ""}`.trim(),
      );
      return null;
    }
  } catch (e) {
    console.warn(`[facebook] request failed: ${e instanceof Error ? e.name : "unknown error"}`);
    return null;
  }

  if (!page.category) {
    console.warn("[facebook] token does not resolve to a Page");
    return null;
  }

  // Newest first; the card is photographic, so take the newest post with a picture.
  const posts = Array.isArray(page.posts?.data) ? page.posts.data : [];
  for (const p of posts) {
    if (!p.full_picture || !p.permalink_url || !p.created_time) continue;
    if (!/^https:\/\/(www\.|m\.)?facebook\.com\//.test(p.permalink_url)) continue;
    return {
      kind: "post",
      platform: "facebook",
      url: p.permalink_url,
      date: p.created_time,
      text: p.message ?? "",
      media: { src: p.full_picture, alt: "Najnovija objava Medrese „Mehmed Fatih“ na Facebooku" },
      source: "meta",
    };
  }
  console.warn(posts.length ? "[facebook] no recent post with a picture" : "[facebook] no posts returned");
  return null;
}
