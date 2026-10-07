import type { Metadata } from "next";
import { upis } from "@/content/upis";
import { Upis } from "@/components/upis/Upis";

export const metadata: Metadata = {
  title: "Upis i prijemni",
  description: `${upis.status.before} ${upis.status.word}${upis.status.after}`,
  alternates: { canonical: "/upis" },
};

/** /upis — Upis i prijemni: the admission status, its documents, and the welcome. */
export default function UpisPage() {
  return <Upis />;
}
