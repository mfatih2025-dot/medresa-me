import { Shell, Unconnected, Mark } from "./Shell";
import styles from "./admin.module.css";

export function ExamResults({ documentTitle, hasPdf }: { documentTitle: string; hasPdf: boolean }) {
  return <Shell active="/admin/rezultati" title="Rezultati ispita" intro="Jedan službeni dokument. Dostupan na sva tri jezika."><section className={styles.documentSection}><div><p className={styles.eyebrow}>Postojeća javna stranica</p><h2>{documentTitle}</h2><span className={styles.status}>{hasPdf ? "PDF je povezan" : "PDF još nije povezan"}</span><p>Objavljeni dokument kasnije će hraniti postojeći modul rezultata i stranicu upisa. Njihov izgled ostaje zaštićen.</p></div><div className={styles.uploadPlaceholder}><Mark kind="document" /><h3>Službeni PDF</h3><p>Prijenos datoteka čeka povezivanje sigurnog spremišta.</p><button className={styles.secondary} disabled>Odaberi PDF</button></div></section><Unconnected title="Objavljivanje dokumenata nije povezano">Buduća objava uključuje provjeru PDF-a, školske godine, BS/SQ/EN naslova i potvrdu administratora.</Unconnected></Shell>;
}
