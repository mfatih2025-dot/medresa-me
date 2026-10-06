import type { Metadata } from "next";
import { misija } from "@/content/misija";
import { Misija } from "@/components/misija/Misija";

export const metadata: Metadata = {
  title: misija.title,
  description: misija.mission.paragraphs[0],
  alternates: { canonical: "/misija" },
};

/** /misija — Misija i vizija: the institution's statement of purpose, signed by the Reis. */
export default function MisijaPage() {
  return <Misija />;
}
