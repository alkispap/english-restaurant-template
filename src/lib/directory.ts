import { directoryConfig } from "@/config/directory";
import { listings } from "@/data/listings";
import type { Listing } from "@/data/listings";
import { slugify } from "@/lib/slug";

export { slugify };

export type SortKey = "featured" | "rating" | "reviews" | "price";
export type FacetKey = "type" | "dietary" | "service" | "offering";

export type ListingFilters = {
  q?: string;
  area?: string | string[];
  neighborhood?: string | string[];
  category?: string | string[];
  type?: string | string[];
  dietary?: string | string[];
  service?: string | string[];
  offering?: string | string[];
  highlight?: string | string[];
  popularFor?: string | string[];
  dining?: string | string[];
  amenity?: string | string[];
  accessibility?: string | string[];
  atmosphere?: string | string[];
  crowd?: string | string[];
  planning?: string | string[];
  payment?: string | string[];
  children?: string | string[];
  parking?: string | string[];
  pets?: string | string[];
  tube?: string | string[];
  bus?: string | string[];
  nearby?: string | string[];
  price?: string | string[];
  rating?: number;
  sort?: SortKey;
};

export type CategoryCard = {
  label: string;
  slug: string;
  count: number;
  description: string;
};

export function getAreas() {
  return unique(listings.map((listing) => listing.area).filter(isString)).sort();
}

export function getNeighborhoods() {
  return unique(listings.map((listing) => listing.neighborhood).filter(isString)).sort();
}

export function getCategories() {
  return unique(listings.flatMap((listing) => listing.categories)).sort();
}

export function isCategoryTag(tag: string) {
  const tagSlug = slugify(tag);
  return getCategories().some((category) => slugify(category) === tagSlug);
}

export function getListingTypes() {
  return unique(listings.flatMap((listing) => listing.listingTypes)).sort();
}

export function getDietaryOptions() {
  return unique(listings.flatMap((listing) => listing.dietaryOptions)).sort();
}

export function getServiceOptions() {
  return unique(listings.flatMap(serviceOptionValues)).sort();
}

export function getOfferings() {
  return unique(listings.flatMap((listing) => listing.details?.offerings ?? [])).sort();
}

export function getHighlightOptions() {
  return unique(listings.flatMap((listing) => listing.details?.highlights ?? [])).sort();
}

export function getPopularForOptions() {
  return unique(listings.flatMap((listing) => listing.details?.popularFor ?? [])).sort();
}

export function getDiningOptions() {
  return detailValues("diningOptions");
}

export function getAmenities() {
  return detailValues("amenities");
}

export function getAccessibilityOptions() {
  return detailValues("accessibility");
}

export function getAtmospheres() {
  return detailValues("atmosphere");
}

export function getCrowdOptions() {
  return detailValues("crowd");
}

export function getPlanningOptions() {
  return detailValues("planning");
}

export function getPaymentOptions() {
  return detailValues("payments");
}

export function getChildrenOptions() {
  return detailValues("children");
}

export function getParkingOptions() {
  return detailValues("parking");
}

export function getPetOptions() {
  return detailValues("pets");
}

export function getTubeStations() {
  return unique(listings.map((listing) => listing.location?.tubeStation).filter(isString)).sort();
}

export function getBusStops() {
  return unique(listings.map((listing) => listing.location?.busStop).filter(isString)).sort();
}

export function getNearbyPlaces() {
  return unique(
    listings.flatMap((listing) => listing.location?.nearbyPlaces?.map((place) => place.name) ?? [])
  ).sort();
}

export function getListingBySlug(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}

export function getListingsByArea(areaSlug: string) {
  return listings.filter((listing) => listing.area && slugify(listing.area) === areaSlug);
}

export function getListingsByNeighborhood(neighborhoodSlug: string) {
  return listings.filter(
    (listing) => listing.neighborhood && slugify(listing.neighborhood) === neighborhoodSlug
  );
}

export function getListingsByCategory(categorySlug: string) {
  return listings.filter((listing) =>
    listing.categories.some((category) => slugify(category) === categorySlug)
  );
}

