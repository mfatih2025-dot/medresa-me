import type { Metadata } from "next";
import { kontakt } from "@/content/kontakt";
import { Kontakt } from "@/components/kontakt/Kontakt";

export const metadata: Metadata = {
  title: kontakt.title,
  description: `${kontakt.heading}: ${kontakt.tuzi.address}, ${kontakt.tuzi.fields[0].value}`,
  alternates: { canonical: "/kontakt" },
};

/** /kontakt — Kontakt: Tuzi and the Rožaje department, and the map. */
export default function KontaktPage() {
  return <Kontakt />;
}
