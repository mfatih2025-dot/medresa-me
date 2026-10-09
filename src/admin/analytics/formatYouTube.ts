/** Stable Bosnian separators despite different server/browser CLDR versions. */
export function formatYouTube(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).formatToParts(value)
    .map(part => part.type === "decimal" ? "," : part.type === "group" ? "." : part.value).join("");
}
