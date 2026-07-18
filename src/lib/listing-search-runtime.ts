import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import type { ListingSearchRecord } from "@/data/listing-search-records";
import { directoryIndexHeadings } from "@/lib/directory-index-headings";
import { homepageHeadings } from "@/lib/homepage-headings";
import { getReviewStrengthScore } from "@/lib/review-strength";
import { createRawSearchTextMatcher } from "@/lib/search-quality";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  dietaryPath,
  directorySearchPath,
  listingDetailPath,
  servicePath,
  typePath
} from "@/lib/routes";
import { slugify } from "@/lib/slug";
import type { DirectoryListingRowSummary, ListingResultSummary, ListingsPageLinkValues, MapPoint } from "@/lib/listings-page";

export type ListingSearchFilters = Omit<ListingsPageLinkValues, "basePath" | "open" | "view" | "page" | "rating"> & {
  rating?: number;
};

export const listingFacetNames = [
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
] as const;

export type ListingFacetName = (typeof listingFacetNames)[number];

export type ListingFacetAvailability = ReadonlyMap<ListingFacetName, ReadonlySet<string>>;

export type ListingSearchState = {
  records: ListingSearchRecord[];
  availableValuesByGroup?: ListingFacetAvailability;
};

export type SearchShortcutLink = {
  label: string;
  href: string;
  description?: string;
  count?: number;
};

export type SearchShortcutGroup = {
  id?: string;
  title: string;
  copy?: string;
  links: SearchShortcutLink[];
};

let listingSearchRecords: ListingSearchRecord[] = [];

export function initializeListingSearchRuntime(records: ListingSearchRecord[]) {
  if (listingSearchRecords === records) return;
  listingSearchRecords = records;
  cachedSearchFacetValues = null;
  cachedSearchRatings = null;
  normalizedFacetValueSlugs.clear();
}

export function filterListingSearchRecords(filters: ListingSearchFilters) {
  return buildListingSearchState(filters, { includeFacetAvailability: false }).records;
}

export function buildListingSearchState(
  filters: ListingSearchFilters,
  { includeFacetAvailability = true }: { includeFacetAvailability?: boolean } = {}
): ListingSearchState {
  const queryMatches = createRawSearchTextMatcher(filters.q?.toLowerCase().trim());
  const activeFacets = getActiveFacetFilters(filters);
  const shouldBuildAvailability = includeFacetAvailability && (Boolean(filters.q) || activeFacets.length > 0);
  const rawAvailableValuesByGroup = shouldBuildAvailability
    ? new Map<ListingFacetName, Set<string>>(listingFacetNames.map((name) => [name, new Set<string>()]))
    : undefined;
  const ratingRange = shouldBuildAvailability ? { minimum: Number.POSITIVE_INFINITY, maximum: Number.NEGATIVE_INFINITY } : undefined;
  let result: ListingSearchRecord[] = [];

  for (const listing of listingSearchRecords) {
    if (filters.q && !queryMatches(listingSearchText(listing))) continue;

    const failedGroups: ListingFacetName[] = [];
    for (const [name, selectedValues] of activeFacets) {
      if (!listingMatchesFacet(listing, name, selectedValues, filters.rating)) {
        failedGroups.push(name);
        if (!rawAvailableValuesByGroup && failedGroups.length) break;
      }
    }

    if (!failedGroups.length) result.push(listing);
    if (!rawAvailableValuesByGroup) continue;

    for (const name of listingFacetNames) {
      if (failedGroups.length > 1 || (failedGroups.length === 1 && failedGroups[0] !== name)) continue;
      if (name === "rating") {
        const rating = listing.rating;
        if (typeof rating === "number" && Number.isFinite(rating) && ratingRange) {
          ratingRange.minimum = Math.min(ratingRange.minimum, rating);
          ratingRange.maximum = Math.max(ratingRange.maximum, rating);
        }
        continue;
      }
      listingFacetValues(listing, name).forEach((value) => rawAvailableValuesByGroup.get(name)?.add(value));
    }
  }

  if (rawAvailableValuesByGroup && ratingRange && Number.isFinite(ratingRange.minimum) && Number.isFinite(ratingRange.maximum)) {
    const maximum = Math.min(5, Math.ceil(ratingRange.maximum));
    const minimum = Math.max(1, Math.floor(ratingRange.minimum));
    for (let rating = maximum; rating >= minimum; rating -= 1) {
      rawAvailableValuesByGroup.get("rating")?.add(String(rating));
    }
  }

  const sort = filters.sort ?? directoryConfig.defaultSort;
  result = [...result].sort((a, b) => {
    if (sort === "rating") return compareSearchRecordsByReviewStrength(a, b);
    if (sort === "reviews") return Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0);
    if (sort === "price") return priceWeight(a.priceLevel) - priceWeight(b.priceLevel);
    return (
      Number(b.featured) - Number(a.featured) ||
      Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
      Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    );
  });

  return {
    records: result,
    availableValuesByGroup: rawAvailableValuesByGroup
      ? normalizedFacetAvailability(rawAvailableValuesByGroup)
      : undefined
  };
}
const lowercaseListingSearchText = new WeakMap<ListingSearchRecord, string>();
const normalizedFacetValueSlugs = new Map<string, string>();
let cachedSearchFacetValues: Map<ListingFacetName, string[]> | null = null;
let cachedSearchRatings: number[] | null = null;

