import type { GetServerSideProps } from "next";
import { articles } from "@/content/vijesti";
import { protectPage } from "@/server/admin/auth";
import { Overview } from "@/admin/Overview";
import { listNews } from "@/server/admin/news";
export const getServerSideProps: GetServerSideProps = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  return { props: { rows: articles.map(a => ({ id: a.id, title: a.bs.title, date: a.date, photos: a.photos.length, slug: a.bs.slug })), backend: (await listNews()).backend, diagnosticsAvailable: process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel" } };
};
export default Overview;
