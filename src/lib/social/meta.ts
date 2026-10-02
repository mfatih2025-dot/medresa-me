import type { SocialPost } from "./types";

/**
 * Meta Graph API: the latest Instagram and Facebook post, server-side only.
 *
 * Configure in the deployment's environment (never NEXT_PUBLIC_*; tokens must
 * never reach the browser):
 *   META_IG_USER_ID       Instagram professional account ID
 *   META_IG_ACCESS_TOKEN  long-lived token with instagram_basic (or Instagram Login token)
 *   META_FB_PAGE_ID       Facebook Page ID
 *   META_FB_ACCESS_TOKEN  long-lived Page access token with pages_read_engagement
 *   META_GRAPH_VERSION    optional, defaults to v21.0
 *
 * Without them these functions return null and nothing is requested. Results
 * are cached and revalidated hourly (ISR); any API error also returns null, so
 * the homepage falls back gracefully instead of failing.
 */

const VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";
const REVALIDATE = 3600;

async function graph<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type IgMedia = {
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

export async function latestInstagram(): Promise<SocialPost | null> {
  const id = process.env.META_IG_USER_ID;
  const token = process.env.META_IG_ACCESS_TOKEN;
  if (!id || !token) return null;
  const fields = "caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const data = await graph<{ data?: IgMedia[] }>(
    `https://graph.facebook.com/${VERSION}/${id}/media?fields=${fields}&limit=1&access_token=${encodeURIComponent(token)}`,
  );
  const m = data?.data?.[0];
  if (!m) return null;
  const image = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
  return {
    kind: "post",
    platform: "instagram",
    url: m.permalink,
    date: m.timestamp,
    text: m.caption ?? "",
    media: image ? { src: image, alt: "Najnovija objava Medrese na Instagramu" } : undefined,
    source: "meta",
  };
}

type FbPost = {
  message?: string;
  created_time: string;
  permalink_url: string;
  full_picture?: string;
};

export async function latestFacebook(): Promise<SocialPost | null> {
  const id = process.env.META_FB_PAGE_ID;
  const token = process.env.META_FB_ACCESS_TOKEN;
  if (!id || !token) return null;
  const fields = "message,created_time,permalink_url,full_picture";
  const data = await graph<{ data?: FbPost[] }>(
    `https://graph.facebook.com/${VERSION}/${id}/posts?fields=${fields}&limit=1&access_token=${encodeURIComponent(token)}`,
  );
  const p = data?.data?.[0];
  if (!p) return null;
  return {
    kind: "post",
    platform: "facebook",
    url: p.permalink_url,
    date: p.created_time,
    text: p.message ?? "",
    media: p.full_picture ? { src: p.full_picture, alt: "Najnovija objava Medrese na Facebooku" } : undefined,
    source: "meta",
  };
}