function listingSearchText(listing: ListingSearchRecord) {
  const cached = lowercaseListingSearchText.get(listing);
  if (cached !== undefined) return cached;

  let searchText = `${listing.name} ${listing.description ?? ""} ${listing.area} ${listing.neighborhood ?? ""} ${listing.borough ?? ""} ${listing.address} ${listing.postcode ?? ""}`;
  searchText += ` ${listing.categories.join(" ")} ${listing.listingTypes.join(" ")} ${listing.dietaryOptions.join(" ")}`;
  searchText += ` ${searchableFeatureValues(listing).join(" ")} ${(listing.details?.offerings ?? []).join(" ")} ${listing.tags.join(" ")}`;
  const lowercase = searchText.toLowerCase();
  lowercaseListingSearchText.set(listing, lowercase);
  return lowercase;
}

function normalizedFacetValue(value: string) {
  const cached = normalizedFacetValueSlugs.get(value);
  if (cached !== undefined) return cached;
  const normalized = slugify(value);
  normalizedFacetValueSlugs.set(value, normalized);
  return normalized;
}

function getActiveFacetFilters(filters: ListingSearchFilters) {
  const active: Array<readonly [ListingFacetName, ReadonlySet<string>]> = [];

  for (const name of listingFacetNames) {
    if (name === "rating") {
      if (filters.rating) active.push([name, new Set([String(filters.rating)])]);
      continue;
    }

    const selectedValues = normalizedFilterValues(filters[name as keyof ListingSearchFilters]);
    if (selectedValues.length) active.push([name, new Set(selectedValues)]);
  }

  return active;
}

function normalizedFilterValues(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item));
  return typeof value === "string" && value ? [value] : [];
}

function listingMatchesFacet(
  listing: ListingSearchRecord,
  name: ListingFacetName,
  selectedValues: ReadonlySet<string>,
  minimumRating?: number
) {
  if (name === "rating") return !minimumRating || Number(listing.rating ?? 0) >= minimumRating;
  if (name === "price") return listingFacetValues(listing, name).some((value) => selectedValues.has(value));
  return listingFacetValues(listing, name).some((value) => selectedValues.has(normalizedFacetValue(value)));
}

function listingFacetValues(listing: ListingSearchRecord, name: ListingFacetName): string[] {
  const values = (() => {
    switch (name) {
      case "area":
        return listing.area ? [listing.area] : [];
      case "neighborhood":
        return listing.neighborhood ? [listing.neighborhood] : [];
      case "category":
        return listing.categories;
      case "type":
        return listing.listingTypes;
      case "dietary":
        return listing.dietaryOptions;
      case "service":
        return listing.details?.serviceOptions ?? [];
      case "offering":
        return listing.details?.offerings ?? [];
      case "highlight":
        return listing.details?.highlights ?? [];
      case "popularFor":
        return listing.details?.popularFor ?? [];
      case "dining":
        return listing.details?.diningOptions ?? [];
      case "amenity":
        return listing.details?.amenities ?? [];
      case "accessibility":
        return listing.details?.accessibility ?? [];
      case "atmosphere":
        return listing.details?.atmosphere ?? [];
      case "crowd":
        return listing.details?.crowd ?? [];
      case "planning":
        return listing.details?.planning ?? [];
      case "payment":
        return listing.details?.payments ?? [];
      case "children":
        return listing.details?.children ?? [];
      case "parking":
        return listing.details?.parking ?? [];
      case "pets":
        return listing.details?.pets ?? [];
      case "tube":
        return listing.location?.tubeStation ? [listing.location.tubeStation] : [];
      case "bus":
        return listing.location?.busStop ? [listing.location.busStop] : [];
      case "nearby":
        return listing.location?.nearbyPlaces ?? [];
      case "price":
        return listing.priceLevel ? [listing.priceLevel, `price-${listing.priceLevel.length}`] : [];
      case "rating":
        return [];
    }
  })();

  return values;
}

