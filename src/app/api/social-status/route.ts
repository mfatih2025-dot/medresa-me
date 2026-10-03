// TEMPORARY: verifies the production Facebook setup. Returns only safe facts —
// token present, the Page, whether Page and posts are readable (sanitized Meta
// error otherwise) and the newest post — never a token or request URL.
import { facebookStatus } from "@/lib/social/providers/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { tokenPresent: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN), facebook: await facebookStatus() },
    { headers: { "cache-control": "no-store" } },
  );
}
