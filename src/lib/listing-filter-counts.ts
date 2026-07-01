import { listings } from "@/data/listings";
import type { ListingFilters } from "@/lib/directory";
import { slugify } from "@/lib/slug";

export type CountedListingFilterKey = "area" | "neighborhood" | "category" | "type" | "dietary" | "service" | "offering" | "price";

let listingFilterCountsCache: Record<CountedListingFilterKey, Map<string, number>> | null = null;

export function getListingFilterCount(key: CountedListingFilterKey, slug: string) {
  return getListingFilterCounts()[key].get(slug) ?? 0;
}

export function getIndexedListingFilterCount(filters: ListingFilters): number | undefined {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined);
  if (entries.length !== 1) return undefined;

  const [key, value] = entries[0] as [string, string | string[] | number | undefined];
  const singleValue = Array.isArray(value) && value.length === 1 ? value[0] : value;
  if (!isCountedListingFilterKey(key) || typeof singleValue !== "string") return undefined;

  return getListingFilterCount(key, key === "price" ? singleValue : slugify(singleValue));
}

export function getListingFilterCounts() {
  if (listingFilterCountsCache) return listingFilterCountsCache;

  const counts: Record<CountedListingFilterKey, Map<string, number>> = {
    area: new Map(),
    neighborhood: new Map(),
    category: new Map(),
    type: new Map(),
    dietary: new Map(),
    service: new Map(),
    offering: new Map(),
    price: new Map()
  };

  listings.forEach((listing) => {
    increment(counts.area, listing.area);
    increment(counts.neighborhood, listing.neighborhood);
    listing.categories.forEach((value) => increment(counts.category, value));
    listing.listingTypes.forEach((value) => increment(counts.type, value));
    listing.dietaryOptions.forEach((value) => increment(counts.dietary, value));
    (listing.details?.serviceOptions ?? []).forEach((value) => increment(counts.service, value));
    (listing.details?.offerings ?? []).forEach((value) => increment(counts.offering, value));
    incrementExact(counts.price, listing.priceLevel);
  });

  listingFilterCountsCache = counts;
  return counts;
}

function increment(counts: Map<string, number>, value?: string) {
  if (!value) return;
  const slug = slugify(value);
  counts.set(slug, (counts.get(slug) ?? 0) + 1);
}

function incrementExact(counts: Map<string, number>, value?: string) {
  if (!value) return;
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function isCountedListingFilterKey(key: string): key is CountedListingFilterKey {
  return (
    key === "area" ||
    key === "neighborhood" ||
    key === "category" ||
    key === "type" ||
    key === "dietary" ||
    key === "service" ||
    key === "offering" ||
    key === "price"
  );
}
