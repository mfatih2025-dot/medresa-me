import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary } from "@/content";
import { site } from "@/content/site";
import { defaultLocale } from "@/i18n/config";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
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
    <html lang={dict.lang} className={`${serif.variable} ${sans.variable}`}>
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
