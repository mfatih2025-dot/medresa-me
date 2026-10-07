import type { Dictionary } from "@/content";
import { socialProfiles } from "@/content/social";
import { getLatestSocial, type SocialItem } from "@/lib/social";
import { SocialStories, type SocialCardData } from "./SocialStories";

/** Shorten a caption at a word boundary; the full text stays on the platform. */
function excerpt(text: string, max = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "")}…`;
}

const dateFormat = (intl: string) =>
  new Intl.DateTimeFormat(intl, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Podgorica",
  });

function toCard(item: SocialItem, dict: Dictionary): SocialCardData {
  const { feed } = dict;
  const platform = feed.platforms[item.platform];
  // The profile cards' own copy is the site's, so it follows the page language;
  // a post's caption is the post's own and stays as published.
  const profile = feed.profiles[item.platform];
  const fallback = socialProfiles[item.platform].media;
  if (item.kind === "post")
    return {
      platform: item.platform,
      platformLabel: platform,
      url: item.url,
      meta: dateFormat(dict.ui.intl).format(new Date(item.date)),
      dateTime: item.date,
      // A post without a caption/message still gets a line (the platform description).
      text: excerpt(item.text) || profile.text,
      // A post without any picture keeps the card's photograph (the platform image).
      media: item.media ?? { ...fallback, alt: profile.alt },
      action: feed.open.post,
      label: `${platform}: ${feed.open.post}`,
    };
  return {
    platform: item.platform,
    platformLabel: platform,
    url: item.url,
    meta: item.handle,
    // Profile cards are the site's own (src/content/social.ts), written per language here.
    text: profile.text,
    media: { ...item.media, alt: profile.alt },
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
    <SocialStories
      copy={{
        eyebrow: dict.feed.eyebrow,
        heading: dict.feed.heading,
        lead: dict.feed.lead,
        prev: dict.ui.prevPost,
        next: dict.ui.nextPost,
      }}
      cards={[toCard(latest.instagram, dict), toCard(latest.facebook, dict)]}
    />
  );
}
