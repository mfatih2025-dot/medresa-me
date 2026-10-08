// Server-only entry points: imported exclusively by getServerSideProps, API routes,
// and the protected App Router preview. Never import from a client component.
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { GetServerSidePropsContext } from "next";

const derive = promisify(scrypt);
const SESSION_SECONDS = 60 * 60 * 8;
export type AdminSession = { user: string; expiresAt: number };
type SessionFailure = "configuration-unavailable" | "cookie-missing" | "token-too-long" | "token-format-invalid" | "signature-mismatch" | "payload-invalid" | "user-mismatch" | "issued-in-future" | "expired" | "duration-invalid";

function configuration() {
  const user = process.env.MEDRESA_ADMIN_USER;
  const hash = process.env.MEDRESA_ADMIN_PASSWORD_HASH;
  const secret = process.env.MEDRESA_ADMIN_SESSION_SECRET;
  const origin = process.env.MEDRESA_ADMIN_ORIGIN;
  if (!user || !hash || !secret || !origin || secret.length < 32 || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash)) return null;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) return null;
    return { user, hash, secret, origin, secure: url.protocol === "https:" };
  } catch { return null; }
}

export const authConfigured = () => configuration() !== null;
export function cookieName() { return configuration()?.secure ? "__Host-medresa-admin" : "medresa-admin"; }
export function allowedOrigin(origin: string | undefined): boolean { return !!origin && origin === configuration()?.origin; }

export async function verifyCredentials(user: string, password: string): Promise<boolean> {
  const config = configuration();
  if (!config || password.length > 1024 || user.length > 200) return false;
  const [, salt, expected] = config.hash.split("$");
  const actual = await derive(password, salt, 64) as Buffer;
  const samePassword = timingSafeEqual(actual, Buffer.from(expected, "hex"));
  const a = createHmac("sha256", config.secret).update(user).digest();
  const b = createHmac("sha256", config.secret).update(config.user).digest();
  return timingSafeEqual(a, b) && samePassword;
}

export function createSession(now = Date.now()): string {
  const config = configuration();
  if (!config) throw new Error("Admin authentication is not configured");
  const body = Buffer.from(JSON.stringify({ user: config.user, issuedAt: now, expiresAt: now + SESSION_SECONDS * 1000, nonce: randomBytes(24).toString("hex") })).toString("base64url");
  return `${body}.${createHmac("sha256", config.secret).update(body).digest("base64url")}`;
}

export function verifySession(token: string | undefined, now = Date.now(), onFailure?: (reason: SessionFailure) => void): AdminSession | null {
  const reject = (reason: SessionFailure): null => { onFailure?.(reason); return null; };
  const config = configuration();
  if (!config) return reject("configuration-unavailable");
  if (!token) return reject("cookie-missing");
  if (token.length > 2048) return reject("token-too-long");
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return reject("token-format-invalid");
  const expected = createHmac("sha256", config.secret).update(body).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reject("signature-mismatch");
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.user !== config.user) return reject("user-mismatch");
    if (!Number.isFinite(data.issuedAt) || !Number.isFinite(data.expiresAt)) return reject("payload-invalid");
    if (data.issuedAt > now) return reject("issued-in-future");
    if (data.expiresAt <= now) return reject("expired");
    if (data.expiresAt - data.issuedAt !== SESSION_SECONDS * 1000) return reject("duration-invalid");
    return { user: data.user, expiresAt: data.expiresAt };
  } catch { return reject("payload-invalid"); }
}

export function sessionCookie(token: string, clear = false): string {
  return `${cookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${configuration()?.secure ? "; Secure" : ""}`;
}

export function protectPage(context: GetServerSidePropsContext): AdminSession | null {
  context.res.setHeader("Cache-Control", "private, no-store, max-age=0");
  context.res.setHeader("X-Robots-Tag", "noindex, nofollow");
  context.res.setHeader("X-Frame-Options", "SAMEORIGIN");
  context.res.setHeader("Referrer-Policy", "same-origin");
  return verifySession(context.req.cookies[cookieName()]);
}

/** Defense in depth for a single instance. Use durable rate limiting before hosting. */
const attempts = new Map<string, { count: number; until: number }>();
export function allowLoginAttempt(address: string, now = Date.now()): boolean {
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const current = attempts.get(address);
  if (current) { current.count++; return current.count <= 10; }
  if (attempts.size >= 1000) return false;
  attempts.set(address, { count: 1, until: now + 15 * 60 * 1000 });
  return true;
}
