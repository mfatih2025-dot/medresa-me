import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { moduleLoader } from "./lib/load-typescript.mjs";
try {
  if (readFileSync(".git/HEAD","utf8").trim() !== "ref: refs/heads/codex/admin-panel") throw new Error("Verification is restricted to codex/admin-panel.");
  const load = moduleLoader();
  const { articles } = load("src/content/vijesti");
  const { canonicalJson } = load("src/admin/contracts.ts");
  const { supabaseRequest } = load("src/server/admin/supabase.ts");
  const rows = await (await supabaseRequest("/rest/v1/medresa_admin_articles?select=id,legacy_article,import_fingerprint,source_order,document,archived_at,deleted_at,published_revision")).json();
  const feed = await (await supabaseRequest("/rest/v1/medresa_admin_public_feed?select=id,snapshot")).json();
  for (const [index,article] of articles.entries()) {
    const row = rows.find(r=>r.id===article.id); const publicRow = feed.find(r=>r.id===article.id);
    const hash = createHash("sha256").update(canonicalJson(article)).digest("hex");
    if (!row || row.import_fingerprint!==hash || row.source_order!==index || row.archived_at || row.deleted_at || row.published_revision!==0 || canonicalJson(row.legacy_article)!==canonicalJson(article) || canonicalJson(publicRow?.snapshot)!==canonicalJson(article)) throw new Error(`Migration requires review: ${article.id}. No data was changed.`);
    for (const p of article.photos) if (!existsSync(`public${p.src}`)) throw new Error(`Referenced archive image is missing for ${article.id}.`);
  }
  console.log(JSON.stringify({ verified:articles.length, locales:articles.length*3, preserved:"IDs, slugs, dates, ordering, full bodies and image metadata", publicSourceSwitched:false }));
} catch(error) { console.error(error.message); process.exitCode=1; }
