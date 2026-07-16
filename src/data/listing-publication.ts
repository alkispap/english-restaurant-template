import publicationStatesData from "../../data/listing-publication-states.json";
import { listings, type Listing } from "@/data/listings";
import type { ListingPublicationRegistry, ListingPublicationState } from "@/lib/listing-publication";

export const listingPublicationRegistry = publicationStatesData as ListingPublicationRegistry;

if (listingPublicationRegistry.version !== 1) throw new Error("Unsupported listing publication registry version.");
if (listingPublicationRegistry.entries.length !== listings.length) {
  throw new Error(`Publication registry/listing count mismatch: ${listingPublicationRegistry.entries.length}/${listings.length}`);
}

export const listingPublicationStateBySlug = new Map<string, ListingPublicationState>();
for (const state of listingPublicationRegistry.entries) {
  if (listingPublicationStateBySlug.has(state.listingSlug)) throw new Error(`Duplicate publication state: ${state.listingSlug}`);
  listingPublicationStateBySlug.set(state.listingSlug, state);
}
for (const listing of listings) {
  const state = listingPublicationStateBySlug.get(listing.slug);
  if (!state) throw new Error(`Missing publication state: ${listing.slug}`);
  if (state.listingSourceId !== listing.provenance?.sourceId) throw new Error(`Publication source ID mismatch: ${listing.slug}`);
}

export const publishedListings: Listing[] = listings.filter((listing) => getListingPublicationState(listing.slug).status === "published");
export const pendingReviewListings: Listing[] = listings.filter((listing) => getListingPublicationState(listing.slug).status === "pending-review");
export const publiclyRoutableListings: Listing[] = listings.filter((listing) => getListingPublicationState(listing.slug).status !== "excluded");

export function getListingPublicationState(slug: string) {
  const state = listingPublicationStateBySlug.get(slug);
  if (!state) throw new Error(`Missing publication state: ${slug}`);
  return state;
}

export function getRetainedListingBySlug(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}

export function getPublishedListingBySlug(slug: string) {
  return publishedListings.find((listing) => listing.slug === slug);
}