export function getFacetLabels(facet: FacetKey) {
  if (facet === "type") return getListingTypes();
  if (facet === "dietary") return getDietaryOptions();
  if (facet === "service") return getServiceOptions();
  return getOfferings();
}

export function getListingsByFacet(facet: FacetKey, valueSlug: string) {
  return listings.filter((listing) =>
    getFacetValues(listing, facet).some((value) => slugify(value) === valueSlug)
  );
}

export function getFacetTitle(facet: FacetKey) {
  if (facet === "type") return "Listing type";
  if (facet === "dietary") return "Dietary option";
  if (facet === "service") return "Service option";
  return "Offering";
}

export function filterListings(filters: ListingFilters) {
  const query = filters.q?.toLowerCase().trim();
  let result = listings.filter((listing) => {
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
      ...(listing.tags ?? [])
    ];
    const matchesQuery = !query || searchable.join(" ").toLowerCase().includes(query);
    const matchesArea = matchesMulti(listing.area ? [listing.area] : [], filters.area);
    const matchesNeighborhood = matchesMulti(
      listing.neighborhood ? [listing.neighborhood] : [],
      filters.neighborhood
    );

    const matchesCategory = matchesMulti(listing.categories, filters.category);
    const matchesType = matchesMulti(listing.listingTypes, filters.type);
    const matchesDietary = matchesMulti(listing.dietaryOptions, filters.dietary);
    const matchesService = matchesMulti(serviceOptionValues(listing), filters.service);
    const matchesOffering = matchesMulti(listing.details?.offerings ?? [], filters.offering);
    const matchesHighlight = matchesMulti(listing.details?.highlights ?? [], filters.highlight);
    const matchesPopularFor = matchesMulti(listing.details?.popularFor ?? [], filters.popularFor);

    const matchesDining = matchesDetailMulti(listing, "diningOptions", filters.dining);
    const matchesAmenity = matchesDetailMulti(listing, "amenities", filters.amenity);
    const matchesAccessibility = matchesDetailMulti(listing, "accessibility", filters.accessibility);
    const matchesAtmosphere = matchesDetailMulti(listing, "atmosphere", filters.atmosphere);
    const matchesCrowd = matchesDetailMulti(listing, "crowd", filters.crowd);
    const matchesPlanning = matchesDetailMulti(listing, "planning", filters.planning);
    const matchesPayment = matchesDetailMulti(listing, "payments", filters.payment);
    const matchesChildren = matchesDetailMulti(listing, "children", filters.children);
    const matchesParking = matchesDetailMulti(listing, "parking", filters.parking);
    const matchesPets = matchesDetailMulti(listing, "pets", filters.pets);
    const matchesTube = matchesMulti(
      listing.location?.tubeStation ? [listing.location.tubeStation] : [],
      filters.tube
    );
    const matchesBus = matchesMulti(
      listing.location?.busStop ? [listing.location.busStop] : [],
      filters.bus
    );
    const matchesNearby = matchesMulti(
      listing.location?.nearbyPlaces?.map((place) => place.name) ?? [],
      filters.nearby
    );

    const matchesPrice = matchesMulti(listing.priceLevel ? [listing.priceLevel] : [], filters.price);
    const matchesRating = !filters.rating || Number(listing.rating ?? 0) >= filters.rating;

    return (
      matchesQuery &&
      matchesArea &&
      matchesNeighborhood &&
      matchesCategory &&
      matchesType &&
      matchesDietary &&
      matchesService &&
      matchesOffering &&
      matchesHighlight &&
      matchesPopularFor &&
      matchesDining &&
      matchesAmenity &&
      matchesAccessibility &&
      matchesAtmosphere &&
      matchesCrowd &&
      matchesPlanning &&
      matchesPayment &&
      matchesChildren &&
      matchesParking &&
      matchesPets &&
      matchesTube &&
      matchesBus &&
      matchesNearby &&
      matchesPrice &&
      matchesRating
    );
  });

  const sort = filters.sort ?? directoryConfig.defaultSort;
  result = [...result].sort((a, b) => {
    if (sort === "rating") return Number(b.rating ?? 0) - Number(a.rating ?? 0);
    if (sort === "reviews") return Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0);
    if (sort === "price") return priceWeight(a.priceLevel) - priceWeight(b.priceLevel);
    return (
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
      Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    );
  });

  return result;
}

