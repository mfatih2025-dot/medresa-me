import type { GetServerSideProps } from "next";
import { protectPage } from "@/server/admin/auth";
import { NewsLibrary } from "@/admin/NewsLibrary";
import type { AdmissionsControl } from "@/admin/results/admissions";
import { admissionsControl } from "@/server/admin/results/admissions";
import { Results } from "@/admin/results/Results";
import type { ResultsLibrary } from "@/admin/results/model";
import { listResults } from "@/server/admin/results/service";
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
type Props = { admissions: AdmissionsControl | null; results: ResultsLibrary | null; campaigns: CampaignLibrary | null; section: string; rows: NewsListRow[]; preview: ManagedArticle | null; backend: BackendState; analytics: AnalyticsDashboard | null };
export const getServerSideProps: GetServerSideProps<Props> = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  const section = String(context.params?.section);
  if (!["vijesti", "akcije", "rezultati", "analitika"].includes(section)) return { notFound: true };
  const library = section === "vijesti" ? await listNews() : { rows: [], backend: backendState() };
  let period; try { period = parsePeriod(context.query.period); } catch { period = "30" as const; }
  return { props: { section, admissions: section === "rezultati" ? await admissionsControl() : null, results: section === "rezultati" ? await listResults() : null, campaigns: section === "akcije" ? await listCampaigns() : null, analytics: section === "analitika" ? await dashboard(period) : null, backend: library.backend, rows: library.rows.map(newsListRow), preview: library.rows.find(r => r.draft.id === context.query.preview) ?? null } };
};
export default function Section(props: Props) {
  if (props.section === "vijesti") return <NewsLibrary rows={props.rows} backend={props.backend} preview={props.preview} />;
  if (props.section === "akcije") return props.campaigns ? <Campaigns initial={props.campaigns} /> : null;
  if (props.section === "rezultati") return props.results ? <Results initial={props.results} admissions={props.admissions ?? undefined} /> : null;
  return props.analytics ? <Analytics initial={props.analytics} /> : null;
}
