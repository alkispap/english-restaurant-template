import type { ImportedListing } from "@/lib/directory-import";
import type { ListingPublicationRegistry, ListingPublicationState } from "@/lib/listing-publication";

export type ListingImportReconciliation = {
  listings: ImportedListing[];
  registry: ListingPublicationRegistry;
  matchedCount: number;
  newCount: number;
  sourceAbsentCount: number;
  newSlugs: string[];
  sourceAbsentSlugs: string[];
};

export function reconcileListingImport(
  existing: ImportedListing[],
  incoming: ImportedListing[],
  registry: ListingPublicationRegistry,
  initializedAt = new Date().toISOString()
): ListingImportReconciliation {
  const stateBySlug = new Map(registry.entries.map((state) => [state.listingSlug, state]));
  for (const listing of existing) {
    const state = stateBySlug.get(listing.slug);
    if (!state) throw new Error(`Missing publication state for retained listing: ${listing.slug}`);
    if (state.listingSourceId !== listing.provenance?.sourceId) throw new Error(`Publication source ID mismatch for retained listing: ${listing.slug}`);
  }
  if (stateBySlug.size !== existing.length) throw new Error("Publication registry contains records outside the retained listing dataset.");

  const existingBySlug = uniqueMap(existing, (listing) => listing.slug, "retained slug");
  const existingBySourceId = uniqueMap(existing.filter(hasSourceId), (listing) => listing.provenance.sourceId, "retained source ID");
  uniqueMap(incoming, (listing) => listing.slug, "incoming slug");
  uniqueMap(incoming.filter(hasSourceId), (listing) => listing.provenance.sourceId, "incoming source ID");

  const matchedExistingSlugs = new Set<string>();
  const newListings: ImportedListing[] = [];
  const newStates: ListingPublicationState[] = [];
  for (const listing of incoming) {
    const sourceId = listing.provenance?.sourceId;
    const sourceMatch = sourceId ? existingBySourceId.get(sourceId) : undefined;
    const slugMatch = existingBySlug.get(listing.slug);
    if (sourceMatch && sourceMatch.slug !== listing.slug) {
      throw new Error(`Incoming source ID ${sourceId} changed slug from ${sourceMatch.slug} to ${listing.slug}; use verification/entity resolution.`);
    }
    if (slugMatch && slugMatch.provenance?.sourceId !== sourceId) {
      throw new Error(`Incoming slug ${listing.slug} has a different source ID; refuse possible entity replacement.`);
    }
    const matched = sourceMatch ?? slugMatch;
    if (matched) {
      matchedExistingSlugs.add(matched.slug);
      continue;
    }
    newListings.push(listing);
    newStates.push({
      listingSlug: listing.slug,
      listingSourceId: sourceId,
      status: "pending-review",
      reason: "new-import",
      origin: "import-default",
      effectiveAt: normalizedTimestamp(listing.provenance?.importedAt ?? initializedAt),
      changedBy: "system:import"
    });
  }

  const sourceAbsentSlugs = existing.filter((listing) => !matchedExistingSlugs.has(listing.slug)).map((listing) => listing.slug);
  const nextRegistry = structuredClone(registry);
  nextRegistry.entries = [...nextRegistry.entries, ...newStates].sort((left, right) => left.listingSlug.localeCompare(right.listingSlug));
  return {
    listings: [...existing, ...newListings],
    registry: nextRegistry,
    matchedCount: matchedExistingSlugs.size,
    newCount: newListings.length,
    sourceAbsentCount: sourceAbsentSlugs.length,
    newSlugs: newListings.map((listing) => listing.slug),
    sourceAbsentSlugs
  };
}

function uniqueMap<T>(items: T[], key: (item: T) => string, label: string) {
  const map = new Map<string, T>();
  for (const item of items) {
    const value = key(item);
    if (map.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    map.set(value, item);
  }
  return map;
}

function hasSourceId(listing: ImportedListing): listing is ImportedListing & { provenance: ImportedListing["provenance"] & { sourceId: string } } {
  return Boolean(listing.provenance?.sourceId);
}

function normalizedTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid import initialization timestamp: ${value}`);
  return parsed.toISOString();
}
