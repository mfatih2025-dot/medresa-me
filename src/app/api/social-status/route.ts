// TEMPORARY: verifies the production Facebook setup. Returns only the Medresa
// Page, its newest post, the token's node type and a short one-way fingerprint
// (first 8 hex chars of its SHA-256) so the stored value can be compared with
// the intended token — never the token itself, a URL or any other Page.
import { createHash } from "node:crypto";
import { facebookStatus } from "@/lib/social/providers/facebook";

export const dynamic = "force-dynamic";

async function tokenNodeType(token: string) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v26.0/me?fields=id&metadata=1&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const body = (await res.json()) as { metadata?: { type?: string }; error?: { code?: number } };
    return body.metadata?.type ?? (body.error ? `error ${body.error.code}` : "unknown");
  } catch {
    return "request failed";
  }
}

export async function GET() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  return Response.json(
    {
      tokenPresent: Boolean(token),
      tokenFingerprint: token ? createHash("sha256").update(token).digest("hex").slice(0, 8) : null,
      tokenNodeType: token ? await tokenNodeType(token) : null,
      deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      facebook: await facebookStatus(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
