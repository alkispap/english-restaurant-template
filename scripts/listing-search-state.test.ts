import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { directoryConfig } from "../src/config/directory";
import { listingSearchRecords, type ListingSearchRecord } from "../src/data/listing-search-records";
import {
  buildListingSearchState,
  filterListingSearchRecords,
  type ListingFacetName,
  type ListingSearchFilters
} from "../src/lib/listing-search";
import { getReviewStrengthScore } from "../src/lib/review-strength";
import { searchableTextMatches } from "../src/lib/search-quality";
import { slugify } from "../src/lib/slug";

const scenarios: ListingSearchFilters[] = [
  { area: "westminster" },
  { q: "Dishoom" },
  { q: "café" },
  { q: "take-away" },
  { q: "biryani near me" },
  { q: "vegan", area: ["camden", "westminster"], dietary: "vegan", sort: "reviews" },
  { category: "indian", price: ["price-1", "price-2"], rating: 4, sort: "price" },
  { service: "delivery", sort: "rating" },
  { neighborhood: ["soho", "covent-garden"], sort: "featured" }
];

for (const filters of scenarios) {
  assert.deepEqual(
    filterListingSearchRecords(filters).map((listing) => listing.slug),
    legacyFilterListingSearchRecords(filters).map((listing) => listing.slug),
    `single-pass search should preserve exact ordered results for ${JSON.stringify(filters)}`
  );
}

const contextualFilters: ListingSearchFilters = {
  q: "indian",
  area: "westminster",
  category: "indian",
  dietary: "vegan",
  service: "delivery",
  price: "price-2",
  rating: 4
};
const contextualState = buildListingSearchState(contextualFilters);
assert.ok(contextualState.availableValuesByGroup, "contextual search should return facet availability");

for (const name of ["area", "category", "dietary", "service", "price", "rating"] as const) {
  assert.deepEqual(
    [...(contextualState.availableValuesByGroup?.get(name) ?? [])].sort(),
    [...legacyAvailableValues(contextualFilters, name)].sort(),
    `${name} availability should match filtering with only that group removed`
  );
}

const unfilteredState = buildListingSearchState({ sort: "reviews" });
assert.equal(
  unfilteredState.availableValuesByGroup,
  undefined,
  "sort-only states should reuse static filter options without building contextual availability"
);

const filterPanelSource = fs.readFileSync(path.join(process.cwd(), "src", "lib", "filter-panel-options.ts"), "utf8");
assert.doesNotMatch(
  filterPanelSource,
  /filterListingSearchRecords/,
  "filter option groups should not perform a full listing search per group"
);
assert.match(
  filterPanelSource,
  /buildListingSearchState/,
  "standalone contextual filter options should share the single-pass search state"
);

const warmQueryTimings = Array.from({ length: 5 }, () => timed(() => buildListingSearchState({ q: "Dishoom" }))).sort(
  (a, b) => a - b
);
assert.ok(
  warmQueryTimings[2] < 500,
  `warm single-pass query state should remain below 500ms; median was ${Math.round(warmQueryTimings[2])}ms`
);

console.log("listing search state parity and performance tests passed");

