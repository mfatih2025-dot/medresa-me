import type { AppProps } from "next/app";
import { Kanit } from "next/font/google";
import Head from "next/head";
import styles from "@/admin/admin.module.css";

// Pages Router serves only administration. Public App Router styles/layout stay untouched.
const kanit = Kanit({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"], display: "swap" });
export default function AdminApp({ Component, pageProps }: AppProps) {
  return <div className={`${kanit.className} ${styles.root}`}>
    <Head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex,nofollow" /><link rel="icon" href="/brand/medresa-logo.png" /></Head>
    <Component {...pageProps} />
  </div>;
}
