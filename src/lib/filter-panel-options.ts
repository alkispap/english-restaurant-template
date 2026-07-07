import { directoryConfig } from "@/config/directory";
import type { ListingSearchRecord } from "@/data/listing-search-records";
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
  getSearchTubeStations,
  type ListingSearchFilters
} from "@/lib/listing-search";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import type { ListingsPageLinkValues } from "@/lib/listings-page";
import { slugify } from "@/lib/slug";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterPanelOptionGroup = {
  label: string;
  modalLabel?: string;
  name: string;
  options: FilterOption[];
  totalOptions: number;
};

type OptionGroupConfig = Omit<FilterPanelOptionGroup, "options" | "totalOptions"> & {
  options: FilterOption[];
  contextualOptions?: (listings: ListingSearchRecord[]) => FilterOption[];
  maxInitialOptions?: number;
};

type DetailOptionKey =
  | "highlights"
  | "popularFor"
  | "diningOptions"
  | "amenities"
  | "accessibility"
  | "atmosphere"
  | "crowd"
  | "planning"
  | "payments"
  | "children"
  | "parking"
  | "pets";

const DEFAULT_MAX_INITIAL_OPTIONS = 16;
let cachedOptionGroupConfigs: OptionGroupConfig[] | null = null;

export function getFilterPanelOptionGroups(values: ListingsPageLinkValues = {}) {
  const groups = getOptionGroupConfigs();

  return groups.map((group) => {
    const contextOptions = getContextualOptions(group, values);
    const options = limitOptions(
      contextOptions,
      valueForName(values, group.name),
      group.maxInitialOptions ?? DEFAULT_MAX_INITIAL_OPTIONS,
      group.options
    );

    return {
      label: group.label,
      modalLabel: group.modalLabel,
      name: group.name,
      options,
      totalOptions: contextOptions.length
    };
  });
}

function getOptionGroupConfigs() {
  if (cachedOptionGroupConfigs) return cachedOptionGroupConfigs;

  const labels = directoryConfig.filterLabels;
  cachedOptionGroupConfigs = [
    { label: "Area", name: "area", options: getSearchAreas().map(toOption), contextualOptions: (listings) => uniqueOptions(listings.map((listing) => listing.area)), maxInitialOptions: 40 },
    { label: "Neighborhood", name: "neighborhood", options: getSearchNeighborhoods().map(toOption), contextualOptions: (listings) => uniqueOptions(listings.map((listing) => listing.neighborhood)) },
    { label: directoryConfig.categoryPluralLabel, name: "category", options: getSearchCategories().map(toOption), contextualOptions: (listings) => uniqueOptions(listings.flatMap((listing) => listing.categories)), maxInitialOptions: 24 },
    ...(isDirectoryFeatureEnabled("listingTypePages")
      ? [{ label: labels.type, modalLabel: labels.typeModal, name: "type", options: getSearchListingTypes().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.listingTypes)) }]
      : []),
    ...(isDirectoryFeatureEnabled("dietaryPages")
      ? [{ label: labels.dietary, name: "dietary", options: getSearchDietaryOptions().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.dietaryOptions)) }]
      : []),
    ...(isDirectoryFeatureEnabled("servicePages")
      ? [{ label: labels.service, name: "service", options: getSearchServiceOptions().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.details?.serviceOptions ?? [])) }]
      : []),
    ...(isDirectoryFeatureEnabled("offeringPages")
      ? [{ label: labels.offering, name: "offering", options: getSearchOfferings().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.details?.offerings ?? [])) }]
      : []),
    { label: labels.highlight, name: "highlight", options: getSearchHighlightOptions().map(toOption), contextualOptions: detailOptions("highlights") },
    { label: labels.popularFor, name: "popularFor", options: getSearchPopularForOptions().map(toOption), contextualOptions: detailOptions("popularFor") },
    { label: labels.dining, name: "dining", options: getSearchDiningOptions().map(toOption), contextualOptions: detailOptions("diningOptions") },
    { label: "Amenity", name: "amenity", options: getSearchAmenities().map(toOption), contextualOptions: detailOptions("amenities"), maxInitialOptions: 12 },
    { label: "Accessibility", name: "accessibility", options: getSearchAccessibilityOptions().map(toOption), contextualOptions: detailOptions("accessibility"), maxInitialOptions: 12 },
    { label: "Atmosphere", name: "atmosphere", options: getSearchAtmospheres().map(toOption), contextualOptions: detailOptions("atmosphere"), maxInitialOptions: 12 },
    { label: "Crowd", name: "crowd", options: getSearchCrowdOptions().map(toOption), contextualOptions: detailOptions("crowd"), maxInitialOptions: 12 },
    { label: "Planning", name: "planning", options: getSearchPlanningOptions().map(toOption), contextualOptions: detailOptions("planning"), maxInitialOptions: 12 },
    { label: "Payment", name: "payment", options: getSearchPaymentOptions().map(toOption), contextualOptions: detailOptions("payments"), maxInitialOptions: 12 },
    { label: "Children", name: "children", options: getSearchChildrenOptions().map(toOption), contextualOptions: detailOptions("children"), maxInitialOptions: 12 },
    { label: "Parking", name: "parking", options: getSearchParkingOptions().map(toOption), contextualOptions: detailOptions("parking"), maxInitialOptions: 12 },
    { label: "Pets", name: "pets", options: getSearchPetOptions().map(toOption), contextualOptions: detailOptions("pets"), maxInitialOptions: 12 },
    ...(isDirectoryFeatureEnabled("transport")
      ? [
          { label: "Underground station", modalLabel: "Underground stations", name: "tube", options: getSearchTubeStations().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.map((listing) => listing.location?.tubeStation)), maxInitialOptions: 12 },
          { label: "Bus stop", name: "bus", options: getSearchBusStops().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.map((listing) => listing.location?.busStop)), maxInitialOptions: 12 },
          { label: "Nearby place", name: "nearby", options: getSearchNearbyPlaces().map(toOption), contextualOptions: (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.location?.nearbyPlaces ?? [])), maxInitialOptions: 12 }
        ]
      : []),
    { label: "Price", name: "price", options: directoryConfig.priceLevels.map(toPriceOption), contextualOptions: (listings) => uniquePriceOptions(listings.map((listing) => listing.priceLevel)) },
    { label: "Minimum rating", name: "rating", options: getSearchRatingFilterOptions(), contextualOptions: ratingOptions }
  ];

  return cachedOptionGroupConfigs;
}

