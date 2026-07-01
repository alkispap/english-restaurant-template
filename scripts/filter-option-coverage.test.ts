import assert from "node:assert/strict";
import { directoryConfig } from "../src/config/directory";
import { listingSearchRecords, type ListingSearchRecord } from "../src/data/listing-search-records";
import { getFilterPanelOptionGroups, type FilterOption } from "../src/lib/filter-panel-options";
import {
  filterListingSearchRecords,
  getSearchAccessibilityOptions,
  getSearchAmenities,
  getSearchAreas,
  getSearchAtmospheres,
  getSearchBusStops,
  getSearchCategories,
  getSearchChildrenOptions,
  getSearchCrowdOptions,
  getSearchDietaryOptions,
  getSearchDiningOptions,
  getSearchHighlightOptions,
  getSearchListingTypes,
  getSearchNeighborhoods,
  getSearchNearbyPlaces,
  getSearchOfferings,
  getSearchParkingOptions,
  getSearchPaymentOptions,
  getSearchPetOptions,
  getSearchPlanningOptions,
  getSearchPopularForOptions,
  getSearchRatingFilterOptions,
  getSearchServiceOptions,
  getSearchTubeStations
} from "../src/lib/listing-search";
import { slugify } from "../src/lib/slug";

type FilterName =
  | "area"
  | "neighborhood"
  | "category"
  | "type"
  | "dietary"
  | "service"
  | "offering"
  | "highlight"
  | "popularFor"
  | "dining"
  | "amenity"
  | "accessibility"
  | "atmosphere"
  | "crowd"
  | "planning"
  | "payment"
  | "children"
  | "parking"
  | "pets"
  | "tube"
  | "bus"
  | "nearby"
  | "price"
  | "rating";

type FilterSpec = {
  name: FilterName;
  options: FilterOption[];
  indexedValues?: Set<string>;
  listingValues?: (listing: ListingSearchRecord) => string[];
};

const option = (label: string): FilterOption => ({ label, value: slugify(label) });
const options = (labels: string[]) => labels.map(option);

const specs: FilterSpec[] = [
  { name: "area", options: options(getSearchAreas()), listingValues: (listing) => values(listing.area) },
  { name: "neighborhood", options: options(getSearchNeighborhoods()), listingValues: (listing) => values(listing.neighborhood) },
  { name: "category", options: options(getSearchCategories()), listingValues: (listing) => listing.categories },
  { name: "type", options: options(getSearchListingTypes()), listingValues: (listing) => listing.listingTypes },
  { name: "dietary", options: options(getSearchDietaryOptions()), listingValues: (listing) => listing.dietaryOptions },
  { name: "service", options: options(getSearchServiceOptions()), listingValues: (listing) => listing.details?.serviceOptions ?? [] },
  { name: "offering", options: options(getSearchOfferings()), listingValues: (listing) => listing.details?.offerings ?? [] },
  { name: "highlight", options: options(getSearchHighlightOptions()), listingValues: (listing) => listing.details?.highlights ?? [] },
  { name: "popularFor", options: options(getSearchPopularForOptions()), listingValues: (listing) => listing.details?.popularFor ?? [] },
  { name: "dining", options: options(getSearchDiningOptions()), listingValues: (listing) => listing.details?.diningOptions ?? [] },
  { name: "amenity", options: options(getSearchAmenities()), listingValues: (listing) => listing.details?.amenities ?? [] },
  { name: "accessibility", options: options(getSearchAccessibilityOptions()), listingValues: (listing) => listing.details?.accessibility ?? [] },
  { name: "atmosphere", options: options(getSearchAtmospheres()), listingValues: (listing) => listing.details?.atmosphere ?? [] },
  { name: "crowd", options: options(getSearchCrowdOptions()), listingValues: (listing) => listing.details?.crowd ?? [] },
  { name: "planning", options: options(getSearchPlanningOptions()), listingValues: (listing) => listing.details?.planning ?? [] },
  { name: "payment", options: options(getSearchPaymentOptions()), listingValues: (listing) => listing.details?.payments ?? [] },
  { name: "children", options: options(getSearchChildrenOptions()), listingValues: (listing) => listing.details?.children ?? [] },
  { name: "parking", options: options(getSearchParkingOptions()), listingValues: (listing) => listing.details?.parking ?? [] },
  { name: "pets", options: options(getSearchPetOptions()), listingValues: (listing) => listing.details?.pets ?? [] },
  { name: "tube", options: options(getSearchTubeStations()), listingValues: (listing) => values(listing.location?.tubeStation) },
  { name: "bus", options: options(getSearchBusStops()), listingValues: (listing) => values(listing.location?.busStop) },
  { name: "nearby", options: options(getSearchNearbyPlaces()), listingValues: (listing) => listing.location?.nearbyPlaces ?? [] },
  {
    name: "price",
    options: directoryConfig.priceLevels.map((label) => ({ label, value: `price-${label.length}` })),
    listingValues: (listing) => values(listing.priceLevel).flatMap((price) => [price, `price-${price.length}`])
  },
  {
    name: "rating",
    options: getSearchRatingFilterOptions(),
    indexedValues: new Set(
      listingSearchRecords
        .map((listing) => listing.rating)
        .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating))
        .flatMap((rating) => Array.from({ length: Math.floor(rating) }, (_, index) => String(index + 1)))
    )
  }
];

const panelGroups = new Map(getFilterPanelOptionGroups().map((group) => [group.name, group]));

specs.forEach((spec) => {
  assert.ok(spec.options.length > 0, `${spec.name} should expose source options`);

  const panelGroup = panelGroups.get(spec.name);
  assert.ok(panelGroup, `${spec.name} should be present in the filter panel`);
  assert.equal(
    panelGroup.totalOptions,
    spec.options.length,
    `${spec.name} panel total should match its source option count`
  );

  const indexedValues = spec.indexedValues ?? buildIndex(spec.listingValues ?? (() => []));
  const missingOptions = spec.options.filter((item) => !indexedValues.has(item.value));
  assert.deepEqual(missingOptions, [], `${spec.name} options should all map to indexed listing values`);

  sampleOptions(spec.options).forEach((item) => {
    const results = filterListingSearchRecords(
      spec.name === "rating" ? { rating: Number(item.value) } : { [spec.name]: item.value }
    );

    assert.ok(results.length > 0, `${spec.name}=${item.value} should return results`);
    assert.ok(
      results.every((listing) => listingMatches(spec, listing, item.value)),
      `${spec.name}=${item.value} should only return matching listings`
    );
  });
});

function buildIndex(readValues: (listing: ListingSearchRecord) => string[]) {
  const index = new Set<string>();
  listingSearchRecords.forEach((listing) => {
    readValues(listing).forEach((value) => {
      index.add(value);
      index.add(slugify(value));
    });
  });
  return index;
}

function listingMatches(spec: FilterSpec, listing: ListingSearchRecord, filterValue: string) {
  if (spec.name === "rating") return Number(listing.rating ?? 0) >= Number(filterValue);

  const allowedValues = new Set((spec.listingValues?.(listing) ?? []).flatMap((value) => [value, slugify(value)]));
  return allowedValues.has(filterValue);
}

function sampleOptions(items: FilterOption[]) {
  const indexes = new Set([0, Math.floor(items.length / 2), items.length - 1]);
  return [...indexes].map((index) => items[index]).filter((item): item is FilterOption => Boolean(item));
}

function values(value?: string) {
  return value ? [value] : [];
}

console.log("filter option coverage tests passed");
