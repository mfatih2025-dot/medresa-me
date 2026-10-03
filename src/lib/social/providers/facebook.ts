import "server-only";
import type { SocialPost } from "../types";

/**
 * Facebook: the newest published post of the Medresa „Mehmed Fatih“ Facebook
 * Page (ID 578640758657974), via the Graph API.
 *
 * FACEBOOK_PAGE_ACCESS_TOKEN may be a Page token or a user token granted
 * pages_show_list + pages_read_engagement for this Page. The Page is addressed
 * directly by its ID (no discovery). With a user token the Page's own access
 * token is requested from `/{page-id}?fields=access_token` and used for the
 * posts; if that is not returned, the posts are requested with the token as is.
 *
 * The card always represents the NEWEST post (never skipped for an older one).
 * Picture: full_picture, else the first attachment (photo, video/reel
 * thumbnail, link preview, album item); a post without one keeps the card's
 * fallback photograph with its own text, date and permalink.
 *
 * Server-only. No token is ever logged, returned or sent to the browser (the
 * derived Page token included). Cached 30 minutes. Any failure returns null and
 * the card keeps its profile fallback.
 */

const API = "https://graph.facebook.com/v26.0";
/** 30 minutes, as for Instagram. */
export const REVALIDATE = 1800;
/** Medresa „Mehmed Fatih“ / Medreseja „Mehmed Fatih“ (facebook.com/medresacg). */
export const PAGE_ID = "578640758657974";

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

async function graph<T>(path: string, token: string, fresh = false): Promise<Result<T>> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(
      `${API}${path}${sep}access_token=${encodeURIComponent(token)}`,
      fresh ? { cache: "no-store" } : { next: { revalidate: REVALIDATE, tags: ["facebook"] } },
    );
    const body = (await res.json()) as T & { error?: GraphError };
    if (!res.ok || body.error) return { ok: false, status: res.status, error: body.error };
    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 0 };
  }
}

const describe = (r: { status: number; error?: GraphError }) =>
  `HTTP ${r.status}, code ${r.error?.code ?? "?"}${r.error?.error_subcode ? `/${r.error.error_subcode}` : ""} ${r.error?.type ?? ""}`.trim();

/** The best still image of a post, whatever its type. */
function pictureOf(p: Post): string | undefined {
  if (p.full_picture) return p.full_picture;
  const a = p.attachments?.data?.[0];
  return a?.media?.image?.src ?? a?.subattachments?.data?.[0]?.media?.image?.src;
}

/** Meta's error without anything token-like (Meta does not echo tokens; this is belt and braces). */
function sanitize(r: { status: number; error?: GraphError }, token: string) {
  const msg = (r.error?.message ?? "")
    .split(token)
    .join("[token]")
    .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]");
  return {
    http: r.status,
    code: r.error?.code ?? null,
    subcode: r.error?.error_subcode ?? null,
    type: r.error?.type ?? null,
    message: msg || null,
  };
}

type Step = { ok: boolean; error?: ReturnType<typeof sanitize> };

async function newestPost(fresh = false) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return { reason: "FACEBOOK_PAGE_ACCESS_TOKEN is not set" } as const;

  // 1. The Page itself (and, for a user token, the Page's own token).
  const page = await graph<{ id?: string; name?: string; access_token?: string }>(
    `/${PAGE_ID}?fields=id,name,access_token`,
    token,
    fresh,
  );
  const pageStep: Step = page.ok ? { ok: true } : { ok: false, error: sanitize(page, token) };
  const info = page.ok
    ? { id: page.data.id ?? PAGE_ID, name: page.data.name ?? "" }
    : { id: PAGE_ID, name: "" };
  const pageToken = page.ok && page.data.access_token ? page.data.access_token : token;
  const derived = pageToken !== token;

  // 2. Its newest published posts.
  const posts = await graph<{ data?: Post[] }>(
    `/${PAGE_ID}/published_posts?fields=${encodeURIComponent(POST_FIELDS)}&limit=5`,
    pageToken,
    fresh,
  );
  const postsStep: Step = posts.ok ? { ok: true } : { ok: false, error: sanitize(posts, pageToken) };
  const steps = { page: pageStep, pageTokenDerived: derived, posts: postsStep };
  if (!posts.ok) return { info, steps, reason: `posts request failed: ${describe(posts)}` } as const;

  const list = Array.isArray(posts.data.data) ? posts.data.data : [];
  // Sort defensively by date (the API returns newest first) and take the newest.
  const newest = [...list]
    .filter((p) => p.created_time)
    .sort((a, b) => Date.parse(b.created_time!) - Date.parse(a.created_time!))[0];
  if (!newest) return { info, steps, reason: "no published posts returned" } as const;
  return { info, steps, newest } as const;
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
 * Non-secret status for verifying production: the Page, whether it and its
 * posts are readable (with Meta's sanitized error if not) and the newest post.
 * Never a token (neither the configured nor a derived one) or a request URL.
 */
export async function facebookStatus() {
  const r = await newestPost(true);
  const p = "newest" in r ? r.newest : undefined;
  return {
    page: "info" in r ? r.info : null,
    steps: "steps" in r ? r.steps : null,
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
