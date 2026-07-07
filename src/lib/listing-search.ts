import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { listingSearchRecords, type ListingSearchRecord } from "@/data/listing-search-records";
import { directoryIndexHeadings } from "@/lib/directory-index-headings";
import { homepageHeadings } from "@/lib/homepage-headings";
import { getReviewStrengthScore } from "@/lib/review-strength";
import { searchableTextMatches } from "@/lib/search-quality";
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
import type { DirectoryListingRowSummary, ListingsPageLinkValues, MapPoint } from "@/lib/listings-page";

export type ListingSearchFilters = Omit<ListingsPageLinkValues, "basePath" | "open" | "view" | "page" | "rating"> & {
  rating?: number;
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

type DetailListKey =
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

export function filterListingSearchRecords(filters: ListingSearchFilters) {
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
      matchesDetailMulti(listing, "diningOptions", filters.dining) &&
      matchesDetailMulti(listing, "amenities", filters.amenity) &&
      matchesDetailMulti(listing, "accessibility", filters.accessibility) &&
      matchesDetailMulti(listing, "atmosphere", filters.atmosphere) &&
      matchesDetailMulti(listing, "crowd", filters.crowd) &&
      matchesDetailMulti(listing, "planning", filters.planning) &&
      matchesDetailMulti(listing, "payments", filters.payment) &&
      matchesDetailMulti(listing, "children", filters.children) &&
      matchesDetailMulti(listing, "parking", filters.parking) &&
      matchesDetailMulti(listing, "pets", filters.pets) &&
      matchesMulti(listing.location?.tubeStation ? [listing.location.tubeStation] : [], filters.tube) &&
      matchesMulti(listing.location?.busStop ? [listing.location.busStop] : [], filters.bus) &&
      matchesMulti(listing.location?.nearbyPlaces ?? [], filters.nearby) &&
      matchesPrice(listing.priceLevel, filters.price) &&
      (!filters.rating || Number(listing.rating ?? 0) >= filters.rating)
    );
  });

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

  return result;
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
        listings: (withoutCurrent.length ? withoutCurrent : row.listings).slice(0, limit)
      };
    })
    .filter((row) => row.listings.length);
}

export function getSearchAreas() {
  return unique(listingSearchRecords.map((listing) => listing.area).filter(isString)).sort();
}

export function getSearchNeighborhoods() {
  return unique(listingSearchRecords.map((listing) => listing.neighborhood).filter(isString)).sort();
}

export function getSearchCategories() {
  return unique(listingSearchRecords.flatMap((listing) => listing.categories)).sort();
}

export function getSearchListingTypes() {
  return unique(listingSearchRecords.flatMap((listing) => listing.listingTypes)).sort();
}

export function getSearchDietaryOptions() {
  return unique(listingSearchRecords.flatMap((listing) => listing.dietaryOptions)).sort();
}

export function getSearchServiceOptions() {
  return unique(listingSearchRecords.flatMap((listing) => listing.details?.serviceOptions ?? [])).sort();
}

export function getSearchOfferings() {
  return unique(listingSearchRecords.flatMap((listing) => listing.details?.offerings ?? [])).sort();
}

export function getSearchHighlightOptions() {
  return unique(listingSearchRecords.flatMap((listing) => listing.details?.highlights ?? [])).sort();
}

export function getSearchPopularForOptions() {
  return unique(listingSearchRecords.flatMap((listing) => listing.details?.popularFor ?? [])).sort();
}

export function getSearchDiningOptions() {
  return detailValues("diningOptions");
}

export function getSearchAmenities() {
  return detailValues("amenities");
}

export function getSearchAccessibilityOptions() {
  return detailValues("accessibility");
}

export function getSearchAtmospheres() {
  return detailValues("atmosphere");
}

export function getSearchCrowdOptions() {
  return detailValues("crowd");
}

export function getSearchPlanningOptions() {
  return detailValues("planning");
}

export function getSearchPaymentOptions() {
  return detailValues("payments");
}

export function getSearchChildrenOptions() {
  return detailValues("children");
}

export function getSearchParkingOptions() {
  return detailValues("parking");
}

export function getSearchPetOptions() {
  return detailValues("pets");
}

export function getSearchTubeStations() {
  return unique(listingSearchRecords.map((listing) => listing.location?.tubeStation).filter(isString)).sort();
}

export function getSearchBusStops() {
  return unique(listingSearchRecords.map((listing) => listing.location?.busStop).filter(isString)).sort();
}

export function getSearchNearbyPlaces() {
  return unique(listingSearchRecords.flatMap((listing) => listing.location?.nearbyPlaces ?? [])).sort();
}

export function getSearchRatingFilterOptions() {
  const ratings = listingSearchRecords
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

function detailValues(key: DetailListKey) {
  return unique(listingSearchRecords.flatMap((listing) => listing.details?.[key] ?? [])).sort();
}

function matchesDetailMulti(listing: ListingSearchRecord, key: DetailListKey, filter?: string | string[]) {
  return matchesMulti(listing.details?.[key] ?? [], filter);
}

function matchesPrice(priceLevel?: string, filter?: string | string[]) {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) return true;
  if (!priceLevel) return false;

  const acceptedValues = new Set([priceLevel, `price-${priceLevel.length}`]);
  const filterArray = Array.isArray(filter) ? filter : [filter];
  return filterArray.some((value) => acceptedValues.has(value));
}

function matchesMulti(values: string[], filter?: string | string[]) {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) return true;
  const filterArray = Array.isArray(filter) ? filter : [filter];
  return values.some((value) => filterArray.includes(slugify(value)));
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
