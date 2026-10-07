import type { NextApiRequest, NextApiResponse } from "next";
import { allowedOrigin, sessionCookie } from "@/server/admin/auth";
export default function logout(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  if (!allowedOrigin(req.headers.origin)) return res.status(403).end();
  res.setHeader("Set-Cookie", sessionCookie("", true));
  return res.redirect(303, "/admin/login");
}
