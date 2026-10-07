import type { Metadata } from "next";
import { galerija } from "@/content/galerija";
import { Galerija } from "@/components/galerija/Galerija";

export const metadata: Metadata = {
  title: galerija.title,
  description: galerija.intro,
  alternates: { canonical: "/galerija" },
};

/** /galerija — Galerija: the Medresa complex in its own photographs. */
export default function GalerijaPage() {
  return <Galerija />;
}
