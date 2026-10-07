import { useEffect, useRef } from "react";
import styles from "./admin.module.css";
export function ConfirmDialog({ title, description, confirm, busy, onCancel, onConfirm }: { title: string; description: string; confirm: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={styles.confirmDialog} aria-labelledby="confirmation-title" onCancel={e => { e.preventDefault(); if (!busy) onCancel(); }}><h2 id="confirmation-title">{title}</h2><p>{description}</p><div><button className={styles.secondary} disabled={busy} onClick={onCancel}>Odustani</button><button className={styles.primary} disabled={busy} onClick={onConfirm}>{busy ? "Čuvanje…" : confirm}</button></div></dialog>;
}