function normalizedFacetAvailability(rawValuesByGroup: Map<ListingFacetName, Set<string>>): ListingFacetAvailability {
  return new Map(
    listingFacetNames.map((name) => {
      const values = rawValuesByGroup.get(name) ?? new Set<string>();
      if (name === "price" || name === "rating") return [name, values] as const;
      return [name, new Set([...values].map(normalizedFacetValue).filter(Boolean))] as const;
    })
  );
}

export function getDirectorySearchRows(currentListings: ListingSearchRecord[], limit = 6): DirectoryListingRowSummary[] {
  const currentSlugs = new Set(currentListings.map((listing) => listing.slug));
  const rows = [
    {
      id: "local-eats",
      title: homepageHeadings.listingRowTitles.highlyReviewed,
      copy: homepageHeadings.listingRowCopy.highlyReviewed,
      listings: getLocalEatsListings(Math.max(limit * 2, 12)),
      seeAllHref: directorySearchPath("?sort=reviews")
    },
    {
      id: "budget-friendly",
      title: homepageHeadings.listingRowTitles.budgetFriendly,
      copy: homepageHeadings.listingRowCopy.budgetFriendly,
      listings: getBudgetFriendlyListings(Math.max(limit * 2, 12)),
      seeAllHref: directorySearchPath("?sort=price")
    }
  ];

  return rows
    .map((row) => {
      const withoutCurrent = row.listings.filter((listing) => !currentSlugs.has(listing.slug));
      return {
        ...row,
        listings: (withoutCurrent.length ? withoutCurrent : row.listings).slice(0, limit).map(toListingResultSummary)
      };
    })
    .filter((row) => row.listings.length);
}

function toListingResultSummary(listing: ListingSearchRecord): ListingResultSummary {
  return {
    slug: listing.slug,
    name: listing.name,
    description: listing.description,
    images: listing.images.slice(0, 3),
    imageFallbackLabel: listing.imageFallbackLabel,
    area: listing.area,
    neighborhood: listing.neighborhood,
    categories: listing.categories.slice(0, 3),
    dietaryOptions: listing.dietaryOptions.slice(0, 3),
    priceLevel: listing.priceLevel,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    fullAddress: listing.fullAddress,
    address: listing.address,
    contact: {
      website: listing.contact?.website,
      googleReviewsUrl: listing.contact?.googleReviewsUrl
    },
    location: {
      googleMapsUrl: listing.location?.googleMapsUrl,
      latitude: listing.location?.latitude,
      longitude: listing.location?.longitude
    },
    details: {
      workingHours: listing.details?.workingHours,
      serviceOptions: listing.details?.serviceOptions?.slice(0, 4),
      highlights: listing.details?.highlights?.slice(0, 3),
      diningOptions: listing.details?.diningOptions?.slice(0, 3),
      googleVerified: listing.details?.googleVerified
    }
  };
}

export function getSearchAreas() {
  return getCachedSearchFacetValues("area");
}

export function getSearchNeighborhoods() {
  return getCachedSearchFacetValues("neighborhood");
}

export function getSearchCategories() {
  return getCachedSearchFacetValues("category");
}

export function getSearchListingTypes() {
  return getCachedSearchFacetValues("type");
}

export function getSearchDietaryOptions() {
  return getCachedSearchFacetValues("dietary");
}

export function getSearchServiceOptions() {
  return getCachedSearchFacetValues("service");
}

export function getSearchOfferings() {
  return getCachedSearchFacetValues("offering");
}

export function getSearchHighlightOptions() {
  return getCachedSearchFacetValues("highlight");
}

export function getSearchPopularForOptions() {
  return getCachedSearchFacetValues("popularFor");
}

export function getSearchDiningOptions() {
  return getCachedSearchFacetValues("dining");
}

export function getSearchAmenities() {
  return getCachedSearchFacetValues("amenity");
}

