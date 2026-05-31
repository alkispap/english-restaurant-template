import type { Metadata } from "next";
import type { Listing } from "@/data/listings";
import type { FacetKey } from "@/lib/directory";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  dietaryPath,
  neighborhoodPath,
  offeringPath,
  servicePath,
  typePath
} from "@/lib/routes";
import { slugify } from "@/lib/slug";

export type SeoSearchParams = Record<string, string | string[] | undefined>;

export const SEO_POLICY = {
  listingQualityThreshold: 70,
  directoryLastModified: new Date("2026-05-18T00:00:00.000Z"),
  lastCheckedLabel: "Updated restaurant details",
  routeThresholds: {
    area: 5,
    neighborhood: 5,
    category: 10,
    areaCategory: 5,
    best: 5,
    facet: 10
  },
  highIntentFacetSlugs: {
    dietary: ["halal", "vegan", "vegetarian", "gluten-free"],
    service: ["takeaway", "delivery", "dine-in", "outdoor-seating"],
    type: ["fine-dining", "casual-dining", "cafe", "bar"],
    offering: ["halal-food", "vegan-options", "vegetarian-options", "organic-dishes", "small-plates"]
  } satisfies Record<FacetKey, readonly string[]>
} as const;

const noindexFollowRobots: Metadata["robots"] = { index: false, follow: true };

export function isApprovedHighIntentFacet(facet: FacetKey, valueSlug: string) {
  return SEO_POLICY.highIntentFacetSlugs[facet].includes(valueSlug);
}

export function shouldNoindexSearchParams(searchParams: SeoSearchParams) {
  return Object.values(searchParams).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value)
  );
}

export function getNoindexFollowRobots() {
  return noindexFollowRobots;
}

export function resolveCanonicalForSearchParams(searchParams: SeoSearchParams) {
  const area = firstSlug(searchParams.area);
  const neighborhood = firstSlug(searchParams.neighborhood);
  const category = firstSlug(searchParams.category) ?? firstSlug(searchParams.cuisine);
  const service = firstSlug(searchParams.service);
  const dietary = firstSlug(searchParams.dietary);
  const type = firstSlug(searchParams.type);
  const offering = firstSlug(searchParams.offering);

  if (area && category) return areaCategoryPath(area, category);
  if (area) return areaPath(area);
  if (neighborhood) return neighborhoodPath(neighborhood);
  if (category) return categoryPath(category);
  if (service && isApprovedHighIntentFacet("service", service)) return servicePath(service);
  if (dietary && isApprovedHighIntentFacet("dietary", dietary)) return dietaryPath(dietary);
  if (type && isApprovedHighIntentFacet("type", type)) return typePath(type);
  if (offering && isApprovedHighIntentFacet("offering", offering)) return offeringPath(offering);

  return "/";
}

export function scoreListingQuality(listing: Listing) {
  let score = 0;

  if (hasText(listing.description) || hasText(listing.metaDescription)) score += 10;
  if (listing.images.length > 0) score += 10;

  if (listing.contact?.phone) score += 5;
  if (listing.contact?.website) score += 5;
  if (
    listing.contact?.googleReviewsUrl ||
    listing.contact?.reserveUrl ||
    listing.contact?.orderOnlineUrl ||
    listing.contact?.menuUrl ||
    listing.contact?.email ||
    Object.keys(listing.contact?.socials ?? {}).length > 0
  ) {
    score += 5;
  }

  if (listing.fullAddress || listing.address || listing.postcode) score += 5;
  if (listing.area || listing.neighborhood || listing.borough) score += 5;
  if ((listing.location?.latitude && listing.location?.longitude) || listing.location?.googleMapsUrl) score += 5;

  if (typeof listing.rating === "number") score += 7;
  if (typeof listing.reviewCount === "number" && listing.reviewCount > 0) score += 8;

  if (listing.details?.workingHours?.length || listing.details?.workingHoursText) score += 10;

  if (listing.categories.length) score += 4;
  if (listing.details?.serviceOptions?.length) score += 4;
  if (listing.dietaryOptions.length || listing.listingTypes.length) score += 3;
  if (
    hasAny(
      listing.details?.offerings,
      listing.details?.diningOptions,
      listing.details?.highlights,
      listing.details?.amenities,
      listing.details?.popularFor
    )
  ) {
    score += 4;
  }

  if (listing.details?.googleVerified || listing.details?.placeId || listing.contact?.googleReviewsUrl) score += 10;

  return Math.min(score, 100);
}

export function isListingIndexable(listing: Listing) {
  return !isPermanentlyClosed(listing) && scoreListingQuality(listing) >= SEO_POLICY.listingQualityThreshold;
}

export function getListingRobots(listing: Listing): Metadata["robots"] | undefined {
  return isListingIndexable(listing) ? undefined : noindexFollowRobots;
}

function isPermanentlyClosed(listing: Listing) {
  const status = listing.businessStatus
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return status === "closed permanently" || status === "permanently closed";
}

function firstSlug(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? slugify(first) : undefined;
}

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function hasAny(...values: Array<string[] | undefined>) {
  return values.some((items) => Boolean(items?.length));
}
