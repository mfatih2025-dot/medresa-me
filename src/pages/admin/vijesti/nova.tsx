import type { GetServerSideProps } from "next";
import { articles } from "@/content/vijesti";
import { protectPage } from "@/server/admin/auth";
import { DraftEditor } from "@/admin/DraftEditor";
export const getServerSideProps: GetServerSideProps = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  return { props: { assets: articles.flatMap(a => a.photos.map((p, i) => ({ ...p, id: `archive-${a.id}-${i + 1}` }))) } };
};
export default DraftEditor;
