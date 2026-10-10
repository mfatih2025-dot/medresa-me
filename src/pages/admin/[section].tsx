import type { GetServerSideProps } from "next";
import { upis } from "@/content/upis";
import { protectPage } from "@/server/admin/auth";
import { NewsLibrary } from "@/admin/NewsLibrary";
import { ExamResults } from "@/admin/OtherSections";
import { Campaigns } from "@/admin/campaigns/Campaigns";
import type { CampaignLibrary } from "@/admin/campaigns/model";
import { listCampaigns } from "@/server/admin/campaigns/service";
import { Analytics } from "@/admin/analytics/Dashboard";
import type { AnalyticsDashboard } from "@/admin/analytics/model";
import { parsePeriod } from "@/admin/analytics/period";
import { dashboard } from "@/server/admin/analytics/service";
import type { BackendState, ManagedArticle, NewsListRow } from "@/admin/model";
import { newsListRow } from "@/admin/list";
import { listNews } from "@/server/admin/news";
import { backendState } from "@/server/admin/supabase";
type Props = { campaigns: CampaignLibrary | null; section: string; rows: NewsListRow[]; preview: ManagedArticle | null; backend: BackendState; documentTitle: string; hasPdf: boolean; analytics: AnalyticsDashboard | null };
export const getServerSideProps: GetServerSideProps<Props> = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  const section = String(context.params?.section);
  if (!["vijesti", "akcije", "rezultati", "analitika"].includes(section)) return { notFound: true };
  const library = section === "vijesti" ? await listNews() : { rows: [], backend: backendState() };
  let period; try { period = parsePeriod(context.query.period); } catch { period = "30" as const; }
  return { props: { section, campaigns: section === "akcije" ? await listCampaigns() : null, analytics: section === "analitika" ? await dashboard(period) : null, backend: library.backend, rows: library.rows.map(newsListRow), preview: library.rows.find(r => r.draft.id === context.query.preview) ?? null, documentTitle: upis.documents[0]?.title ?? "Rezultati ispita", hasPdf: !!upis.documents[0]?.href } };
};
export default function Section(props: Props) {
  if (props.section === "vijesti") return <NewsLibrary rows={props.rows} backend={props.backend} preview={props.preview} />;
  if (props.section === "akcije") return props.campaigns ? <Campaigns initial={props.campaigns} /> : null;
  if (props.section === "rezultati") return <ExamResults {...props} />;
  return props.analytics ? <Analytics initial={props.analytics} /> : null;
}
