import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import styles from "./admin.module.css";

export const navigation = [
  { href: "/admin", label: "Dashboard", mobileLabel: "Pregled", mark: "overview" },
  { href: "/admin/vijesti", label: "Vijesti", mobileLabel: "Vijesti", mark: "news" },
  { href: "/admin/akcije", label: "Akcije", mobileLabel: "Akcije", mark: "campaign" },
  { href: "/admin/rezultati", label: "Rezultati ispita", mobileLabel: "Rezultati", mark: "document" },
  { href: "/admin/analitika", label: "Analitika", mobileLabel: "Analitika", mark: "analytics" },
];
export function Mark({ kind }: { kind: string }) {
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    news: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    campaign: <><path d="m4 10 14-5v14L4 14zM4 10v4M7 15l2 5h3l-2-4" /></>,
    document: <><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6M9 17h4" /></>,
    analytics: <><path d="M4 3v18h17M9 16v-5M14 16V6M19 16V9" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}
export function Shell({ active, title, intro, children, action }: { active: string; title: string; intro: string; children: ReactNode; action?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const current = navigation.find(n => n.href === active) ?? navigation[0];
  return <div className={styles.shell}>
    <Head><title>{title} · Medresa administracija</title></Head>
    <a className={styles.skip} href="#admin-main">Preskoči na sadržaj</a>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/admin"><Image src="/brand/medresa-logo.png" alt="" width={44} height={44} /><span>Mehmed Fatih<small>Administracija</small></span></Link>
      <span className={styles.navCaption}>Radni prostor</span>
      <button ref={menuButton} type="button" className={styles.mobileMenu} aria-label="Administracijski meni" aria-expanded={menuOpen} aria-controls={navId} onClick={() => setMenuOpen(v => !v)}><span><Mark kind={current.mark} />{current.mobileLabel}</span><span>Meni <span aria-hidden="true">{menuOpen ? "−" : "+"}</span></span></button>
      <nav id={navId} aria-label="Administracija" className={menuOpen ? styles.navigationOpen : undefined} onKeyDown={e => { if (e.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); } }}>{navigation.map(n => <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)} aria-current={active === n.href ? "page" : undefined} className={active === n.href ? styles.navActive : styles.navItem}><Mark kind={n.mark} /><span className={styles.desktopNavLabel}>{n.label}</span><span className={styles.mobileNavLabel}>{n.mobileLabel}</span></Link>)}</nav>
      <div className={styles.sidebarBottom}><a href="/" target="_blank" rel="noopener noreferrer">Otvori javnu stranicu ↗</a><form action="/api/admin/logout" method="post"><button>Odjavi se</button></form><span>Medresa · Tuzi</span></div>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}><span>MEDRESA / <b>KONTROLNI CENTAR</b></span><span className={styles.private}><i />Privatni prostor</span></header>
      <main id="admin-main" className={styles.main} tabIndex={-1}><div className={styles.pageHead}><div><p className={styles.eyebrow}>Medresa Mehmed Fatih</p><h1>{title}</h1><p>{intro}</p></div>{action}</div>{children}</main>
      <footer className={styles.adminFooter}>Znanje. Vrijednosti. Odgovornost.<span>Administracija / Urednički prostor</span></footer>
    </div>
  </div>;
}
export function Unconnected({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.notice}><span className={styles.status}>Nije povezano</span><h3>{title}</h3><p>{children}</p></div>;
}
