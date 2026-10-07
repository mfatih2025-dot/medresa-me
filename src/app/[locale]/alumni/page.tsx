import type { Metadata } from "next";
import { alumni } from "@/content/alumni";
import { Alumni } from "@/components/alumni/Alumni";

export const metadata: Metadata = {
  title: alumni.title,
  description: alumni.intro,
  alternates: { canonical: "/alumni" },
};

/** /alumni — Alumni: every generation of the Medresa, each with its pano. */
export default function AlumniPage() {
  return <Alumni />;
}
