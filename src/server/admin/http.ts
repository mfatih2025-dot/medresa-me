import type { NextApiRequest, NextApiResponse } from "next";
import { AdminError } from "@/admin/contracts";
import { allowedOrigin, cookieName, verifySession } from "./auth";

export function authorize(req: NextApiRequest, res: NextApiResponse, methods: string[]) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const name = cookieName();
  const session = verifySession(req.cookies[name]);
  if (!session) throw new AdminError(401, "Prijavite se za nastavak.");
  if (!methods.includes(req.method ?? "")) { res.setHeader("Allow", methods.join(", ")); throw new AdminError(405, "Metoda nije dozvoljena."); }
  if (req.method !== "GET" && !allowedOrigin(req.headers.origin)) throw new AdminError(403, "Zahtjev nije iz dozvoljenog administratorskog prostora.");
  return session;
}
export function apiFailure(res: NextApiResponse, error: unknown) {
  return res.status(error instanceof AdminError ? error.status : 500).json({ error: error instanceof AdminError ? error.message : "Zahtjev nije završen. Pokušajte ponovo." });
}
