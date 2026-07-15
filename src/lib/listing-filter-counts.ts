import listingFilterCountsData from "../../data/listing-filter-counts.json";
import type { ListingFilters } from "@/lib/directory";
import { slugify } from "@/lib/slug";

export type CountedListingFilterKey = "area" | "neighborhood" | "category" | "type" | "dietary" | "service" | "offering" | "price";

const countedListingFilterKeys: CountedListingFilterKey[] = [
  "area",
  "neighborhood",
  "category",
  "type",
  "dietary",
  "service",
  "offering",
  "price"
];
const serializedListingFilterCounts = listingFilterCountsData as Record<
  CountedListingFilterKey,
  Record<string, number>
>;
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

  listingFilterCountsCache = Object.fromEntries(
    countedListingFilterKeys.map((key) => [key, new Map(Object.entries(serializedListingFilterCounts[key]))])
  ) as Record<CountedListingFilterKey, Map<string, number>>;
  return listingFilterCountsCache;
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
