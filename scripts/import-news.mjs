import { readFileSync } from "node:fs";
import { moduleLoader } from "./lib/load-typescript.mjs";
try {
  if (readFileSync(".git/HEAD", "utf8").trim() !== "ref: refs/heads/codex/admin-panel") throw new Error("Import is restricted to codex/admin-panel.");
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const load = moduleLoader();
  const { importLegacy } = load("src/server/admin/news.ts");
  if (apply) {
    const config = load("src/server/admin/supabase.ts").supabaseConfiguration();
    if (!config?.writable || !args.includes(`--confirm-project=${config.ref}`)) throw new Error("Preview Supabase configuration and --confirm-project=<expected Preview project ref> are required.");
  }
  console.log(JSON.stringify(await importLegacy("verified-import-cli", !apply)));
} catch (error) {
  console.error(error.message); process.exitCode = 1;
}
