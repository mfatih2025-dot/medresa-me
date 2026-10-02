import type { Dictionary } from "@/content";
import { getLatestSocial, type SocialItem } from "@/lib/social";
import { SocialStack, type SocialCardData } from "./SocialStack";

/** Shorten a caption at a word boundary; the full text stays on the platform. */
function excerpt(text: string, max = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "")}…`;
}

const dateFormat = new Intl.DateTimeFormat("bs-BA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Podgorica",
});

function toCard(item: SocialItem, dict: Dictionary): SocialCardData {
  const { feed } = dict;
  const platform = feed.platforms[item.platform];
  if (item.kind === "post")
    return {
      platform: item.platform,
      platformLabel: platform,
      url: item.url,
      meta: dateFormat.format(new Date(item.date)),
      dateTime: item.date,
      text: excerpt(item.text),
      media: item.media,
      action: feed.open.post,
      label: `${platform}: ${feed.open.post}`,
    };
  return {
    platform: item.platform,
    platformLabel: platform,
    url: item.url,
    meta: item.handle,
    text: item.text,
    media: item.media,
    action: feed.open.profile,
    label: `${platform} ${item.handle}: ${feed.open.profile}`,
  };
}

/**
 * Pratite život Medrese: the latest Instagram and Facebook post as two
 * editorial cards (server component: data is fetched here, never in the
 * browser; see src/lib/social for the Meta Graph API and fallbacks).
 */
export async function SocialFeed({ dict }: { dict: Dictionary }) {
  const latest = await getLatestSocial();
  return (
    <SocialStack
      copy={{ eyebrow: dict.feed.eyebrow, heading: dict.feed.heading, lead: dict.feed.lead }}
      cards={[toCard(latest.instagram, dict), toCard(latest.facebook, dict)]}
    />
  );
}
