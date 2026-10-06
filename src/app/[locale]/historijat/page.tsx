import type { Metadata } from "next";
import { historijat } from "@/content/historijat";
import { History } from "@/components/historijat/History";

export const metadata: Metadata = {
  title: historijat.title,
  description: historijat.chapters.founding.text,
  alternates: { canonical: "/historijat" },
};

/** /historijat — the history of the Medresa, from 6 October 2008 to today. */
export default function HistorijatPage() {
  return <History />;
}
