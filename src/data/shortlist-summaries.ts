import { listingSearchRecords } from "@/data/listing-search-records";
import {
  DEFAULT_SHORTLIST_LIMIT,
  getAllShortlistListingSummaries,
  normalizeShortlistSlugs,
  type ShortlistListingSummary
} from "@/lib/shortlist";

export const shortlistListingSummaries = getAllShortlistListingSummaries(listingSearchRecords);

const shortlistSummaryBySlug = new Map(shortlistListingSummaries.map((listing) => [listing.slug, listing]));

export function getClientShortlistListingSummaries(slugs: string[]): ShortlistListingSummary[] {
  return normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT)
    .map((slug) => shortlistSummaryBySlug.get(slug))
    .filter((listing): listing is ShortlistListingSummary => Boolean(listing));
}
