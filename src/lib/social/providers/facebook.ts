import "server-only";
import type { SocialPost } from "../types";

/**
 * Facebook: the newest published post of the Medresa's Facebook Page, via the
 * Graph API (graph.facebook.com, pages_show_list + pages_read_engagement).
 *
 * FACEBOOK_PAGE_ACCESS_TOKEN may be a Page token or the user token of a Page
 * admin. A Page token resolves `/me` to the Page itself; with a user token the
 * Page (and its own Page token) is looked up via `/me/accounts`. Either way no
 * Page ID needs configuring.
 *
 * The card always represents the NEWEST post: it is never skipped for an older
 * one. Its picture comes from `full_picture`, else from its attachments (photo,
 * video/reel thumbnail, link preview, first item of an album); a post without
 * any picture is still shown, with the card's fallback image.
 *
 * Server-only. Tokens are never logged, returned or sent to the browser; logs
 * carry only HTTP status and Meta's error code/type. Cached 30 minutes. Any
 * failure returns null and the card keeps its profile fallback.
 */

const API = "https://graph.facebook.com/v26.0";
/** 30 minutes, as for Instagram. */
export const REVALIDATE = 1800;
const MEDRESA = /medres|mehmed\s*fatih/i;
/** The Page's @username (facebook.com/medresacg). */
const USERNAME = "medresacg";

type GraphError = { code?: number; error_subcode?: number; type?: string; message?: string };
type Media = { image?: { src?: string } };
type Attachment = {
  type?: string;
  media_type?: string;
  media?: Media;
  subattachments?: { data?: Attachment[] };
};
type Post = {
  id?: string;
  message?: string;
  story?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  status_type?: string;
  attachments?: { data?: Attachment[] };
};

const POST_FIELDS =
  "id,message,story,created_time,permalink_url,full_picture,status_type," +
  "attachments{type,media_type,media{image{src}},subattachments.limit(1){type,media{image{src}}}}";

type Result<T> = { ok: true; data: T } | { ok: false; status: number; error?: GraphError };

async function graph<T>(path: string, token: string): Promise<Result<T>> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${API}${path}${sep}access_token=${encodeURIComponent(token)}`, {
      next: { revalidate: REVALIDATE, tags: ["facebook"] },
    });
    const body = (await res.json()) as T & { error?: GraphError };
    if (!res.ok || body.error) return { ok: false, status: res.status, error: body.error };
    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 0 };
  }
}

const describe = (r: { status: number; error?: GraphError }) =>
  `HTTP ${r.status}, code ${r.error?.code ?? "?"}${r.error?.error_subcode ? `/${r.error.error_subcode}` : ""} ${r.error?.type ?? ""}`.trim();

/** The Page and a token for reading its posts. */
async function resolvePage(token: string) {
  const me = await graph<{ id?: string; name?: string; category?: string }>(
    "/me?fields=id,name,category",
    token,
  );
  if (me.ok && me.data.category && me.data.id) {
    return {
      ok: true as const,
      tokenType: "page",
      id: me.data.id,
      name: me.data.name ?? "",
      pageToken: token,
    };
  }
  if (!me.ok && me.error?.code !== 100) {
    // 190 = invalid/expired token, 10/200 = permissions, etc.
    return { ok: false as const, reason: `/me failed: ${describe(me)}`, me };
  }
  // Not a Page token (a User token has no `category`): find the Page among the user's Pages.
  const accounts = await graph<{
    data?: { id?: string; name?: string; username?: string; access_token?: string }[];
  }>("/me/accounts?fields=id,name,username,access_token&limit=50", token);
  if (!accounts.ok) {
    return {
      ok: false as const,
      reason: `token is not a Page token; /me/accounts failed: ${describe(accounts)}`,
      me,
    };
  }
  const pages = accounts.data.data ?? [];
  const page =
    pages.find((p) => p.username?.toLowerCase() === USERNAME) ??
    pages.find((p) => p.name && MEDRESA.test(p.name)) ??
    (pages.length === 1 ? pages[0] : undefined);
  if (!page?.id || !page.access_token) {
    return {
      ok: false as const,
      reason: `user token, but no Medresa Page among ${pages.length} Page(s)`,
      me,
    };
  }
  return {
    ok: true as const,
    tokenType: "user",
    id: page.id,
    name: page.name ?? "",
    pageToken: page.access_token,
  };
}

/** The best still image of a post, whatever its type. */
function pictureOf(p: Post): string | undefined {
  if (p.full_picture) return p.full_picture;
  const a = p.attachments?.data?.[0];
  return a?.media?.image?.src ?? a?.subattachments?.data?.[0]?.media?.image?.src;
}

async function newestPost() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return { reason: "FACEBOOK_PAGE_ACCESS_TOKEN is not set" } as const;
  const page = await resolvePage(token);
  if (!page.ok) return { reason: page.reason } as const;
  // published_posts: the Page's own published posts, newest first.
  const posts = await graph<{ data?: Post[] }>(
    `/${page.id}/published_posts?fields=${encodeURIComponent(POST_FIELDS)}&limit=5`,
    page.pageToken,
  );
  if (!posts.ok) return { page, reason: `posts request failed: ${describe(posts)}` } as const;
  const list = Array.isArray(posts.data.data) ? posts.data.data : [];
  // Sort defensively by date (the API returns newest first) and take the newest.
  const newest = [...list]
    .filter((p) => p.created_time)
    .sort((a, b) => Date.parse(b.created_time!) - Date.parse(a.created_time!))[0];
  if (!newest) return { page, reason: "no published posts returned" } as const;
  return { page, newest } as const;
}

export async function latestFacebookPost(): Promise<SocialPost | null> {
  const r = await newestPost();
  if (!("newest" in r) || !r.newest) {
    console.warn(`[facebook] fallback: ${r.reason}`);
    return null;
  }
  const p = r.newest;
  const url =
    p.permalink_url && /^https:\/\/(www\.|m\.)?facebook\.com\//.test(p.permalink_url)
      ? p.permalink_url
      : undefined;
  if (!url || !p.created_time) {
    console.warn("[facebook] fallback: newest post has no permalink/date");
    return null;
  }
  const picture = pictureOf(p);
  return {
    kind: "post",
    platform: "facebook",
    url,
    date: p.created_time,
    text: p.message ?? p.story ?? "",
    media: picture
      ? { src: picture, alt: "Najnovija objava Medrese „Mehmed Fatih“ na Facebooku" }
      : undefined,
    source: "meta",
  };
}

/**
 * Non-secret status for verifying production: the Medresa Page (only once
 * found), its newest post and the failure reason. Never a token, a request URL
 * or any other Page the token can see.
 */
export async function facebookStatus() {
  const r = await newestPost();
  const p = "newest" in r ? r.newest : undefined;
  return {
    page: "page" in r && r.page ? { id: r.page.id, name: r.page.name, tokenType: r.page.tokenType } : null,
    newest: p
      ? {
          id: p.id,
          created_time: p.created_time,
          status_type: p.status_type,
          attachment_type: p.attachments?.data?.[0]?.type,
          media_found: Boolean(pictureOf(p)),
          permalink_url: p.permalink_url,
        }
      : null,
    reason: "reason" in r ? r.reason : null,
  };
}
