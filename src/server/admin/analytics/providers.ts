import type { Period, Provider, ProviderReport } from "@/admin/analytics/model";
import type { WebsiteRequestResult } from "@/admin/analytics/websiteRequests";
import type { InstagramDiagnostic } from "@/admin/analytics/instagramTest";
import { blank, ProviderFailure } from "./common";
import { website, websiteConfigured } from "./website";
import { instagram, instagramConfigured, facebook, facebookConfigured } from "./meta";
import { youtube, youtubeConfigured } from "./youtube";
export const configurations = { website: websiteConfigured, instagram: instagramConfigured, facebook: facebookConfigured, youtube: youtubeConfigured };
export const timezones = { website: "UTC", instagram: "UTC", facebook: "America/Los_Angeles", youtube: "America/Los_Angeles" };
export async function collectProvider(provider: Provider, period: Period, now: Date, signal: AbortSignal, websiteObserver?: (result: WebsiteRequestResult) => void, instagramDiagnostic?: InstagramDiagnostic): Promise<ProviderReport> {
  try { return provider === "website" ? await website(period, now, signal, websiteObserver) : provider === "instagram" ? await instagram(period, now, signal, instagramDiagnostic) : await ({ facebook, youtube }[provider])(period, now, signal); }
  catch (error) {
    const r = blank(provider, period, now, timezones[provider], configurations[provider]());
    const e = error instanceof ProviderFailure ? error : new ProviderFailure("error", "invalid_response");
    r.state = e.state; r.reason = e.reason; r.lastAttemptAt = now.toISOString();
    if (e.state === "permission_required") r.requiredPermissions = provider === "instagram" ? ["instagram_business_manage_insights"] : provider === "facebook" ? ["read_insights", "pages_read_engagement"] : provider === "youtube" ? ["youtube.readonly", "yt-analytics.readonly"] : [];
    return r;
  }
}
