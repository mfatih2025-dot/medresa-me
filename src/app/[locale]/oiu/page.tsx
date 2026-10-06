import type { Metadata } from "next";
import { oiu } from "@/content/oiu";
import { Oiu } from "@/components/oiu/Oiu";

export const metadata: Metadata = {
  title: oiu.title,
  description: oiu.intro[0],
  alternates: { canonical: "/oiu" },
};

/** /oiu — Objekat i uslovi: the building and its spaces, walked through in photographs. */
export default function OiuPage() {
  return <Oiu />;
}
