import type { Metadata } from "next";
import { connection } from "next/server";
import { upisContent } from "@/content/upis";
import { publicAdmissionStatus } from "@/server/admin/results/admissions";
import { publishedHref } from "@/server/admin/results/service";
import { Upis } from "@/components/upis/Upis";
import { asLocale, pageMetadata } from "@/i18n/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const c = upisContent[locale];
  return pageMetadata("upis", locale, {
    title: c.title.join(" "),
    description: `${c.status.before} ${c.status.word}${c.status.after}`,
  });
}

/** Upis i prijemni: the admission status and its documents. */
export default async function Page({ params }: Props) {
  // Resolve published documents at request time even if the migration was absent at build.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "codex/admin-panel") await connection();
  const locale = asLocale((await params).locale);
  const [documentHref,admissionStatus] = await Promise.all([publishedHref(locale),publicAdmissionStatus()]);
  return <Upis locale={locale} documentHref={documentHref} admissionStatus={admissionStatus} />;
}
