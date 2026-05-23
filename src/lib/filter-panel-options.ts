import { directoryConfig } from "@/config/directory";
import {
  getAccessibilityOptions,
  getAmenities,
  getAreas,
  getAtmospheres,
  getBusStops,
  getCategories,
  getChildrenOptions,
  getCrowdOptions,
  getDietaryOptions,
  getDiningOptions,
  getHighlightOptions,
  getListingTypes,
  getNeighborhoods,
  getNearbyPlaces,
  getOfferings,
  getParkingOptions,
  getPaymentOptions,
  getPetOptions,
  getPlanningOptions,
  getPopularForOptions,
  getServiceOptions,
  getTubeStations,
  slugify
} from "@/lib/directory";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { getRatingFilterOptions } from "@/lib/directory-growth";
import type { ListingsPageLinkValues } from "@/lib/listings-page";

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
    { label: "Area", name: "area", options: getAreas().map(toOption), maxInitialOptions: 40 },
    { label: "Neighborhood", name: "neighborhood", options: getNeighborhoods().map(toOption) },
    { label: directoryConfig.categoryPluralLabel, name: "category", options: getCategories().map(toOption), maxInitialOptions: 24 },
    ...(isDirectoryFeatureEnabled("listingTypePages")
      ? [{ label: labels.type, modalLabel: labels.typeModal, name: "type", options: getListingTypes().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("dietaryPages")
      ? [{ label: labels.dietary, name: "dietary", options: getDietaryOptions().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("servicePages")
      ? [{ label: labels.service, name: "service", options: getServiceOptions().map(toOption) }]
      : []),
    ...(isDirectoryFeatureEnabled("offeringPages")
      ? [{ label: labels.offering, name: "offering", options: getOfferings().map(toOption) }]
      : []),
    { label: labels.highlight, name: "highlight", options: getHighlightOptions().map(toOption) },
    { label: labels.popularFor, name: "popularFor", options: getPopularForOptions().map(toOption) },
    { label: labels.dining, name: "dining", options: getDiningOptions().map(toOption) },
    { label: "Amenity", name: "amenity", options: getAmenities().map(toOption), maxInitialOptions: 12 },
    { label: "Accessibility", name: "accessibility", options: getAccessibilityOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Atmosphere", name: "atmosphere", options: getAtmospheres().map(toOption), maxInitialOptions: 12 },
    { label: "Crowd", name: "crowd", options: getCrowdOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Planning", name: "planning", options: getPlanningOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Payment", name: "payment", options: getPaymentOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Children", name: "children", options: getChildrenOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Parking", name: "parking", options: getParkingOptions().map(toOption), maxInitialOptions: 12 },
    { label: "Pets", name: "pets", options: getPetOptions().map(toOption), maxInitialOptions: 12 },
    ...(isDirectoryFeatureEnabled("transport")
      ? [
          { label: "Underground station", modalLabel: "Underground stations", name: "tube", options: getTubeStations().map(toOption), maxInitialOptions: 12 },
          { label: "Bus stop", name: "bus", options: getBusStops().map(toOption), maxInitialOptions: 12 },
          { label: "Nearby place", name: "nearby", options: getNearbyPlaces().map(toOption), maxInitialOptions: 12 }
        ]
      : []),
    { label: "Price", name: "price", options: directoryConfig.priceLevels.map((price) => ({ label: price, value: price })) },
    { label: "Minimum rating", name: "rating", options: getRatingFilterOptions() }
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
