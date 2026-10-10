/* eslint-disable @next/next/no-img-element -- Original campaign artwork must not be transcoded. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { Shell } from "../Shell";
import { adminRequest } from "../client";
import shared from "../admin.module.css";
import styles from "./campaigns.module.css";
import { campaignRejection, campaignRejectionText, campaignLocales, localeComplete, emptyContent, emptyChannels, dismissalKey, validDestination, type CampaignDiagnostic, type CampaignLocale, type Campaign, type CampaignDraft, type CampaignLibrary, type Poster } from "./model";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { pathFor } from "@/i18n/routes";
import { PosterDialog } from "@/components/campaigns/PosterDialog";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Podgorica" }).format(new Date(value)) : "—";
function inputDate(value: string | null) { if (!value) return ""; const d = new Date(value); const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return local.toISOString().slice(0,16); }
function utcDate(value: string) { return value ? new Date(value).toISOString() : null; }
const toDraft = (c: Campaign): CampaignDraft => ({ id: c.id, revision: c.revision, name: c.name, posterId: c.poster?.id ?? null, ctaText: c.ctaText, ctaLink: c.ctaLink, content: c.content, localeActive: c.localeActive, active: c.active, startsAt: c.startsAt, endsAt: c.endsAt });
export function Campaigns({ initial }: { initial: CampaignLibrary }) {
  const [library, setLibrary] = useState(initial), [draft, setDraft] = useState<CampaignDraft | null>(null), [poster, setPoster] = useState<Poster | null>(null);
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [preview, setPreview] = useState(false), [message, setMessage] = useState("");
  const [locale, setLocale] = useState<CampaignLocale>("bs"), [deleting, setDeleting] = useState<Campaign | null>(null);
  const [now, setNow] = useState(() => Date.parse(initial.generatedAt));
  const [diagnostic, setDiagnostic] = useState<(CampaignDiagnostic & { locale: CampaignLocale; publicApiReturnedCampaign: boolean; publicPosterAccessible: boolean | null; dismissed: boolean | null; finalPopupEligible: boolean | null; browserTimezone: string }) | null>(null);
  useEffect(() => { const tick = () => setNow(Date.now()); tick(); const timer = setInterval(tick, 30000); return () => clearInterval(timer); }, []);
  const diagnose = async (c: Campaign) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage(""); setDiagnostic(null);
    try {
      const result = await adminRequest<CampaignDiagnostic>(`/api/admin/campaigns/diagnostic?id=${c.id}&locale=${locale}`);
      const response = await fetch(`/api/campaigns/current?locale=${locale}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Javni API trenutno nije dostupan.");
      const publicCampaign = (await response.json()).campaign;
      const returned = !!publicCampaign && publicCampaign.id === result.id && publicCampaign.version === result.revision;
      let accessible: boolean | null = null;
      // Construct only our own public URL; never fetch arbitrary returned destinations.
      if (returned) {
        const image = await fetch(`/api/campaigns/poster/${c.id}?version=${result.revision}`, { cache: "no-store" });
        accessible = image.ok && ["image/jpeg", "image/png", "image/webp"].includes(image.headers.get("Content-Type") ?? "") && (await image.blob()).size > 0;
      }
      let dismissed: boolean | null = null;
      try { dismissed = result.revision !== null && localStorage.getItem(dismissalKey({ id: c.id, version: result.revision })) === "1"; } catch { /* unknown, never assume a measured false */ }
      const choice = document.cookie.split("; ").find(v => v.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1];
      setDiagnostic({ ...result, locale: isLocale(choice) ? choice : "bs", publicApiReturnedCampaign: returned, publicPosterAccessible: accessible, dismissed, finalPopupEligible: dismissed === null ? null : returned && accessible === true && !dismissed, browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setNow(Date.now());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Provjera trenutno nije dostupna."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const file = useRef<HTMLInputElement>(null), busyRef = useRef(false), name = useRef<HTMLInputElement>(null);
  const edit = (campaign?: Campaign) => {
    setDraft(campaign ? toDraft(campaign) : { id: crypto.randomUUID(), revision: 0, name: "", posterId: null, ctaText: "SAZNAJ VIŠE", ctaLink: "", content: emptyContent(), localeActive: emptyChannels(), active: false, startsAt: null, endsAt: null });
    setLocale("bs"); setPoster(campaign?.poster ?? null); setMessage(""); setTimeout(() => name.current?.focus(), 0);
  };
  const change = (update: Partial<CampaignDraft>) => setDraft(old => old ? { ...old, ...update } : old);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!draft || busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage("");
    try {
      const { campaign } = await adminRequest<{ campaign: Campaign }>("/api/admin/campaigns", draft);
      setLibrary(old => ({ ...old, generatedAt: new Date().toISOString(), campaigns: [campaign, ...old.campaigns.filter(c => c.id !== campaign.id)] }));
      setDraft(null); setPoster(null); setMessage("Akcija je sačuvana.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Akcija nije sačuvana."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const remove = async () => {
    if (!deleting || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const response = await fetch("/api/admin/campaigns", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleting.id, revision: deleting.revision }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Akcija nije obrisana.");
      setLibrary(old => ({ ...old, campaigns: old.campaigns.filter(c => c.id !== deleting.id) }));
      setDeleting(null); setMessage(result.cleanup ? "Akcija je obrisana." : "Akcija je obrisana. Čišćenje slike nije potpuno završeno.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Akcija nije obrisana."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const upload = async (selected: File | undefined) => {
    if (!selected || busyRef.current || !draft) return;
    if (!["image/jpeg","image/png","image/webp"].includes(selected.type) || selected.size > 4194304) { setMessage("Odaberite JPG, PNG ili WebP sliku do 4 MB."); return; }
    busyRef.current = true; setUploading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/campaigns/assets", { method: "POST", headers: { "Content-Type": selected.type }, body: selected });
      let result; try { result = await response.json(); } catch { throw new Error("Slika nije prenesena. Pokušajte ponovo."); } if (!response.ok) throw new Error(result.error ?? "Slika nije prenesena.");
      setPoster(result.poster); change({ posterId: result.poster.id });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Slika nije prenesena."); }
    finally { busyRef.current = false; setUploading(false); if (file.current) file.current.value = ""; }
  };
  return <Shell active="/admin/akcije" title="Akcije" intro="Kampanje i obavijesti, u pravo vrijeme." action={<button className={shared.primary} disabled={!library.writable || busy || uploading || !!draft} onClick={() => edit()}>Nova akcija</button>}>
    {library.message && <p className={shared.notice} role="status">{library.message}</p>}
    {message && <p className={styles.message} role="status">{message}</p>}
    {diagnostic && <div className={styles.message} role="status"><strong>Provjera prikaza · {diagnostic.locale.toUpperCase()}</strong><p>Akcija: {diagnostic.campaignFound ? "pronađena" : "nije pronađena"} · verzija {diagnostic.revision ?? "—"}</p><p>Aktivna: {diagnostic.active ? "da" : "ne"} · vrijeme: {diagnostic.scheduleEligible ? "spremno" : "nije spremno"} · jezici: {diagnostic.localizationComplete ? "spremni" : `dopuniti ${diagnostic.missingLocales.join(", ").toUpperCase()}`}</p><p>Javni API: {diagnostic.publicApiReturnedCampaign ? "vratio akciju" : "nije vratio ovu akciju"} · poster: {diagnostic.publicPosterAccessible === null ? "—" : diagnostic.publicPosterAccessible ? "dostupan" : "nije dostupan"}</p><p>Zatvorena ova verzija u ovom browseru: {diagnostic.dismissed === null ? "—" : diagnostic.dismissed ? "da" : "ne"}</p><p>{diagnostic.rejectionReason ? diagnostic.rejectionReason in campaignRejectionText ? campaignRejectionText[diagnostic.rejectionReason as keyof typeof campaignRejectionText] : diagnostic.rejectionReason === "another_campaign_selected" ? "Druga akcija ima prednost." : diagnostic.rejectionReason === "poster_unavailable" ? "Poster nije dostupan." : "Akcija nije pronađena." : diagnostic.dismissed ? "Ova verzija je već zatvorena u ovom browseru." : diagnostic.finalPopupEligible ? "Akcija je spremna za prikaz nakon izbora jezika." : "Javni API ili poster trenutno ne potvrđuju prikaz."}</p><p>Početak UTC: {diagnostic.startsAt ?? "—"} · kraj UTC: {diagnostic.endsAt ?? "—"}</p><p>Server UTC: {diagnostic.serverTime} · uređaj: {diagnostic.browserTimezone}</p></div>}
    {draft && <form className={styles.editor} onSubmit={save} aria-label="Uređivanje akcije">
      <header><h2>{draft.revision ? "Uredi akciju" : "Nova akcija"}</h2><span>Originalni poster · jedna javna obavijest</span></header>
      <fieldset disabled={busy || uploading}>
        <h3 className={styles.groupTitle}>GENERAL</h3><div className={styles.fields}>
          <label className={styles.wide}>Naziv akcije<input ref={name} value={draft.name} required maxLength={160} onChange={e => change({ name: e.target.value })} /><small>Interni naziv. Ne prikazuje se preko postera.</small></label>
          <div className={`${styles.upload} ${styles.wide}`}><span>Slika / poster</span>
            {poster && <div className={styles.posterThumb}><img src={poster.src} alt="Odabrani poster" width={poster.width} height={poster.height} /></div>}
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Odaberi sliku" tabIndex={-1} className={styles.file} onChange={e => void upload(e.target.files?.[0])} />
            <div className={styles.actions}><button type="button" className={shared.secondary} onClick={() => file.current?.click()}>{uploading ? "Prenosim sliku…" : poster ? "Zamijeni" : "Odaberi sliku"}</button>{poster && <button type="button" className={shared.textLink} onClick={() => { setPoster(null); change({ posterId: null }); }}>Ukloni</button>}{poster && validDestination(draft.content[locale].link) && draft.content[locale].text.trim() && <button type="button" className={shared.textLink} onClick={() => setPreview(true)}>Pregled popupa</button>}</div>
            <small>JPG, PNG ili WebP · do 4 MB. Prikazuje se originalna slika bez izrezivanja.</small>
          </div>

          <p className={styles.help}>Aktivni jezik se prikazuje u svom vremenskom periodu. Ako ih je više, prednost ima posljednja aktivirana akcija.</p>
          <label>Početak prikazivanja<input type="datetime-local" value={inputDate(draft.startsAt)} onChange={e => change({ startsAt: utcDate(e.target.value) })} /></label>
          <label>Kraj prikazivanja<input type="datetime-local" value={inputDate(draft.endsAt)} onChange={e => change({ endsAt: utcDate(e.target.value) })} /></label>
          <p className={`${styles.help} ${styles.wide}`}>Datumi nijesu obavezni. Vrijeme unosite prema vremenskoj zoni svog uređaja.</p>
        </div>
        <h3 className={styles.groupTitle}>CONTENT</h3>
        <div className={styles.actions} role="tablist" aria-label="Jezik akcije">{campaignLocales.map(l => <button key={l} type="button" role="tab" aria-label={l.toUpperCase()} aria-selected={locale === l} className={locale === l ? shared.primary : shared.secondary} onClick={() => setLocale(l)}>{l.toUpperCase()}{localeComplete(draft.content,l) && <span className={styles.complete} aria-label="Sadržaj kompletan"> ✓</span>}</button>)}</div>
        <div className={styles.fields} role="tabpanel" aria-label={locale.toUpperCase()}>
          <label>Status<select aria-label="Status" value={draft.localeActive[locale] ? "active" : "inactive"} onChange={e => { const localeActive = {...draft.localeActive,[locale]:e.target.value === "active"}; change({localeActive,active:campaignLocales.some(l=>localeActive[l])}); }}><option value="inactive">Neaktivna</option><option value="active">Aktivna</option></select></label>
          <label>Tekst dugmeta<input value={draft.content[locale].text} maxLength={80} onChange={e => change({ content: { ...draft.content, [locale]: { ...draft.content[locale], text: e.target.value } } })} /></label>
          <label>Link<input aria-label="Link" value={draft.content[locale].link} maxLength={2048} placeholder={`${pathFor("upis", locale)} ili https://…`} onChange={e => change({ content: { ...draft.content, [locale]: { ...draft.content[locale], link: e.target.value } } })} /><small>Unesite postojeću putanju za ovaj jezik (npr. /sq/… ili /en/…) ili vanjski HTTPS URL.</small></label>
        </div>
        {!localeComplete(draft.content,locale) && <p className={styles.help}>Ovaj jezik je nepotpun. Može se sačuvati kao neaktivan; ostali jezici ostaju nezavisni.</p>}
      </fieldset>
      <div className={styles.actions}><button className={shared.primary} disabled={busy || uploading}>{busy ? "Spremam…" : "Sačuvaj akciju"}</button><button type="button" className={shared.secondary} disabled={busy || uploading} onClick={() => { setDraft(null); setPoster(null); }}>Odustani</button></div>
    </form>}
    {!library.campaigns.length && !draft && library.ready && <div className={styles.empty}><h2>Trenutno nema akcija.</h2><p>Kreirajte akciju i dodajte njen originalni poster. Ranije akcije ostaju dostupne ovdje.</p></div>}
    <ul className={styles.library} aria-label="Akcije">{library.campaigns.map(c => <li key={c.id}>
      <div className={styles.thumbnail}>{c.poster ? <><img src={c.poster.src} alt="" width={c.poster.width} height={c.poster.height} /></> : <span>Bez postera</span>}</div>
      <div className={styles.details}><h2>{c.name}</h2><span className={styles.status}>{campaignRejection(c, now, locale) ? campaignRejectionText[campaignRejection(c, now, locale)!] : "Aktivna — spremna za javni prikaz."}</span><p>{c.startsAt || c.endsAt ? `${date(c.startsAt)} — ${date(c.endsAt)}` : "Bez vremenskog ograničenja"}</p><p className={styles.link}>{c.content.bs.text} → {c.content.bs.link}</p><p>{campaignLocales.map(l => `${l.toUpperCase()}: ${c.localeActive[l] && localeComplete(c.content,l) ? "Aktivna" : localeComplete(c.content,l) ? "Spremno" : "Nepotpuno"}`).join(" · ")}</p></div>
      <div className={styles.listActions}><button className={shared.secondary} disabled={!library.writable || busy || uploading || !!draft} onClick={() => edit(c)}>Uredi</button><button className={shared.secondary} disabled={!library.writable || busy || uploading || !!draft} onClick={() => setDeleting(c)}>Obriši</button><button className={shared.secondary} disabled={busy || uploading || !!draft} onClick={() => void diagnose(c)}>Provjeri prikaz</button></div>
    </li>)}</ul>
    {preview && poster && draft && validDestination(draft.content[locale].link) && <PosterDialog campaign={{ id: draft.id, version: draft.revision || 1, poster, ctaText: draft.content[locale].text, ctaLink: draft.content[locale].link, endsAt: null }} onClose={() => setPreview(false)} />}
    {deleting && <ConfirmDialog title="Obriši akciju" description={`Trajno obrisati akciju „${deleting.name}“? Poster se uklanja samo ako nije korišćen u drugoj akciji.`} confirm="Obriši" busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} />}
  </Shell>;
}
