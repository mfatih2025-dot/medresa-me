import type { NextApiRequest, NextApiResponse } from "next";
import { allowedOrigin, allowLoginAttempt, authConfigured, createSession, sessionCookie, verifyCredentials } from "@/server/admin/auth";

export const config = { api: { bodyParser: { sizeLimit: "8kb" } } };
export default async function login(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  if (!authConfigured()) return res.status(503).json({ error: "Administracija još nije povezana." });
  if (!allowedOrigin(req.headers.origin)) return res.status(403).end();
  if (!allowLoginAttempt(req.socket.remoteAddress ?? "unknown")) return res.status(429).json({ error: "Previše pokušaja. Pokušajte kasnije." });
  const { user, password } = req.body ?? {};
  if (typeof user !== "string" || typeof password !== "string" || !(await verifyCredentials(user, password))) return res.status(401).json({ error: "Prijava nije uspjela. Provjerite pristupne podatke." });
  res.setHeader("Set-Cookie", sessionCookie(createSession()));
  return res.status(200).json({ ok: true });
}
