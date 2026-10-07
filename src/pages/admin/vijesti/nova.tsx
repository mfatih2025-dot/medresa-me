import type { GetServerSideProps } from "next";
import { protectPage } from "@/server/admin/auth";
import { DraftEditor, type EditorProps } from "@/admin/DraftEditor";
import { editorProps } from "@/server/admin/editor";
export const getServerSideProps: GetServerSideProps = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  return { props: (await editorProps())! };
};
export default function NewArticle(props: EditorProps) { return <DraftEditor key="new" {...props} />; }
