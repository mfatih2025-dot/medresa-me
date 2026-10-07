import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { BackendState, ManagedArticle } from "./model";
import { adminRequest } from "./client";
import styles from "./admin.module.css";
/** Creation is an explicit authorized POST, never a side effect of an SSR GET. */
export function NewArticleAction({ backend }: { backend: BackendState }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError("");
    try {
      const { article } = await adminRequest<{ article: ManagedArticle }>("/api/admin/news", {});
      await router.push(`/admin/vijesti/${article.draft.id}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Nacrt nije kreiran."); setBusy(false); }
  }
  if (!backend.writable) return <Link href="/admin/vijesti/nova" className={styles.primary}>＋ Nova vijest</Link>;
  return <div><button className={styles.primary} disabled={busy} onClick={create}>{busy ? "Kreiranje nacrta…" : "＋ Nova vijest"}</button>{error && <p className={styles.error} role="alert">{error}</p>}</div>;
}
