import type { GetServerSideProps } from "next";
import { DraftEditor, type EditorProps } from "@/admin/DraftEditor";
import { safeId } from "@/admin/contracts";
import { protectPage } from "@/server/admin/auth";
import { editorProps } from "@/server/admin/editor";
export const getServerSideProps: GetServerSideProps<EditorProps> = async context => {
  if (!protectPage(context)) return { redirect: { destination: "/admin/login", permanent: false } };
  const id = context.params?.id;
  if (!safeId(id)) return { notFound: true };
  const props = await editorProps(id);
  return props ? { props: { ...props, saved: props.initial?.source === "database" && context.query.saved === "1" } } : { notFound: true };
};
export default function EditArticle(props: EditorProps) { return <DraftEditor key={props.initial?.draft.id} {...props} />; }