export function getSearchAccessibilityOptions() {
  return getCachedSearchFacetValues("accessibility");
}

export function getSearchAtmospheres() {
  return getCachedSearchFacetValues("atmosphere");
}

export function getSearchCrowdOptions() {
  return getCachedSearchFacetValues("crowd");
}

export function getSearchPlanningOptions() {
  return getCachedSearchFacetValues("planning");
}

export function getSearchPaymentOptions() {
  return getCachedSearchFacetValues("payment");
}

export function getSearchChildrenOptions() {
  return getCachedSearchFacetValues("children");
}

export function getSearchParkingOptions() {
  return getCachedSearchFacetValues("parking");
}

export function getSearchPetOptions() {
  return getCachedSearchFacetValues("pets");
}

export function getSearchTubeStations() {
  return getCachedSearchFacetValues("tube");
}

export function getSearchBusStops() {
  return getCachedSearchFacetValues("bus");
}

export function getSearchNearbyPlaces() {
  return getCachedSearchFacetValues("nearby");
}

export function getSearchRatingFilterOptions() {
  ensureSearchFacetCatalog();
  const ratings = cachedSearchRatings ?? [];
  if (!ratings.length) return [];

  const maxRating = Math.min(5, Math.ceil(Math.max(...ratings)));
  const minRating = Math.max(1, Math.floor(Math.min(...ratings)));

  return Array.from({ length: maxRating - minRating + 1 }, (_, index) => {
    const rating = maxRating - index;
    return { label: `${rating}+`, value: String(rating) };
  });
}

export function getSearchAreaMapPoints(): MapPoint[] {
  const areas = new Map<string, { area: string; latitudeSum: number; longitudeSum: number; count: number }>();

  listingSearchRecords.forEach((listing) => {
    const area = listing.area;
    const latitude = listing.location?.latitude;
    const longitude = listing.location?.longitude;
    if (!area || !latitude || !longitude) return;

    const key = slugify(area);
    const existing = areas.get(key);
    if (existing) {
      existing.latitudeSum += latitude;
      existing.longitudeSum += longitude;
      existing.count += 1;
      return;
    }

    areas.set(key, {
      area,
      latitudeSum: latitude,
      longitudeSum: longitude,
      count: 1
    });
  });

  return Array.from(areas.entries(), ([slug, area]) => ({
    slug,
    name: area.area,
    area: area.area,
    categories: [],
    latitude: area.latitudeSum / area.count,
    longitude: area.longitudeSum / area.count
  }));
}

export function getClientHomepageSourceContextGuide() {
  const categoryLabelLower = directoryConfig.categoryLabel.toLowerCase();

  return {
    title: homepageHeadings.sourceContextTitle,
    intro: `This directory uses the current dataset for ${siteConfig.niche.toLowerCase()}, so visitors can compare practical signals before choosing where to eat.`,
    points: [
      {
        title: homepageHeadings.sourceContextQuestionTitles.data,
        copy: `Listings are grouped by area, neighbourhood, ${categoryLabelLower}, service options, dining style, transport details, and contact actions where those fields are available.`
      },
      {
        title: homepageHeadings.sourceContextQuestionTitles.freshness,
        copy: "The template keeps imported details usable for visitors and supports updated freshness audits for opening hours, status, images, ratings, review counts, service options, and contact details."
      },
      {
        title: homepageHeadings.sourceContextQuestionTitles.choose,
        copy: "Compare ratings, review counts, prices, location signals, and available services, then open the listing page for contact links, maps, menus, and booking or ordering actions."
      }
    ]
  };
}

