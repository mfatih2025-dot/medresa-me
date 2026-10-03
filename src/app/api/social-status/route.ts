// TEMPORARY: verifies the production Facebook setup. Returns only the Medresa
// Page, its newest post and a failure reason — never a token, URL or other Page.
import { facebookStatus } from "@/lib/social/providers/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { tokenPresent: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN), facebook: await facebookStatus() },
    { headers: { "cache-control": "no-store" } },
  );
}
