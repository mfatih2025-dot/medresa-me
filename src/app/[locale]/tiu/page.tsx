import type { Metadata } from "next";
import { tiu } from "@/content/tiu";
import { Tiu } from "@/components/tiu/Tiu";

export const metadata: Metadata = {
  title: tiu.title,
  description: tiu.intro,
  alternates: { canonical: "/tiu" },
};

/** /tiu — Takmičenja i uspjesi: the students' achievements, year by year. */
export default function TiuPage() {
  return <Tiu />;
}