export function getClientSidebarBlocks(context: "default" | "homepage" | "seoLanding" = "default"): SearchShortcutGroup[] {
  const isDirectoryIndex = context === "default";
  const blocks: SearchShortcutGroup[] = [
    {
      id: "popular-searches",
      title: isDirectoryIndex ? directoryIndexHeadings.sidebarTitles.popularSearches : homepageHeadings.sidebarTitles.popularSearches,
      links: [
        { label: "Best rated", href: directorySearchPath("?sort=rating") },
        { label: "Most reviewed", href: directorySearchPath("?sort=reviews") },
        { label: "Open now", href: directorySearchPath("?open=1") },
        { label: "Lowest price", href: directorySearchPath("?sort=price") }
      ]
    },
    {
      id: "recent-listings",
      title: isDirectoryIndex ? directoryIndexHeadings.sidebarTitles.recentListings : homepageHeadings.sidebarTitles.recentListings,
      links: recentListingLinks(6)
    },
    {
      id: "useful-shortcuts",
      title: isDirectoryIndex ? directoryIndexHeadings.sidebarTitles.usefulShortcuts : homepageHeadings.sidebarTitles.usefulShortcuts,
      links: usefulShortcutLinks(6)
    },
    {
      id: "top-areas",
      title: isDirectoryIndex ? directoryIndexHeadings.sidebarTitles.topAreas : "Top areas",
      links: topAreaLinks(6)
    },
    {
      id: "top-categories",
      title: isDirectoryIndex ? directoryIndexHeadings.sidebarTitles.categoryHubs : `${directoryConfig.categoryLabel} hubs`,
      links: topCategoryLinks(6)
    }
  ];

  if (context === "homepage") {
    return blocks.filter(
      (block) => block.id === "popular-searches" || block.id === "recent-listings" || block.id === "useful-shortcuts"
    );
  }

  return blocks.filter((block) => block.links.length);
}

export function getClientHomepageSeoFeatureGroups(): SearchShortcutGroup[] {
  const groups: SearchShortcutGroup[] = [
    {
      title: homepageHeadings.seoFeatureGroupTitles.area,
      copy: homepageHeadings.seoFeatureGroupCopy.area,
      links: topAreaLinks(6)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.category,
      copy: homepageHeadings.seoFeatureGroupCopy.category,
      links: topCategoryLinks(6)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.areaCategory,
      copy: homepageHeadings.seoFeatureGroupCopy.areaCategory,
      links: topAreaCategoryLinks(6)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.service,
      copy: homepageHeadings.seoFeatureGroupCopy.service,
      links: serviceLinks()
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.dietary,
      copy: homepageHeadings.seoFeatureGroupCopy.dietary,
      links: dietaryLinks()
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.diningStyle,
      copy: homepageHeadings.seoFeatureGroupCopy.diningStyle,
      links: typeLinks()
    }
  ];

  return groups.filter((group) => group.links.length);
}

function getLocalEatsListings(limit: number) {
  return [...listingSearchRecords]
    .filter((listing) => Number(listing.rating ?? 0) >= 4)
    .sort(
      (a, b) =>
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0) ||
        Number(b.rating ?? 0) - Number(a.rating ?? 0)
    )
    .slice(0, limit);
}

function getBudgetFriendlyListings(limit: number) {
  return [...listingSearchRecords]
    .filter((listing) => listing.priceLevel)
    .sort(
      (a, b) =>
        priceWeight(a.priceLevel) - priceWeight(b.priceLevel) ||
        Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    )
    .slice(0, limit);
}

function topAreaLinks(limit: number): SearchShortcutLink[] {
  return countLabels(listingSearchRecords.map((listing) => listing.area).filter(isString))
    .slice(0, limit)
    .map((area) => ({
      label: area.label,
      href: areaPath(area.slug),
      count: area.count
    }));
}

function recentListingLinks(limit: number): SearchShortcutLink[] {
  return listingSearchRecords.slice(0, limit).map((listing) => ({
    label: listing.name,
    href: listingDetailPath(listing.slug),
    description: [listing.neighborhood, listing.area].filter(Boolean).join(", ") || undefined
  }));
}

function usefulShortcutLinks(limit: number): SearchShortcutLink[] {
  return [
    { label: "Open now", href: directorySearchPath("?open=1") },
    { label: "Best rated", href: directorySearchPath("?sort=rating") },
    { label: "Most reviewed", href: directorySearchPath("?sort=reviews") },
    { label: "Lowest price", href: directorySearchPath("?sort=price") }
  ].slice(0, limit);
}

function topCategoryLinks(limit: number): SearchShortcutLink[] {
  return countLabels(listingSearchRecords.flatMap((listing) => listing.categories))
    .filter((category) => category.label.toLowerCase() !== directoryConfig.primaryCategory.toLowerCase())
    .slice(0, limit)
    .map((category) => ({
      label: category.label,
      href: categoryPath(category.slug),
      count: category.count
    }));
}