function getContextualOptions(group: OptionGroupConfig, values: ListingsPageLinkValues) {
  if (!group.contextualOptions || !hasContextualValues(values, group.name)) return group.options;

  const filters = filtersForOptionGroup(values, group.name);
  const listings = filterListingSearchRecords(filters);
  const availableValues = new Set(group.contextualOptions(listings).map((option) => option.value));

  return group.options.filter((option) => availableValues.has(option.value));
}

function limitOptions(
  options: FilterOption[],
  selected: string | string[] | undefined,
  limit: number,
  selectedFallbackOptions: FilterOption[] = options
) {
  const selectedValues = new Set(normalizeValues(selected));
  const selectedOptions = selectedFallbackOptions.filter((option) => selectedValues.has(option.value));
  const visibleOptions = options.filter((option) => !selectedValues.has(option.value)).slice(0, Math.max(0, limit - selectedOptions.length));

  return [...selectedOptions, ...visibleOptions];
}

type SearchFilterName = keyof ListingSearchFilters;

function filtersForOptionGroup(values: ListingsPageLinkValues, groupName: string): ListingSearchFilters {
  const filters: ListingSearchFilters = {};
  filterNames.forEach((name) => {
    if (name === groupName) return;
    const value = values[name as keyof ListingsPageLinkValues];
    if (!value) return;
    if (name === "rating") {
      const rating = Number(value);
      if (Number.isFinite(rating)) filters.rating = rating;
      return;
    }
    filters[name] = value as never;
  });

  return filters;
}

function hasContextualValues(values: ListingsPageLinkValues, groupName: string) {
  return filterNames.some((name) => name !== groupName && Boolean(values[name as keyof ListingsPageLinkValues]));
}

function valueForName(values: ListingsPageLinkValues, name: string) {
  return values[name as keyof ListingsPageLinkValues] as string | string[] | undefined;
}

function normalizeValues(value?: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function toOption(label: string) {
  return { label, value: slugify(label) };
}

function toPriceOption(label: string) {
  return { label, value: `price-${label.length}` };
}

function uniqueOptions(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const options: FilterOption[] = [];

  values.forEach((value) => {
    if (!value) return;
    const label = value.trim();
    const option = toOption(label);
    if (!option.value || seen.has(option.value)) return;
    seen.add(option.value);
    options.push(option);
  });

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function uniquePriceOptions(values: Array<string | undefined>) {
  const available = new Set(values.filter((value): value is string => Boolean(value)));
  return directoryConfig.priceLevels.filter((label) => available.has(label)).map(toPriceOption);
}

function ratingOptions(listings: ListingSearchRecord[]) {
  const ratings = listings
    .map((listing) => listing.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));
  if (!ratings.length) return [];

  const maxRating = Math.min(5, Math.ceil(Math.max(...ratings)));
  const minRating = Math.max(1, Math.floor(Math.min(...ratings)));

  return Array.from({ length: maxRating - minRating + 1 }, (_, index) => {
    const rating = maxRating - index;
    return { label: `${rating}+`, value: String(rating) };
  });
}

function detailOptions(key: DetailOptionKey) {
  return (listings: ListingSearchRecord[]) => uniqueOptions(listings.flatMap((listing) => listing.details?.[key] ?? []));
}

const filterNames: SearchFilterName[] = [
  "q",
  "area",
  "neighborhood",
  "category",
  "type",
  "dietary",
  "service",
  "offering",
  "highlight",
  "popularFor",
  "dining",
  "amenity",
  "accessibility",
  "atmosphere",
  "crowd",
  "planning",
  "payment",
  "children",
  "parking",
  "pets",
  "tube",
  "bus",
  "nearby",
  "price",
  "rating"
];
