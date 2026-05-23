export type ListingImageAltInput = {
  name: string;
  categories?: string[];
  neighborhood?: string;
  area?: string;
  city?: string;
};

export type ListingImageAltOptions = {
  variant?: "card" | "featured" | "gallery";
  index?: number;
};

export function buildListingImageAlt(listing: ListingImageAltInput, options: ListingImageAltOptions = {}) {
  const name = cleanText(listing.name) || "Local business";
  const category = cleanText(listing.categories?.[0]);
  const location = cleanText(listing.neighborhood) || cleanText(listing.area) || cleanText(listing.city);
  const city = cleanText(listing.city) || "London";

  const parts = [name];
  if (category && !containsWord(name, category)) {
    parts.push(category);
  }
  parts.push("restaurant");

  const locationText = buildLocationText(name, location, city);
  if (locationText) {
    parts.push(locationText);
  }

  const suffix = buildVariantSuffix(options);
  if (suffix) {
    parts.push(suffix);
  }

  return parts.join(" ");
}

function buildLocationText(name: string, location?: string, city?: string) {
  if (!location && !city) return "";

  const visibleLocation = location && !containsWord(name, location) ? location : "";
  const visibleCity = city && !containsWord(name, city) && !sameText(location, city) ? city : "";

  const place = [visibleLocation, visibleCity].filter(Boolean).join(", ");
  return place ? `in ${place}` : "";
}

function buildVariantSuffix(options: ListingImageAltOptions) {
  if (options.variant !== "gallery" || options.index === undefined) return "";
  return `photo ${options.index + 1}`;
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

function sameText(left?: string, right?: string) {
  return Boolean(left && right && left.toLocaleLowerCase() === right.toLocaleLowerCase());
}

function containsWord(text: string, candidate: string) {
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(\\W|$)`, "i").test(text);
}
