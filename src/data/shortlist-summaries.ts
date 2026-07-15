import shortlistSummariesData from "../../data/shortlist-summaries.json";
import {
  DEFAULT_SHORTLIST_LIMIT,
  normalizeShortlistSlugs,
  type ShortlistListingSummary
} from "@/lib/shortlist";

export const shortlistListingSummaries = shortlistSummariesData as ShortlistListingSummary[];

const shortlistSummaryBySlug = new Map(shortlistListingSummaries.map((listing) => [listing.slug, listing]));

export function getClientShortlistListingSummaries(slugs: string[]): ShortlistListingSummary[] {
  return normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT)
    .map((slug) => shortlistSummaryBySlug.get(slug))
    .filter((listing): listing is ShortlistListingSummary => Boolean(listing));
}
