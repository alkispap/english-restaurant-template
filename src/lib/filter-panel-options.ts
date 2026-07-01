import { directoryConfig } from "@/config/directory";
import {
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
  maxInitialOptions?: number;
};

const DEFAULT_MAX_INITIAL_OPTIONS = 16;

export function getFilterPanelOptionGroups(values: ListingsPageLinkValues = {}) {
  const labels = directoryConfig.filterLabels;
  const groups: OptionGroupConfig[] = [
    { label: "Area", name: "area", options: getSearchAreas().map(toOption), maxInitialOptions: 40 },
    { label: "Neighborhood", name: "neighborhood", options: getSearchNeighborhoods().map(toOption) },
    { label: directoryConfig.categoryPluralLabel, name: "category", options: getSearchCategories().map(toOption), maxInitialOptions: 24 },
    ...(isDirectoryFeatureEnabled("listingTypePages")
      ? [{ label: labels.type, modalLabel: labels.typeModal, name: "type", options: getSearchListingTypes().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("dietaryPages")
      ? [{ label: labels.dietary, name: "dietary", options: getSearchDietaryOptions().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("servicePages")
      ? [{ label: labels.service, name: "service", options: getSearchServiceOptions().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("offeringPages")
      ? [{ label: labels.offering, name: "offering", options: getSearchOfferings().map(toOption) }]
      : []),
    { label: labels.highlight, name: "highlight", options: getSearchHighlightOptions().map(toOption) },
    { label: labels.popularFor, name: "popularFor", options: getSearchPopularForOptions().map(toOption) },
    { label: labels.dining, name: "dining", options: getSearchDiningOptions().map(toOption) },
    { label: "Amenity", name: "amenity", options: getSearchAmenities().map(toOption), maxInitialOptions: 12 },
    { label: "Accessibility", name: "accessibility", options: getSearchAccessibilityOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Atmosphere", name: "atmosphere", options: getSearchAtmospheres().map(toOption), maxInitialOptions: 12 },
    { label: "Crowd", name: "crowd", options: getSearchCrowdOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Planning", name: "planning", options: getSearchPlanningOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Payment", name: "payment", options: getSearchPaymentOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Children", name: "children", options: getSearchChildrenOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Parking", name: "parking", options: getSearchParkingOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Pets", name: "pets", options: getSearchPetOptions().map(toOption), maxInitialOptions: 12 },
    ...(isDirectoryFeatureEnabled("transport")
      ? [
          { label: "Underground station", modalLabel: "Underground stations", name: "tube", options: getSearchTubeStations().map(toOption), maxInitialOptions: 12 },
          { label: "Bus stop", name: "bus", options: getSearchBusStops().map(toOption), maxInitialOptions: 12 },
          { label: "Nearby place", name: "nearby", options: getSearchNearbyPlaces().map(toOption), maxInitialOptions: 12 }
        ]
      : []),
    { label: "Price", name: "price", options: directoryConfig.priceLevels.map(toPriceOption) },
    { label: "Minimum rating", name: "rating", options: getSearchRatingFilterOptions() }
  ];

  return groups.map((group) => {
    const options = limitOptions(
      group.options,
      valueForName(values, group.name),
      group.maxInitialOptions ?? DEFAULT_MAX_INITIAL_OPTIONS
    );

    return {
      label: group.label,
      modalLabel: group.modalLabel,
      name: group.name,
      options,
      totalOptions: group.options.length
    };
  });
}

function limitOptions(options: FilterOption[], selected: string | string[] | undefined, limit: number) {
  const selectedValues = new Set(normalizeValues(selected));
  const selectedOptions = options.filter((option) => selectedValues.has(option.value));
  const visibleOptions = options.filter((option) => !selectedValues.has(option.value)).slice(0, Math.max(0, limit - selectedOptions.length));

  return [...selectedOptions, ...visibleOptions];
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
