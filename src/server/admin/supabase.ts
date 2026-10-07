// Server-only consumers: API routes, getServerSideProps, import CLI.
import { AdminError } from "@/admin/contracts";
import type { BackendState } from "@/admin/model";

export function supabaseConfiguration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ref = process.env.MEDRESA_SUPABASE_PROJECT_REF;
  if (process.env.VERCEL_ENV === "production" || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF !== "codex/admin-panel") || !url || !key || !ref) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== url || parsed.protocol !== "https:" || parsed.hostname !== `${ref}.supabase.co` || !/^[a-z0-9]{10,40}$/.test(ref)) return null;
    return { url, key, ref, bucket: "medresa-news-preview", writable: process.env.MEDRESA_SUPABASE_WRITE_ENABLED === "true" };
  } catch { return null; }
}
export function backendState(): BackendState {
  const config = supabaseConfiguration();
  return config ? { state: "connected", writable: config.writable, message: config.writable ? "Supabase Preview · javna stranica koristi postojeću arhivu." : "Baza je povezana samo za čitanje. Upis nije omogućen." } : { state: "not-connected", writable: false, message: "Supabase nije povezan. Promjene se ne spremaju; javna arhiva ostaje neizmijenjena." };
}
export async function supabaseRequest(path: string, init: RequestInit = {}, write = false): Promise<Response> {
  const config = supabaseConfiguration();
  if (!config) throw new AdminError(503, "Supabase Preview nije povezan.");
  if (write && !config.writable) throw new AdminError(503, "Upis u Supabase Preview nije omogućen.");
  const headers = new Headers(init.headers);
  headers.set("apikey", config.key);
  // Current Supabase secret keys are opaque API keys, not bearer JWTs.
  if (config.key.startsWith("sb_secret_")) headers.delete("Authorization");
  else headers.set("Authorization", `Bearer ${config.key}`);
  let response: Response;
  try { response = await fetch(`${config.url}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(20000) }); }
  catch { throw new AdminError(503, "Veza s uredničkom bazom nije dostupna."); }
  if (!response.ok) {
    // Never return Supabase errors/headers/keys to a browser or log provider bodies.
    let code = "";
    try { code = (await response.json()).code ?? ""; } catch { /* non-JSON */ }
    if (["23505", "40001"].includes(code)) throw new AdminError(409, code === "23505" ? "URL slug je već zauzet." : "Vijest je promijenjena u drugom prozoru. Ponovo je otvorite.");
    if (code === "P0002") throw new AdminError(404, "Vijest nije pronađena.");
    throw new AdminError(503, "Baza ili Storage nisu spremni. Provjerite Preview konfiguraciju i migraciju.");
  }
  return response;
}
export async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  return (await supabaseRequest(`/rest/v1/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) }, true)).json();
}
