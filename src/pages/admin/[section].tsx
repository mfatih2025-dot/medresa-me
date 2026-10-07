import type { GetServerSideProps } from "next";
import { upis } from "@/content/upis";
import { protectPage } from "@/server/admin/auth";
import { NewsLibrary } from "@/admin/NewsLibrary";
import { Analytics, Campaigns, ExamResults } from "@/admin/OtherSections";
import type { BackendState, ManagedArticle, NewsListRow } from "@/admin/model";
import { newsListRow } from "@/admin/list";
import { listNews } from "@/server/admin/news";
import { backendState } from "@/server/admin/supabase";
type Props = { section: string; rows: NewsListRow[]; preview: ManagedArticle | null; backend: BackendState; documentTitle: string; hasPdf: boolean };
export const getServerSideProps: GetServerSideProps<Props> = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  const section = String(context.params?.section);
  if (!["vijesti", "akcije", "rezultati", "analitika"].includes(section)) return { notFound: true };
  const library = section === "vijesti" ? await listNews() : { rows: [], backend: backendState() };
  return { props: { section, backend: library.backend, rows: library.rows.map(newsListRow), preview: library.rows.find(r => r.draft.id === context.query.preview) ?? null, documentTitle: upis.documents[0]?.title ?? "Rezultati ispita", hasPdf: !!upis.documents[0]?.href } };
};
export default function Section(props: Props) {
  if (props.section === "vijesti") return <NewsLibrary rows={props.rows} backend={props.backend} preview={props.preview} />;
  if (props.section === "akcije") return <Campaigns />;
  if (props.section === "rezultati") return <ExamResults {...props} />;
  return <Analytics />;
}
