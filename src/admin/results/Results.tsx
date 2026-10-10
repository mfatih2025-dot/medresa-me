import { useRef, useState } from "react";
import { Shell } from "../Shell";
import { adminRequest } from "../client";
import { ConfirmDialog } from "../ConfirmDialog";
import { MAX_PDF_BYTES, resultLocales, resultAssetPreview, type ResultsLibrary, type ResultState } from "./model";
import type { Locale } from "@/i18n/config";
import shared from "../admin.module.css";
import styles from "./results.module.css";
export function Results({initial}:{initial:ResultsLibrary}){
 const [state,setState]=useState(initial.state),[locale,setLocale]=useState<Locale>("bs"),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[confirm,setConfirm]=useState(false),[progress,setProgress]=useState("");
 const file=useRef<HTMLInputElement>(null),lock=useRef(false);
 const upload=async(selected:File|undefined)=>{
  if(!selected||!state||lock.current)return;
  if(!selected.size||selected.size>MAX_PDF_BYTES||(selected.type&&selected.type!=="application/pdf")){setMessage("Odaberite PDF do 5 MB.");return;}
  lock.current=true;setBusy(true);setMessage("");
  try{
   setProgress("Pripremam prenos…");
   const session=await adminRequest<{id:string;chunkBytes:number}>("/api/admin/results/upload",{locale,filename:selected.name,bytes:selected.size,revision:state.revision});
   for(let offset=0,index=0;offset<selected.size;offset+=session.chunkBytes,index++){
    setProgress(`Prenosim PDF · ${Math.round(offset/selected.size*100)}%`);
    const response=await fetch(`/api/admin/results/chunk?id=${session.id}&index=${index}`,{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:selected.slice(offset,offset+session.chunkBytes)});
    if(!response.ok){const error=await response.json();throw new Error(error.error??"Prenos nije završen.");}
   }
   setProgress("Provjeravam PDF…");const result=await adminRequest<{state:ResultState}>("/api/admin/results/finalize",{id:session.id,revision:state.revision});setState(result.state);setMessage("PDF je pripremljen. Javna objava ostaje nepromijenjena do objavljivanja rezultata.");
  }catch(error){setMessage(error instanceof Error?error.message:"PDF nije prenesen.");}
  finally{lock.current=false;setBusy(false);setProgress("");if(file.current)file.current.value="";}
 };
 const mutate=async(action:"remove"|"publish")=>{
  if(!state||lock.current)return;lock.current=true;setBusy(true);setMessage("");
  try{const result=await adminRequest<{state:ResultState}>("/api/admin/results",{action,revision:state.revision,locale,id:action==="publish"?crypto.randomUUID():undefined});setState(result.state);setConfirm(false);setMessage(action==="publish"?"Rezultati za izabrani jezik su objavljeni.":"PDF je uklonjen iz pripreme. Objavljeni rezultati ostaju dostupni.");}
  catch(error){setMessage(error instanceof Error?error.message:"Radnja nije završena.");setConfirm(false);}
  finally{lock.current=false;setBusy(false);}
 };
 const draft=state?.drafts[locale],published=state?.published[locale]?.file,ready=!!state?.drafts[locale];
 return <Shell active="/admin/rezultati" title="Rezultati ispita" intro="Jedni rezultati · nezavisne jezičke objave.">
  {initial.message&&<p className={shared.notice} role="status">{initial.message}</p>}
  {message&&<p className={styles.notice} role="status">{message}</p>}
  <div className={styles.tabs} role="tablist" aria-label="Jezik PDF-a">{resultLocales.map(l=><button role="tab" aria-label={l.toUpperCase()} key={l} aria-selected={locale===l} disabled={busy} className={locale===l?shared.primary:shared.secondary} onClick={()=>setLocale(l)}>{l.toUpperCase()}{state?.drafts[l] && <span className={styles.complete} aria-label="PDF spreman"> ✓</span>}</button>)}</div>
  <section className={styles.document} role="tabpanel" aria-label={locale.toUpperCase()}>
   <h2>{locale==="bs"?"Bosanski PDF":locale==="sq"?"Shqip PDF":"English PDF"}</h2>
   <p className={styles.context}>Priprema nove objave</p>
   {draft?<div className={styles.file}><a href={resultAssetPreview(draft.id)} target="_blank" rel="noopener noreferrer">{draft.filename}</a><span>{(draft.bytes/1048576).toFixed(2)} MB · {draft.pages} str.</span></div>:<p className={styles.empty}>PDF još nije odabran.</p>}
   <input ref={file} type="file" accept="application/pdf,.pdf" aria-label="Odaberi PDF" className={styles.picker} tabIndex={-1} onChange={e=>void upload(e.target.files?.[0])}/>
   <div className={styles.actions}><button className={shared.primary} disabled={busy||!initial.writable||!state} onClick={()=>file.current?.click()}>{busy&&progress?progress:"Odaberi PDF"}</button>{draft&&<><button className={shared.secondary} disabled={busy||!initial.writable} onClick={()=>file.current?.click()}>Zamijeni PDF</button><button className={shared.secondary} disabled={busy||!initial.writable} onClick={()=>void mutate("remove")}>Ukloni PDF</button></>}</div>
   <p className={styles.context}>PDF · najviše 5 MB. Zamjena i uklanjanje mijenjaju samo pripremu.</p>
   <div className={styles.published}><h3>Trenutno objavljeno</h3>{published?<><a href={resultAssetPreview(published.id)} target="_blank" rel="noopener noreferrer">{published.filename}</a><p>{(published.bytes/1048576).toFixed(2)} MB · verzija {state?.published[locale]?.version}</p></>:<p>Rezultati još nijesu objavljeni.</p>}</div>
  </section>
  <section className={styles.publish}><h2>Objavljivanje rezultata</h2><ul>{resultLocales.map(l=><li key={l}>{state?.drafts[l]?"✓":"—"} {l.toUpperCase()} · {state?.published[l]?"Objavljeno":state?.drafts[l]?"Spremno":"Nepotpuno"}</li>)}</ul><p>Prije objave pregledajte PDF za ovaj jezik. Ostali objavljeni dokumenti ostaju nepromijenjeni.</p><button className={shared.primary} disabled={busy||!initial.writable||!ready} onClick={()=>setConfirm(true)}>OBJAVI {locale.toUpperCase()} REZULTATE</button></section>
  {confirm&&<ConfirmDialog title="Objavi rezultate" description={`Objaviti pripremljeni ${locale.toUpperCase()} PDF? Ostali jezici ostaju nepromijenjeni; prethodni dokument ostaje sačuvan u istoriji.`} confirm={`OBJAVI ${locale.toUpperCase()} REZULTATE`} busy={busy} onCancel={()=>setConfirm(false)} onConfirm={()=>void mutate("publish")}/>}
 </Shell>;
}
