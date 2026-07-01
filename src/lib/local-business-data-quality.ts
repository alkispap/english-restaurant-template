import type { Listing } from "@/data/listings";
import { cleanListingUrl } from "@/lib/listing-links";

export type LocalBusinessDataQualitySeverity = "info" | "warning";

export type LocalBusinessDataQualityIssue = {
  code:
    | "coordinates_outside_london"
    | "core_location_fields_missing"
    | "duplicate_slugs"
    | "duplicate_place_ids"
    | "invalid_contact_urls"
    | "duplicate_phone_numbers";
  severity: LocalBusinessDataQualitySeverity;
  message: string;
  recommendation: string;
  listings: string[];
};

export type LocalBusinessDataQualityReport = {
  summary: {
    totalListings: number;
    withCategories: number;
    withCoordinates: number;
    withCoreLocation: number;
    withPhone: number;
    withWebsite: number;
    withWorkingHours: number;
    withRatingAndReviewCount: number;
  };
  issues: LocalBusinessDataQualityIssue[];
};

const LONDON_BOUNDS = {
  minLatitude: 51.2,
  maxLatitude: 51.75,
  minLongitude: -0.55,
  maxLongitude: 0.35
};

export function auditLocalBusinessDataQuality(listings: Listing[]): LocalBusinessDataQualityReport {
  const issues: LocalBusinessDataQualityIssue[] = [];

  const outsideLondon = listings.filter((listing) => {
    const latitude = listing.location?.latitude;
    const longitude = listing.location?.longitude;
    if (latitude === undefined || longitude === undefined) return false;
    return (
      latitude < LONDON_BOUNDS.minLatitude ||
      latitude > LONDON_BOUNDS.maxLatitude ||
      longitude < LONDON_BOUNDS.minLongitude ||
      longitude > LONDON_BOUNDS.maxLongitude
    );
  });

  if (outsideLondon.length) {
    issues.push({
      code: "coordinates_outside_london",
      severity: "warning",
      message: `${outsideLondon.length.toLocaleString()} listings have coordinates outside expected London bounds.`,
      recommendation: "Review source latitude/longitude values before using these listings for maps, nearby logic, or local schema.",
      listings: sampleListings(outsideLondon)
    });
  }

  const missingCoreLocation = listings.filter((listing) => !hasCoreLocation(listing));
  if (missingCoreLocation.length) {
    issues.push({
      code: "core_location_fields_missing",
      severity: "warning",
      message: `${missingCoreLocation.length.toLocaleString()} listings are missing core location fields.`,
      recommendation: "Fill address, postcode, area, neighborhood, and borough for affected listings where source data is available.",
      listings: sampleListings(missingCoreLocation)
    });
  }

  const duplicateSlugs = duplicateValues(listings, (listing) => listing.slug);
  if (duplicateSlugs.length) {
    issues.push({
      code: "duplicate_slugs",
      severity: "warning",
      message: `${duplicateSlugs.length.toLocaleString()} duplicate slug groups found.`,
      recommendation: "Keep listing slugs unique so canonical URLs and redirects stay reliable.",
      listings: duplicateSlugs.flatMap((group) => group.listings).slice(0, 12)
    });
  }

  const duplicatePlaceIds = duplicateValues(listings, (listing) => listing.details?.placeId);
  if (duplicatePlaceIds.length) {
    issues.push({
      code: "duplicate_place_ids",
      severity: "warning",
      message: `${duplicatePlaceIds.length.toLocaleString()} duplicate Google place ID groups found.`,
      recommendation: "Review duplicate place IDs because they usually indicate repeated source records for the same business.",
      listings: duplicatePlaceIds.flatMap((group) => group.listings).slice(0, 12)
    });
  }

  const invalidUrls = listings.filter(hasInvalidContactUrl);
  if (invalidUrls.length) {
    issues.push({
      code: "invalid_contact_urls",
      severity: "warning",
      message: `${invalidUrls.length.toLocaleString()} listings have invalid contact URLs.`,
      recommendation: "Clean website, menu, ordering, booking, and Google review URLs before exposing them in UI or schema.",
      listings: sampleListings(invalidUrls)
    });
  }

  const duplicatePhones = duplicateValues(listings, (listing) => normalizePhone(listing.contact?.phone));
  if (duplicatePhones.length) {
    issues.push({
      code: "duplicate_phone_numbers",
      severity: "info",
      message: `${duplicatePhones.length.toLocaleString()} duplicate phone-number groups found.`,
      recommendation: "Review duplicate phone groups manually; they can be valid chains or shared kitchens, so they should not be auto-blocked.",
      listings: duplicatePhones.flatMap((group) => group.listings).slice(0, 12)
    });
  }

  return {
    summary: {
      totalListings: listings.length,
      withCategories: listings.filter((listing) => listing.categories.length).length,
      withCoordinates: listings.filter((listing) => listing.location?.latitude !== undefined && listing.location?.longitude !== undefined).length,
      withCoreLocation: listings.filter(hasCoreLocation).length,
      withPhone: listings.filter((listing) => Boolean(listing.contact?.phone)).length,
      withWebsite: listings.filter((listing) => Boolean(listing.contact?.website)).length,
      withWorkingHours: listings.filter((listing) => Boolean(listing.details?.workingHours?.length)).length,
      withRatingAndReviewCount: listings.filter((listing) => Boolean(listing.rating && listing.reviewCount)).length
    },
    issues
  };
}

function hasCoreLocation(listing: Listing) {
  return Boolean(listing.address && listing.postcode && listing.area && listing.neighborhood && listing.borough);
}

function hasInvalidContactUrl(listing: Listing) {
  const contact = listing.contact;
  if (!contact) return false;

  return [
    contact.website,
    contact.contactUrl,
    contact.googleReviewsUrl,
    contact.orderOnlineUrl,
    contact.reserveUrl,
    contact.appointmentUrl,
    contact.menuUrl,
    ...(contact.socials ? Object.values(contact.socials) : [])
  ]
    .filter(Boolean)
    .some((value) => !cleanListingUrl(value));
}

function duplicateValues(listings: Listing[], valueFor: (listing: Listing) => string | undefined) {
  const groups = new Map<string, string[]>();

  for (const listing of listings) {
    const value = valueFor(listing)?.trim();
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), `${listing.name} (${listing.slug})`]);
  }

  return [...groups.entries()]
    .filter(([, groupListings]) => groupListings.length > 1)
    .map(([value, groupListings]) => ({ value, listings: groupListings }));
}

function normalizePhone(value?: string) {
  return value?.replace(/[^\d+]/g, "");
}

function sampleListings(listings: Listing[]) {
  return listings.slice(0, 12).map((listing) => `${listing.name} (${listing.slug})`);
}
