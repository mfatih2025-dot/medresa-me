"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { publicAnalyticsUrl } from "@/admin/analytics/publicTraffic";
const subscribe = () => () => {};
const currentPublicPage = () => publicAnalyticsUrl(window.location.href);
const serverPage = () => false;
function beforeSend(event: BeforeSendEvent) {
  return publicAnalyticsUrl(window.location.href) && publicAnalyticsUrl(event.url) ? event : null;
}
/** One SDK instance in the public shell. SDK owns pageviews and client navigation. */
export function PublicAnalytics() {
  usePathname(); // Re-evaluate exclusions after client-side navigation.
  const allowed = useSyncExternalStore(subscribe, currentPublicPage, serverPage);
  return allowed ? <Analytics beforeSend={beforeSend} debug={false} /> : null;
}
