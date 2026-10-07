import type { GetServerSideProps } from "next";
import { articles } from "@/content/vijesti";
import { upis } from "@/content/upis";
import { protectPage } from "@/server/admin/auth";
import { NewsLibrary } from "@/admin/NewsLibrary";
import { Analytics, Campaigns, ExamResults } from "@/admin/OtherSections";
import type { ArchiveRow } from "@/admin/Overview";
type Props = { section: string; rows: ArchiveRow[]; documentTitle: string; hasPdf: boolean };
export const getServerSideProps: GetServerSideProps<Props> = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  const section = String(context.params?.section);
  if (!["vijesti", "akcije", "rezultati", "analitika"].includes(section)) return { notFound: true };
  return { props: { section, rows: section === "vijesti" ? articles.map(a => ({ id: a.id, title: a.bs.title, date: a.date, photos: a.photos.length, slug: a.bs.slug })) : [], documentTitle: upis.documents[0]?.title ?? "Rezultati ispita", hasPdf: !!upis.documents[0]?.href } };
};
export default function Section(props: Props) {
  if (props.section === "vijesti") return <NewsLibrary rows={props.rows} />;
  if (props.section === "akcije") return <Campaigns />;
  if (props.section === "rezultati") return <ExamResults {...props} />;
  return <Analytics />;
}