function legacyFilterListingSearchRecords(filters: ListingSearchFilters) {
  const query = filters.q?.toLowerCase().trim();
  let result = listingSearchRecords.filter((listing) => {
    const searchable = [
      listing.name,
      listing.description,
      listing.area,
      listing.neighborhood,
      listing.borough,
      listing.address,
      listing.postcode,
      ...listing.categories,
      ...listing.listingTypes,
      ...listing.dietaryOptions,
      ...searchableFeatureValues(listing),
      ...(listing.details?.offerings ?? []),
      ...listing.tags
    ];

    return (
      (!query || searchableTextMatches(query, searchable)) &&
      matchesMulti(listing.area ? [listing.area] : [], filters.area) &&
      matchesMulti(listing.neighborhood ? [listing.neighborhood] : [], filters.neighborhood) &&
      matchesMulti(listing.categories, filters.category) &&
      matchesMulti(listing.listingTypes, filters.type) &&
      matchesMulti(listing.dietaryOptions, filters.dietary) &&
      matchesMulti(listing.details?.serviceOptions ?? [], filters.service) &&
      matchesMulti(listing.details?.offerings ?? [], filters.offering) &&
      matchesMulti(listing.details?.highlights ?? [], filters.highlight) &&
      matchesMulti(listing.details?.popularFor ?? [], filters.popularFor) &&
      matchesMulti(listing.details?.diningOptions ?? [], filters.dining) &&
      matchesMulti(listing.details?.amenities ?? [], filters.amenity) &&
      matchesMulti(listing.details?.accessibility ?? [], filters.accessibility) &&
      matchesMulti(listing.details?.atmosphere ?? [], filters.atmosphere) &&
      matchesMulti(listing.details?.crowd ?? [], filters.crowd) &&
      matchesMulti(listing.details?.planning ?? [], filters.planning) &&
      matchesMulti(listing.details?.payments ?? [], filters.payment) &&
      matchesMulti(listing.details?.children ?? [], filters.children) &&
      matchesMulti(listing.details?.parking ?? [], filters.parking) &&
      matchesMulti(listing.details?.pets ?? [], filters.pets) &&
      matchesMulti(listing.location?.tubeStation ? [listing.location.tubeStation] : [], filters.tube) &&
      matchesMulti(listing.location?.busStop ? [listing.location.busStop] : [], filters.bus) &&
      matchesMulti(listing.location?.nearbyPlaces ?? [], filters.nearby) &&
      matchesPrice(listing.priceLevel, filters.price) &&
      (!filters.rating || Number(listing.rating ?? 0) >= filters.rating)
    );
  });

  const sort = filters.sort ?? directoryConfig.defaultSort;
  result = [...result].sort((a, b) => {
    if (sort === "rating") return compareByReviewStrength(a, b);
    if (sort === "reviews") return Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0);
    if (sort === "price") return priceWeight(a.priceLevel) - priceWeight(b.priceLevel);
    return (
      Number(b.featured) - Number(a.featured) ||
      Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
      Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    );
  });
  return result;
}

function legacyAvailableValues(filters: ListingSearchFilters, name: ListingFacetName) {
  const listings = legacyFilterListingSearchRecords({ ...filters, [name]: undefined });
  if (name === "rating") {
    const ratings = listings
      .map((listing) => listing.rating)
      .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));
    if (!ratings.length) return new Set<string>();
    const maximum = Math.min(5, Math.ceil(Math.max(...ratings)));
    const minimum = Math.max(1, Math.floor(Math.min(...ratings)));
    return new Set(Array.from({ length: maximum - minimum + 1 }, (_, index) => String(maximum - index)));
  }

  return new Set(listings.flatMap((listing) => facetValues(listing, name)));
}

function facetValues(listing: ListingSearchRecord, name: ListingFacetName) {
  const values = name === "area" ? value(listing.area)
    : name === "category" ? listing.categories
      : name === "dietary" ? listing.dietaryOptions
        : name === "service" ? listing.details?.serviceOptions ?? []
          : name === "price" ? value(listing.priceLevel).flatMap((price) => [price, `price-${price.length}`])
            : [];
  return name === "price" ? values : values.map(slugify).filter(Boolean);
}

function searchableFeatureValues(listing: ListingSearchRecord) {
  return [
    ...(listing.details?.serviceOptions ?? []),
    ...(listing.details?.highlights ?? []),
    ...(listing.details?.amenities ?? []),
    ...(listing.details?.atmosphere ?? []),
    ...(listing.details?.popularFor ?? []),
    ...(listing.details?.accessibility ?? []),
    ...(listing.details?.diningOptions ?? []),
    ...(listing.details?.crowd ?? []),
    ...(listing.details?.planning ?? []),
    ...(listing.details?.children ?? []),
    ...(listing.details?.parking ?? []),
    ...(listing.details?.pets ?? [])
  ];
}

function matchesMulti(values: string[], filter?: string | string[]) {
  if (!filter || (Array.isArray(filter) && !filter.length)) return true;
  const selected = Array.isArray(filter) ? filter : [filter];
  return values.some((item) => selected.includes(slugify(item)));
}

function matchesPrice(priceLevel?: string, filter?: string | string[]) {
  if (!filter || (Array.isArray(filter) && !filter.length)) return true;
  if (!priceLevel) return false;
  const selected = Array.isArray(filter) ? filter : [filter];
  return selected.some((item) => item === priceLevel || item === `price-${priceLevel.length}`);
}

function compareByReviewStrength(a: ListingSearchRecord, b: ListingSearchRecord) {
  return (
    getReviewStrengthScore(b) - getReviewStrengthScore(a) ||
    Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
    Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
  );
}

function priceWeight(price?: string) {
  if (price === "£") return 1;
  if (price === "££") return 2;
  if (price === "£££") return 3;
  return 9;
}

function value(item?: string) {
  return item ? [item] : [];
}

function timed(run: () => unknown) {
  const started = performance.now();
  run();
  return performance.now() - started;
}
