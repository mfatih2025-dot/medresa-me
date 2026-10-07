import type { Metadata } from "next";
import { donacije } from "@/content/donacije";
import { Donacije } from "@/components/donacije/Donacije";

export const metadata: Metadata = {
  title: donacije.title,
  description: donacije.intro[0],
  alternates: { canonical: "/donacije" },
};

/** /donacije — Donacije: why supporting the Medresa matters, and how to do it. */
export default function DonacijePage() {
  return <Donacije />;
}
