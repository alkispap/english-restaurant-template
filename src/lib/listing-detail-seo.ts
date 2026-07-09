import type { Listing } from "@/data/listings";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";

type ListingSeoInput = Pick<
  Listing,
  | "name"
  | "area"
  | "neighborhood"
  | "categories"
  | "rating"
  | "reviewCount"
  | "fullAddress"
  | "contact"
  | "details"
>;

export function buildListingDetailSeoTitle(listing: Pick<Listing, "name" | "area">) {
  return `${listing.name} in ${titleLocation(listing.area)} - Reviews & Details`;
}

export function buildListingDetailMetaDescription(listing: ListingSeoInput) {
  const category = primaryCategory(listing);
  const firstSentence = `${listing.name} in ${descriptionLocation(listing)} is ${articleFor(category)} ${category} ${singularListingLabel()}${reviewPhrase(listing)}.`;
  const details = detailParts(listing);

  for (let count = details.length; count >= 0; count -= 1) {
    const selectedDetails = details.slice(0, count);
    const secondSentence = selectedDetails.length ? ` Check ${formatList(selectedDetails)}.` : "";
    const candidate = `${firstSentence}${secondSentence}`;
    if (candidate.length <= 170) return candidate;
  }

  return truncateAtWord(firstSentence, 170);
}

export function buildListingDetailPageSummary(listing: ListingSeoInput) {
  const parts = [
    `${possessive(listing.name)} ${summaryLocation(listing)} location`,
    `${primaryCategory(listing)} category`,
    ratingSummary(listing),
    hasHours(listing) ? "opening details" : undefined,
    hasService(listing, "delivery") ? "delivery" : undefined,
    hasService(listing, "takeaway") ? "takeaway" : undefined,
    "similar restaurants nearby"
  ].filter((part): part is string => Boolean(part));

  return `Use this profile to check ${formatList(parts)}.`;
}

function titleLocation(area?: string) {
  if (area && !sameText(area, siteConfig.cityOrRegion)) return `${area}, ${siteConfig.cityOrRegion}`;
  return siteConfig.cityOrRegion;
}

function descriptionLocation(listing: Pick<ListingSeoInput, "area" | "neighborhood">) {
  const parts = [listing.neighborhood, listing.area]
    .filter((part): part is string => Boolean(part))
    .filter((part, index, values) => values.findIndex((value) => sameText(value, part)) === index)
    .filter((part) => !sameText(part, siteConfig.cityOrRegion));

  return parts.length ? parts.join(", ") : siteConfig.cityOrRegion;
}

function summaryLocation(listing: Pick<ListingSeoInput, "area" | "neighborhood">) {
  return listing.neighborhood || listing.area || siteConfig.cityOrRegion;
}

function primaryCategory(listing: Pick<ListingSeoInput, "categories">) {
  return listing.categories[0] || directoryConfig.primaryCategory || singularListingLabel();
}

function singularListingLabel() {
  return (directoryConfig.listingPluralLabel || "restaurants").replace(/s$/i, "").toLowerCase();
}

function reviewPhrase(listing: Pick<ListingSeoInput, "rating" | "reviewCount">) {
  if (!listing.rating || !listing.reviewCount) return "";
  return ` rated ${listing.rating.toFixed(1)} from ${listing.reviewCount.toLocaleString()} reviews`;
}

function ratingSummary(listing: Pick<ListingSeoInput, "rating" | "reviewCount">) {
  if (!listing.rating || !listing.reviewCount) return undefined;
  return `${listing.rating.toFixed(1)} rating from ${listing.reviewCount.toLocaleString()} reviews`;
}

function detailParts(listing: ListingSeoInput) {
  return [
    listing.contact?.menuUrl ? "menu" : undefined,
    listing.fullAddress ? "address" : undefined,
    hasHours(listing) ? "hours" : undefined,
    hasService(listing, "delivery") ? "delivery" : undefined,
    hasService(listing, "takeaway") ? "takeaway" : undefined,
    "nearby restaurants"
  ].filter((part): part is string => Boolean(part));
}

function hasHours(listing: Pick<ListingSeoInput, "details">) {
  return Boolean(listing.details?.workingHours?.length || listing.details?.workingHoursText);
}

function hasService(listing: Pick<ListingSeoInput, "details">, service: "delivery" | "takeaway") {
  return Boolean(listing.details?.serviceOptions?.some((item) => sameText(item, service)));
}

function possessive(value: string) {
  return value.endsWith("s") ? `${value}'` : `${value}'s`;
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a";
}

function sameText(left?: string, right?: string) {
  return Boolean(left && right && left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0);
}

function formatList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function truncateAtWord(value: string, limit: number) {
  if (value.length <= limit) return value;
  const sliced = value.slice(0, limit - 1);
  const trimmed = sliced.slice(0, Math.max(0, sliced.lastIndexOf(" "))).trimEnd() || sliced.trimEnd();
  return `${trimmed.replace(/[,.]$/, "")}.`;
}
