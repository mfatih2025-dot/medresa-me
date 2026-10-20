import { latestFacebookPost } from "@/lib/social/providers/facebook";
import { latestInstagramPost } from "@/lib/social/providers/instagram";

/**
 * TEMPORARY read-only Social Feed diagnostic (branch claude/social-feed-diagnostic only; never merged).
 *
 * Answers, from the real Meta responses available to the site's own credentials:
 *   Instagram: is the newest profile item returned by /media, by /tags, or by neither?
 *   Facebook:  does /video_reels hold anything newer than /published_posts?
 * and shows what the site's providers currently select, for comparison.
 *
 * Runs only on a Vercel Preview of this branch (behind Vercel Authentication); 404 everywhere else.
 * Returns IDs, types, timestamps, owners and short caption excerpts only. The tokens are read
 * server-side and are never returned or logged; no URL that carries a token is ever returned.
 */
export const dynamic = "force-dynamic";

const API = "https://graph.facebook.com/v26.0";
const PAGE_ID = "578640758657974";
const BRANCH = "claude/social-feed-diagnostic";

type Json = Record<string, unknown>;
type Row = Record<string, string | number | boolean | null>;

const scrub = (s: unknown) => (typeof s === "string" ? s.replace(/access_token=[^&\s"]+/gi, "access_token=…").slice(0, 300) : null);

async function get(path: string, token: string): Promise<Json> {
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${API}${path}${sep}access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const body = (await res.json()) as Json;
    const error = body.error as Json | undefined;
    if (!res.ok || error) {
      return { error: { http: res.status, code: error?.code ?? null, subcode: error?.error_subcode ?? null, type: scrub(error?.type), message: scrub(error?.message) } };
    }
    return body;
  } catch (e) {
    return { error: { http: 0, message: e instanceof Error ? e.name : "network error" } };
  }
}

const list = (body: Json): Json[] => (Array.isArray(body.data) ? (body.data as Json[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : null);
const excerpt = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").slice(0, 60) : null);
const present = (v: unknown) => typeof v === "string" && v.length > 0;

async function instagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { configured: false };
  // Same discovery as the site: Page → Page token → linked professional account.
  const accounts = await get(`/me/accounts?fields=id,access_token&limit=100`, token);
  const page = list(accounts).find((p) => p.id === PAGE_ID);
  const pageToken = str(page?.access_token) || token;
  const linked = await get(`/${PAGE_ID}?fields=instagram_business_account{id,username}`, pageToken);
  const account = linked.instagram_business_account as Json | undefined;
  const igId = str(account?.id);
  const out: Json = {
    configured: true,
    discovery: { pageFoundInMeAccounts: !!page, usedPageToken: !!str(page?.access_token), linkedAccount: account ? { id: igId, username: str(account.username) } : null, error: accounts.error ?? linked.error ?? null },
  };
  if (!igId) return out;

  const fields = "id,media_type,media_product_type,timestamp,permalink,media_url,thumbnail_url,caption,username,is_shared_to_feed,children{media_type,media_url,thumbnail_url}";
  const media = await get(`/${igId}/media?fields=${encodeURIComponent(fields)}&limit=10`, pageToken);
  out.media = media.error ? { error: media.error } : list(media).map((m): Row => {
    const children = m.children as Json | undefined;
    const first = Array.isArray(children?.data) ? ((children!.data as Json[])[0] ?? null) : null;
    return {
      id: str(m.id), media_type: str(m.media_type), media_product_type: str(m.media_product_type), timestamp: str(m.timestamp),
      permalink: str(m.permalink), username: str(m.username), is_shared_to_feed: typeof m.is_shared_to_feed === "boolean" ? m.is_shared_to_feed : null,
      has_media_url: present(m.media_url), media_url_is_video: present(m.media_url) && /\.mp4(\?|$)/i.test(String(m.media_url)),
      has_thumbnail_url: present(m.thumbnail_url), children: Array.isArray(children?.data) ? (children!.data as Json[]).length : null,
      first_child_type: first ? str(first.media_type) : null, first_child_has_image: first ? present(first.media_url) || present(first.thumbnail_url) : null,
      caption: excerpt(m.caption),
    };
  });

  const tags = await get(`/${igId}/tags?fields=${encodeURIComponent("id,media_type,media_product_type,timestamp,permalink,username,caption")}&limit=10`, pageToken);
  out.tags = tags.error ? { error: tags.error } : list(tags).map((m): Row => ({ id: str(m.id), username: str(m.username), media_type: str(m.media_type), media_product_type: str(m.media_product_type), timestamp: str(m.timestamp), permalink: str(m.permalink), caption: excerpt(m.caption) }));

  // The owner of the co-authored Reel seen first on the @medresacg profile grid.
  const bd = await get(`/${igId}?fields=${encodeURIComponent("business_discovery.username(volonterimehmedfatih){username,media.limit(6){id,media_type,media_product_type,timestamp,permalink,caption}}")}`, pageToken);
  const disc = bd.business_discovery as Json | undefined;
  const discMedia = disc?.media as Json | undefined;
  out.businessDiscovery_volonterimehmedfatih = bd.error ? { error: bd.error } : list(discMedia ?? {}).map((m): Row => ({ id: str(m.id), media_type: str(m.media_type), media_product_type: str(m.media_product_type), timestamp: str(m.timestamp), permalink: str(m.permalink), caption: excerpt(m.caption) }));
  return out;
}

async function facebook() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return { configured: false };
  const page = await get(`/${PAGE_ID}?fields=id,name,access_token`, token);
  const pageToken = str(page.access_token) || token;
  const out: Json = { configured: true, page: page.error ? { error: page.error } : { id: str(page.id), name: str(page.name), usedPageToken: !!str(page.access_token) } };
  const fields = "id,created_time,permalink_url,status_type,full_picture,message,story,attachments{type,media_type,media{image{src}}}";
  const posts = await get(`/${PAGE_ID}/published_posts?fields=${encodeURIComponent(fields)}&limit=10`, pageToken);
  out.published_posts = posts.error ? { error: posts.error } : list(posts).map((p): Row => {
    const a = Array.isArray((p.attachments as Json | undefined)?.data) ? (((p.attachments as Json).data as Json[])[0] ?? null) : null;
    return { id: str(p.id), created_time: str(p.created_time), permalink_url: str(p.permalink_url), status_type: str(p.status_type), attachment_type: a ? str(a.type) : null, attachment_media_type: a ? str(a.media_type) : null, has_full_picture: present(p.full_picture), text: excerpt(p.message ?? p.story) };
  });
  const reels = await get(`/${PAGE_ID}/video_reels?fields=${encodeURIComponent("id,created_time,updated_time,permalink_url,description,status")}&limit=10`, pageToken);
  out.video_reels = reels.error ? { error: reels.error } : list(reels).map((r): Row => ({ id: str(r.id), created_time: str(r.created_time), updated_time: str(r.updated_time), permalink_url: str(r.permalink_url), text: excerpt(r.description) }));
  const videos = await get(`/${PAGE_ID}/videos?fields=${encodeURIComponent("id,created_time,permalink_url,description,is_instagram_eligible")}&limit=10`, pageToken);
  out.videos = videos.error ? { error: videos.error } : list(videos).map((v): Row => ({ id: str(v.id), created_time: str(v.created_time), permalink_url: str(v.permalink_url), text: excerpt(v.description) }));
  return out;
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== BRANCH) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const [ig, fb, siteIg, siteFb] = await Promise.all([instagram(), facebook(), latestInstagramPost(), latestFacebookPost()]);
  const selected = (p: Awaited<ReturnType<typeof latestInstagramPost>>) => (p ? { url: p.url, date: p.date, hasImage: !!p.media, text: p.text.replace(/\s+/g, " ").slice(0, 60) } : null);
  const body = {
    checkedAt: new Date().toISOString(),
    deployment: { env: process.env.VERCEL_ENV, branch: process.env.VERCEL_GIT_COMMIT_REF, commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) },
    siteSelectsNow: { instagram: selected(siteIg), facebook: selected(siteFb) },
    instagram: ig,
    facebook: fb,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
