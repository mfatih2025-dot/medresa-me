import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/content";
import { site } from "@/content/site";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";

// Only the weights/styles in use are loaded (no synthesized bold or italic):
// 300 body · 400 sub-headings, navigation, statistics · 500 headings, buttons, labels.
const kanit = Kanit({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-kanit",
  display: "swap",
});

const dict = getDictionary(defaultLocale);

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: dict.meta.title, template: `%s · ${site.name}` },
  description: dict.meta.description,
  openGraph: {
    title: dict.meta.title,
    description: dict.meta.description,
    locale: "bs_BA",
    type: "website",
    images: [{ url: "/images/hero-campus.jpg", width: 1627, height: 1080 }],
  },
  icons: { icon: site.logo.src, apple: site.logo.src },
};

export const viewport: Viewport = {
  themeColor: "#0a2a21",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={dict.lang} className={kanit.variable}>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-gold px-5 py-3 text-sm font-medium text-green-deep transition-transform focus:translate-y-0"
        >
          {dict.ui.skip}
        </a>
        <Header dict={dict} />
        <main id="main">{children}</main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
