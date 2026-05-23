import { directoryConfig } from "@/config/directory";
import type { Listing, OpeningHours } from "@/data/listings";
import { cleanListingUrl } from "@/lib/listing-links";
import { listingDetailPath } from "@/lib/routes";

export type ShortlistListingSummary = {
  slug: string;
  name: string;
  href: string;
  ratingLabel: string;
  reviewLabel: string;
  priceLabel: string;
  areaLabel: string;
  categoriesLabel: string;
  dietaryLabel: string;
  servicesLabel: string;
  parkingLabel: string;
  websiteUrl?: string;
  menuUrl?: string;
  bookingUrl?: string;
  workingHours?: OpeningHours[];
};

export type CompareField = {
  id:
    | "rating"
    | "reviews"
    | "price"
    | "area"
    | "openStatus"
    | "categories"
    | "dietary"
    | "services"
    | "parking"
    | "notes"
    | "links";
  label: string;
};

const shortlistConfig = directoryConfig.shortlist;

export const SHORTLIST_STORAGE_KEY: string = shortlistConfig.storageKey;
export const DEFAULT_SHORTLIST_LIMIT: number = shortlistConfig.limit;

export function addShortlistSlug(slugs: string[], slug: string, limit = DEFAULT_SHORTLIST_LIMIT) {
  if (!slug) return normalizeShortlistSlugs(slugs, limit);
  return normalizeShortlistSlugs([slug, ...slugs.filter((item) => item !== slug)], limit);
}

export function removeShortlistSlug(slugs: string[], slug: string) {
  return slugs.filter((item) => item !== slug);
}

export function toggleShortlistSlug(slugs: string[], slug: string, limit = DEFAULT_SHORTLIST_LIMIT) {
  return slugs.includes(slug) ? removeShortlistSlug(slugs, slug) : addShortlistSlug(slugs, slug, limit);
}

export function normalizeShortlistSlugs(slugs: string[], limit = DEFAULT_SHORTLIST_LIMIT) {
  const seen = new Set<string>();
  const result: string[] = [];

  slugs.forEach((slug) => {
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    result.push(slug);
  });

  return result.slice(0, limit);
}

export function getShortlistListingSummaries(slugs: string[], sourceListings: Listing[]) {
  const listingBySlug = new Map(sourceListings.map((listing) => [listing.slug, listing]));

  return normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT)
    .map((slug) => listingBySlug.get(slug))
    .filter((listing): listing is Listing => Boolean(listing))
    .map(toShortlistListingSummary);
}

export function getAllShortlistListingSummaries(sourceListings: Listing[]) {
  return sourceListings.map(toShortlistListingSummary);
}

export function getCompareFields(): CompareField[] {
  return [
    { id: "rating", label: "Rating" },
    { id: "reviews", label: "Reviews" },
    { id: "price", label: "Price" },
    { id: "area", label: "Area" },
    { id: "openStatus", label: "Open status" },
    { id: "categories", label: directoryConfig.categoryPluralLabel },
    { id: "dietary", label: "Dietary" },
    { id: "services", label: "Services" },
    { id: "parking", label: "Parking" },
    { id: "notes", label: "Private notes" },
    { id: "links", label: "Links" }
  ];
}

function toShortlistListingSummary(listing: Listing): ShortlistListingSummary {
  return {
    slug: listing.slug,
    name: listing.name,
    href: listingDetailPath(listing.slug),
    ratingLabel: formatNumber(listing.rating),
    reviewLabel: listing.reviewCount ? listing.reviewCount.toLocaleString() : "Not listed",
    priceLabel: listing.priceLevel ?? "Not listed",
    areaLabel: [listing.neighborhood, listing.area].filter(Boolean).join(", ") || "Not listed",
    categoriesLabel: listLabel(listing.categories),
    dietaryLabel: listLabel(listing.dietaryOptions),
    servicesLabel: listLabel(listing.details?.serviceOptions),
    parkingLabel: listLabel(listing.details?.parking),
    websiteUrl: cleanListingUrl(listing.contact?.website),
    menuUrl: cleanListingUrl(listing.contact?.menuUrl),
    bookingUrl: cleanListingUrl(listing.contact?.reserveUrl ?? listing.contact?.appointmentUrl),
    workingHours: listing.details?.workingHours
  };
}

function formatNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1).replace(".0", "") : "Not listed";
}

function listLabel(values?: string[]) {
  return values?.length ? values.join(", ") : "Not listed";
}
