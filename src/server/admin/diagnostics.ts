// Read-only runtime checks. Only the approved hostname and project ref may be returned.
import { supabaseConfiguration } from "./supabase";

function nonSecretRuntimeValue(value: string | null): string | null {
  if (value === null) return null;
  // Protect against credentials accidentally placed in either non-secret setting.
  const credentials = [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.MEDRESA_ADMIN_PASSWORD_HASH, process.env.MEDRESA_ADMIN_SESSION_SECRET];
  return credentials.some(secret => secret && value.toLowerCase().includes(secret.toLowerCase())) ? null : value;
}

export function adminConfigurationDiagnostic() {
  const url = process.env.SUPABASE_URL;
  const ref = process.env.MEDRESA_SUPABASE_PROJECT_REF;
  let parsed: URL | null = null;
  try { if (url) parsed = new URL(url); } catch { /* Never return the raw URL. */ }

  const checks = {
    previewEnvironment: process.env.VERCEL_ENV === "preview",
    adminBranch: process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel",
    supabaseUrlPresent: Boolean(url),
    serviceRoleKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    projectRefPresent: Boolean(ref),
    supabaseUrlParseable: parsed !== null,
    supabaseUrlExactOrigin: parsed !== null && parsed.origin === url,
    supabaseUrlHttps: parsed !== null && parsed.protocol === "https:",
    supabaseHostnameMatchesProjectRef: parsed !== null && parsed.hostname === `${ref}.supabase.co`,
    projectRefFormatValid: Boolean(ref && /^[a-z0-9]{10,40}$/.test(ref)),
    writeFlagIsFalse: process.env.MEDRESA_SUPABASE_WRITE_ENABLED === "false",
  };

  return {
    configurationAccepted: supabaseConfiguration() !== null,
    checks,
    failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name),
    runtime: {
      supabaseHostname: nonSecretRuntimeValue(parsed?.hostname ?? null),
      projectRef: nonSecretRuntimeValue(ref ?? null),
    },
  };
}
