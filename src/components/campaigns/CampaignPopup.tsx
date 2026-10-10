"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { dismissalKey, uuid, validDestination, type PublicCampaign } from "@/admin/campaigns/model";
import { useLocale } from "@/i18n/client";
import { PosterDialog } from "./PosterDialog";
// Memory fallback still prevents repeated navigation prompts if localStorage is blocked.
const dismissedThisVisit = new Set<string>();
function dismissed(campaign: PublicCampaign) {
  const key = dismissalKey(campaign);
  try { return dismissedThisVisit.has(key) || localStorage.getItem(key) === "1"; } catch { return dismissedThisVisit.has(key); }
}
function accepted(value: unknown): value is PublicCampaign {
  const c = value as PublicCampaign;
  return !!c && uuid(c.id) && Number.isSafeInteger(c.version) && c.version > 0 && !!c.poster && uuid(c.poster.id) && c.poster.src === `/api/campaigns/poster/${c.id}?version=${c.version}` && Number.isInteger(c.poster.width) && c.poster.width > 0 && c.poster.width <= 20000 && Number.isInteger(c.poster.height) && c.poster.height > 0 && c.poster.height <= 20000 && typeof c.ctaText === "string" && c.ctaText.length > 0 && c.ctaText.length <= 80 && validDestination(c.ctaLink) && (c.endsAt === null || Number.isFinite(Date.parse(c.endsAt)) && Date.parse(c.endsAt) > Date.now());
}
export function CampaignPopup() {
  const pathname = usePathname();
  const locale = useLocale();
  const privatePage = !pathname || pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/admin-preview/");
  const [campaign, setCampaign] = useState<(PublicCampaign & { locale: typeof locale }) | null>(null), [gateway, setGateway] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setGateway(root.dataset.gateway === "1"); check();
    const observer = new MutationObserver(check); observer.observe(root, { attributes: true, attributeFilter: ["data-gateway"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (gateway || privatePage) return;
    let stopped = false, timer: ReturnType<typeof setTimeout> | undefined, pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || stopped) return; pending = true;
      let next = 60000;
      try {
        const response = await fetch(`/api/campaigns/current?locale=${locale}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        const value = response.ok ? await response.json() : null;
        if (stopped) return;
        const current = accepted(value?.campaign) && !dismissed(value.campaign) ? value.campaign : null;
        setCampaign(current ? {...current,locale} : null);
        const deadline = Date.parse(value?.nextChangeAt);
        if (Number.isFinite(deadline)) next = Math.max(100, Math.min(next, deadline - Date.now()));
      } catch { if (!stopped) setCampaign(null); } // Public pages remain usable during outages/missing migration.
      finally { pending = false; if (!stopped) { clearTimeout(timer); timer = setTimeout(refresh, next); } }
    };
    void refresh();
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; controller.abort(); clearTimeout(timer); document.removeEventListener("visibilitychange", visible); };
  }, [gateway, privatePage, locale]);
  const close = () => {
    if (campaign) {
      const key = dismissalKey(campaign); dismissedThisVisit.add(key);
      try { localStorage.setItem(key, "1"); } catch { /* private/storage-disabled mode uses session memory */ }
    }
    setCampaign(null);
  };
  return !gateway && !privatePage && campaign?.locale === locale ? <PosterDialog key={dismissalKey(campaign)} campaign={campaign} onClose={close} onUnavailable={() => { console.warn("medresa.campaign.poster.failed", { reason: "image_load_failed" }); setCampaign(null); }} /> : null;
}
