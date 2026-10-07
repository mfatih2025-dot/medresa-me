import { useState, type FormEvent } from "react";
import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { authConfigured, protectPage } from "@/server/admin/auth";
import styles from "@/admin/admin.module.css";

export const getServerSideProps: GetServerSideProps = async context => {
  if (protectPage(context)) return { redirect: { destination: "/admin", permanent: false } };
  return { props: { configured: authConfigured() } };
};
export default function Login({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: data.get("user"), password: data.get("password") }) });
      if (response.ok) { await router.push("/admin"); return; }
      const body = await response.json(); setError(body.error ?? "Prijava nije uspjela.");
    } catch { setError("Veza nije dostupna. Pokušajte ponovo."); }
    finally { setBusy(false); }
  }
  return <main className={styles.login}>
    <Head><title>Prijava · Medresa administracija</title></Head>
    <div className={styles.loginIdentity}><Image src="/brand/medresa-logo.png" alt="Medresa Mehmed Fatih" width={72} height={72} /><p className={styles.eyebrow}>Medresa Mehmed Fatih</p><h1>Prostor za ljude<br />koji brinu o Medresi.</h1><p>Vijesti, obavijesti i dokumenti.<br />Pažljivo uređeni. Na jednom mjestu.</p><span className={styles.identityFoot}>Tuzi · Administracija</span></div>
    <section className={styles.loginForm}><p className={styles.eyebrow}>Privatni pristup</p><h2>Dobro došli.</h2><p>Prijavite se svojim administratorskim podacima.</p>
      {!configured && <div className={styles.notice} role="status"><strong>Pristup još nije podešen.</strong><p>Administracija je zaključana dok se ne poveže siguran pristup.</p></div>}
      <form onSubmit={submit}><label>Korisničko ime<input name="user" autoComplete="username" required disabled={!configured || busy} maxLength={200} /></label><label>Lozinka<input name="password" type="password" autoComplete="current-password" required disabled={!configured || busy} maxLength={1024} /></label><button className={styles.primary} disabled={!configured || busy}>{busy ? "Prijava…" : "Uđi u administraciju →"}</button><p className={styles.error} role="alert">{error}</p></form>
      <Link className={styles.textLink} href="/">← Javna stranica Medrese</Link>
    </section>
  </main>;
}
