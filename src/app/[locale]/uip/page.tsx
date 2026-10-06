import type { Metadata } from "next";
import { locations } from "@/content/uip";
import { Directory } from "@/components/uip/Directory";
import { Service } from "@/components/uip/Service";

export const metadata: Metadata = {
  title: "Uprava i profesori",
  description:
    "Uprava, profesori i predmeti Medrese „Mehmed Fatih“ u Tuzima i u Područnom odjeljenju Rožaje, te vaspitna služba.",
  alternates: { canonical: "/uip" },
};

/** /uip — Uprava i profesori: leadership, the faculty by person and by subject, and the educational service. */
export default function UipPage() {
  return (
    <article className="bg-paper text-ink">
      <Directory locations={locations} service={<Service />} />
    </article>
  );
}
