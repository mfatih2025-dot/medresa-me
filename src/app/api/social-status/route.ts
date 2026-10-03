// TEMPORARY production diagnostics for the Facebook card. Returns only public,
// non-secret facts (Page ID/name, newest post id/date/type, failure reason) —
// never a token or request URL. Remove once the live card is verified.
import { facebookDiagnostics } from "@/lib/social/providers/facebook";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { facebook: await facebookDiagnostics(), tokenPresent: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN) },
    { headers: { "cache-control": "no-store" } },
  );
}