export function getFeaturedListings(limit = 4) {
  const featured = listings
    .filter((listing) => listing.featured)
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, limit);

  return featured.length ? featured : getBestRatedListings(limit);
}

export function getBestRatedListings(limit = 4) {
  return [...listings]
    .sort(
      (a, b) =>
        Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    )
    .slice(0, limit);
}

export function getMostReviewedListings(limit = 4) {
  return [...listings]
    .sort(
      (a, b) =>
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0) ||
        Number(b.rating ?? 0) - Number(a.rating ?? 0)
    )
    .slice(0, limit);
}

export function getLowestPricedListings(limit = 4) {
  return listings
    .filter((listing) => listing.priceLevel)
    .sort(
      (a, b) =>
        priceWeight(a.priceLevel) - priceWeight(b.priceLevel) ||
        Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
    )
    .slice(0, limit);
}

export function getRecentlyAddedListings(limit = 4) {
  // Newest entries are appended at the end of the listings array during import
  return listings.slice(-limit).reverse();
}

export function getRelatedListings(current: Listing, limit = 3) {
  return listings
    .filter((listing) => listing.slug !== current.slug)
    .filter(
      (listing) =>
        listing.area === current.area ||
        listing.neighborhood === current.neighborhood ||
        listing.categories.some((category) => current.categories.includes(category)) ||
        listing.listingTypes.some((type) => current.listingTypes.includes(type))
    )
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, limit);
}

export function getFeaturedCategoryCards(limit = 5): CategoryCard[] {
  return countLabels(listings.flatMap((listing) => listing.categories))
    .filter((category) => category.label.toLowerCase() !== directoryConfig.primaryCategory.toLowerCase())
    .slice(0, limit)
    .map((category) => ({
      ...category,
      description: `${category.count} listings with ${category.label.toLowerCase()} categories or features.`
    }));
}

export function getFeaturedAreas(limit: number = directoryConfig.featuredAreasLimit): CategoryCard[] {
  return countLabels(listings.map((listing) => listing.area).filter(Boolean) as string[])
    .slice(0, limit)
    .map((area) => ({
      ...area,
      description: `${area.count} listings listed in ${area.label}.`
    }));
}

function getFacetValues(listing: Listing, facet: FacetKey) {
  if (facet === "type") return listing.listingTypes;
  if (facet === "dietary") return listing.dietaryOptions;
  if (facet === "service") return serviceOptionValues(listing);
  return listing.details?.offerings ?? [];
}

function serviceOptionValues(listing: Listing) {
  return listing.details?.serviceOptions ?? [];
}

function searchableFeatureValues(listing: Listing) {
  return [
    ...serviceOptionValues(listing),
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

function detailValues(key: DetailListKey) {
  return unique(listings.flatMap((listing) => listing.details?.[key] ?? [])).sort();
}

function matchesDetailMulti(listing: Listing, key: DetailListKey, filter?: string | string[]) {
  return matchesMulti(listing.details?.[key] ?? [], filter);
}

function matchesMulti(values: string[], filter?: string | string[]) {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) return true;
  const filterArray = Array.isArray(filter) ? filter : [filter];
  return values.some((value) => filterArray.includes(slugify(value)));
}

function countLabels(labels: string[]) {
  const counts = new Map<string, { label: string; count: number }>();
  labels.filter(Boolean).forEach((label) => {
    const slug = slugify(label);
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(slug, { label: label.trim(), count: 1 });
    }
  });
  return Array.from(counts.values(), ({ label, count }) => ({ label, slug: slugify(label), count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
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
    if (!item) continue;
    const slug = slugify(item);
    if (!seen.has(slug)) {
      seen.add(slug);
      result.push(item.trim());
    }
  }
  return result;
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}

