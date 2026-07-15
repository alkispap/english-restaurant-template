import shortlistIndexData from "../../data/shortlist-index.json";
import {
  DEFAULT_SHORTLIST_LIMIT,
  normalizeShortlistSlugs,
  type ShortlistListingSummary
} from "@/lib/shortlist";
import { unpackShortlistSummaries, type PackedShortlistIndex } from "@/lib/shortlist-index";

export const shortlistListingSummaries = unpackShortlistSummaries(
  shortlistIndexData as PackedShortlistIndex
);

const shortlistSummaryBySlug = new Map(shortlistListingSummaries.map((listing) => [listing.slug, listing]));

export function getClientShortlistListingSummaries(slugs: string[]): ShortlistListingSummary[] {
  return normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT)
    .map((slug) => shortlistSummaryBySlug.get(slug))
    .filter((listing): listing is ShortlistListingSummary => Boolean(listing));
}