function topAreaCategoryLinks(limit: number): SearchShortcutLink[] {
  const counts = new Map<string, { areaLabel: string; areaSlug: string; categoryLabel: string; categorySlug: string; count: number }>();

  listingSearchRecords.forEach((listing) => {
    if (!listing.area) return;
    listing.categories.forEach((category) => {
      const areaSlug = slugify(listing.area as string);
      const categorySlug = slugify(category);
      const key = `${areaSlug}:${categorySlug}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      counts.set(key, {
        areaLabel: listing.area as string,
        areaSlug,
        categoryLabel: category,
        categorySlug,
        count: 1
      });
    });
  });

  return Array.from(counts.values())
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.count - a.count || a.areaLabel.localeCompare(b.areaLabel))
    .slice(0, limit)
    .map((item) => ({
      label: `${item.categoryLabel} in ${item.areaLabel}`,
      href: areaCategoryPath(item.areaSlug, item.categorySlug),
      count: item.count
    }));
}

function serviceLinks(): SearchShortcutLink[] {
  const available = new Set(getSearchServiceOptions().map(slugify));
  return [
    { slug: "takeaway", label: "Takeaway restaurants" },
    { slug: "delivery", label: "Delivery restaurants" },
    { slug: "dine-in", label: "Dine-in restaurants" },
    { slug: "outdoor-seating", label: "Outdoor seating" }
  ]
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: servicePath(item.slug),
      count: filterListingSearchRecords({ service: item.slug }).length
    }));
}

function dietaryLinks(): SearchShortcutLink[] {
  const available = new Set(getSearchDietaryOptions().map(slugify));
  return [
    { slug: "vegetarian", label: "Vegetarian restaurants" },
    { slug: "vegan", label: "Vegan restaurants" },
    { slug: "halal", label: "Halal restaurants" },
    { slug: "gluten-free", label: "Gluten-free options" }
  ]
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: dietaryPath(item.slug),
      count: filterListingSearchRecords({ dietary: item.slug }).length
    }));
}

function typeLinks(): SearchShortcutLink[] {
  const available = new Set(getSearchListingTypes().map(slugify));
  return [
    { slug: "casual-dining", label: "Casual dining" },
    { slug: "fine-dining", label: "Fine dining" },
    { slug: "cafe", label: "Cafe-style restaurants" },
    { slug: "bar", label: "Bar restaurants" }
  ]
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: typePath(item.slug),
      count: filterListingSearchRecords({ type: item.slug }).length
    }));
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

function getCachedSearchFacetValues(name: ListingFacetName) {
  ensureSearchFacetCatalog();
  return cachedSearchFacetValues?.get(name) ?? [];
}

function ensureSearchFacetCatalog() {
  if (cachedSearchFacetValues && cachedSearchRatings) return;

  const valuesByName = new Map<ListingFacetName, Set<string>>(
    listingFacetNames.map((name) => [name, new Set<string>()])
  );
  const ratings: number[] = [];

  for (const listing of listingSearchRecords) {
    for (const name of listingFacetNames) {
      if (name === "rating") continue;
      listingFacetValues(listing, name).forEach((value) => valuesByName.get(name)?.add(value));
    }
    if (typeof listing.rating === "number" && Number.isFinite(listing.rating)) ratings.push(listing.rating);
  }

  cachedSearchFacetValues = new Map(
    listingFacetNames.map((name) => [name, unique([...(valuesByName.get(name) ?? [])]).sort()])
  );
  cachedSearchRatings = ratings;
}

function compareSearchRecordsByReviewStrength(a: ListingSearchRecord, b: ListingSearchRecord) {
  return (
    getReviewStrengthScore(b) - getReviewStrengthScore(a) ||
    Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
    Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
  );
}

function priceWeight(price?: string) {
  if (price === "\u00a3") return 1;
  if (price === "\u00a3\u00a3") return 2;
  if (price === "\u00a3\u00a3\u00a3") return 3;
  return 9;
}

function unique(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!isValidFacetValue(item)) continue;
    const trimmed = item.trim();
    const slug = slugify(trimmed);
    if (!seen.has(slug)) {
      seen.add(slug);
      result.push(trimmed);
    }
  }
  return result;
}

const invalidFacetValues = new Set(["#error!", "#value!", "#n/a", "nan", "null", "undefined"]);

function countLabels(labels: string[]) {
  const counts = new Map<string, { label: string; slug: string; count: number }>();
  labels.filter(Boolean).forEach((label) => {
    const slug = slugify(label);
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(slug, { label: label.trim(), slug, count: 1 });
    }
  });

  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}

function isValidFacetValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return !invalidFacetValues.has(normalized);
}
