/** Approved hosted deployments. Other Preview branches remain isolated. */
export const APPROVED_SUPABASE_REF = "safsijrhxbefgcahvsvm";
export function backendEnvironmentSupported() {
  return process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";
}
export function backendBranchSupported() {
  return process.env.VERCEL_GIT_COMMIT_REF === (process.env.VERCEL_ENV === "production" ? "main" : "codex/admin-panel");
}
export function backendDeploymentSupported() {
  return backendEnvironmentSupported() && backendBranchSupported();
}
export function previewDeployment() {
  return process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel";
}
