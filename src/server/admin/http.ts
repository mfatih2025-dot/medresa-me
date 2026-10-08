import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { allowedOrigin, authConfigured, cookieName, verifySession } from "./auth";

export function authorize(req: NextApiRequest, res: NextApiResponse, methods: string[]) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const name = cookieName();
  // Temporary, server-only evidence for the Preview news GET session issue.
  // No cookie values, headers, URLs, account names or environment values are logged.
  const diagnose = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel"
    && req.method === "GET" && ["/api/admin/news", "/api/admin/news/"].includes((req.url ?? "").split("?")[0]);
  const session = verifySession(req.cookies[name], Date.now(), diagnose ? reason => {
    let originMatchesRequestHost = false;
    try { originMatchesRequestHost = new URL(process.env.MEDRESA_ADMIN_ORIGIN ?? "").host === req.headers.host; } catch { /* Log only the boolean. */ }
    console.info(JSON.stringify({
      event: "medresa.admin.auth_rejected",
      reason,
      authConfigured: authConfigured(),
      expectsSecureCookie: name === "__Host-medresa-admin",
      parsedCookiePresent: Boolean(req.cookies[name]),
      headerContainsExpectedCookie: (name === "__Host-medresa-admin" ? /(?:^|;)\s*__Host-medresa-admin=/ : /(?:^|;)\s*medresa-admin=/).test(req.headers.cookie ?? ""),
      originMatchesRequestHost,
    }));
  } : undefined);
  if (!session) throw new AdminError(401, "Prijavite se za nastavak.");
  if (!methods.includes(req.method ?? "")) { res.setHeader("Allow", methods.join(", ")); throw new AdminError(405, "Metoda nije dozvoljena."); }
  if (req.method !== "GET" && !allowedOrigin(req.headers.origin)) throw new AdminError(403, "Zahtjev nije iz dozvoljenog administratorskog prostora.");
  return session;
}
export function apiFailure(res: NextApiResponse, error: unknown) {
  return res.status(error instanceof AdminError ? error.status : 500).json({ error: error instanceof AdminError ? error.message : "Zahtjev nije završen. Pokušajte ponovo." });
}
