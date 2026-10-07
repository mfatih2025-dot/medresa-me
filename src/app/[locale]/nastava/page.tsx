import type { Metadata } from "next";
import { nastava } from "@/content/nastava";
import { Nastava } from "@/components/nastava/Nastava";

export const metadata: Metadata = {
  title: nastava.title,
  description: nastava.intro[0],
  alternates: { canonical: "/nastava" },
};

/** /nastava — Nastava i predmeti: the two pillars of the programme, and what they lead to. */
export default function NastavaPage() {
  return <Nastava />;
}
