type NearbyPlace = {
  label?: string;
  name?: string;
  distanceMeters?: number;
};

type ListingDescriptionInput = {
  name: string;
  slug?: string;
  categories?: string[];
  dietaryOptions?: string[];
  listingTypes?: string[];
  area?: string;
  neighborhood?: string;
  borough?: string;
  city?: string;
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    tubeStation?: string;
    busStop?: string;
    nearbyPlaces?: NearbyPlace[];
  };
  details?: {
    serviceOptions?: string[];
    highlights?: string[];
    offerings?: string[];
    diningOptions?: string[];
    popularFor?: string[];
  };
};

export type ListingDescriptions = {
  description: string;
  metaDescription: string;
};

export function buildListingDescriptions(listing: ListingDescriptionInput): ListingDescriptions {
  const facts = listingFacts(listing);
  const variant = stableIndex(listing.slug || listing.name, 8);
  const description = sentencePair([
    variantFirstSentence(variant, facts),
    variantSecondSentence(variant, facts)
  ]);

  return {
    description,
    metaDescription: buildMetaDescription(facts)
  };
}

function listingFacts(listing: ListingDescriptionInput) {
  const categories = cleanList(listing.categories).slice(0, 3);
  const dietary = cleanList(listing.dietaryOptions).slice(0, 2);
  const services = prioritizedServices(cleanList(listing.details?.serviceOptions)).slice(0, 3);
  const highlights = cleanList(listing.details?.highlights).slice(0, 2);
  const offerings = cleanList(listing.details?.offerings).slice(0, 2);
  const dining = cleanList(listing.details?.diningOptions).slice(0, 2);
  const locationLabel = listing.neighborhood || listing.area || listing.borough || listing.city || "London";
  const areaLabel = listing.area && listing.area !== locationLabel ? listing.area : listing.borough;
  const tube = cleanStation(listing.location?.tubeStation);
  const nearbyPlace = cleanList(listing.location?.nearbyPlaces?.map((place) => place.name)).at(0);

  return {
    name: listing.name,
    primaryCategory: categories[0] || "Restaurant",
    categories,
    dietary,
    services,
    highlights,
    offerings,
    dining,
    locationLabel,
    areaLabel,
    priceLevel: listing.priceLevel,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    tube,
    busStop: cleanValue(listing.location?.busStop),
    nearbyPlace
  };
}

function variantFirstSentence(variant: number, facts: ReturnType<typeof listingFacts>) {
  const cuisine = cuisinePhrase(facts);
  const location = locationPhrase(facts);
  const dietary = facts.dietary.length ? ` with ${lowerList(facts.dietary)} options` : "";
  const rating = ratingPhrase(facts);
  const transport = transportPhrase(facts);

  const variants = [
    `${facts.name} serves ${cuisine} in ${location}${dietary}`,
    `${facts.name} is listed in ${location} for ${cuisine}${dietary}`,
    `${facts.name} brings ${cuisine} to ${location}${dietary}`,
    `${facts.name} appears as a ${facts.primaryCategory} restaurant in ${location}${rating ? `, ${rating}` : ""}`,
    `${facts.name} is a ${facts.primaryCategory} option in ${location}${transport ? ` near ${transport}` : ""}`,
    `${facts.name} has ${cuisine} in ${location}${dietary}`,
    `${facts.name} is a ${location} restaurant covering ${cuisine}${dietary}`,
    `${facts.name} is listed for ${cuisine} in ${location}${rating ? `, ${rating}` : ""}`
  ];

  return variants[variant];
}

function variantSecondSentence(variant: number, facts: ReturnType<typeof listingFacts>) {
  const details = compactFactParts(facts);
  const nearby = nearbyPhrase(facts);
  const highlights = facts.highlights.length ? `highlights such as ${lowerList(facts.highlights)}` : undefined;
  const serviceText = facts.services.length ? lowerList(facts.services) : undefined;

  const variants = [
    sentenceFromParts([reviewPhrase(facts), serviceText, nearby]),
    sentenceFromParts([serviceText, reviewPhrase(facts), highlights || nearby]),
    sentenceFromParts([nearby, serviceText, reviewPhrase(facts)]),
    sentenceFromParts([reviewPhrase(facts), pricePhrase(facts), nearby]),
    sentenceFromParts([highlights, serviceText, nearby]),
    sentenceFromParts([pricePhrase(facts), reviewPhrase(facts), serviceText]),
    sentenceFromParts([serviceText, nearby, reviewPhrase(facts)]),
    sentenceFromParts(details)
  ];

  return variants[variant] || sentenceFromParts(details);
}

function metaSentence(facts: ReturnType<typeof listingFacts>) {
  return `${facts.name} serves ${cuisinePhrase(facts)} in ${locationPhrase(facts)}`;
}

function buildMetaDescription(facts: ReturnType<typeof listingFacts>) {
  const firstSentence = metaSentence(facts);
  const factParts = compactFactParts(facts);

  for (let count = factParts.length; count >= 0; count -= 1) {
    const candidate = sentencePair([firstSentence, sentenceFromParts(factParts.slice(0, count))]);
    if (candidate.length <= 170) return candidate;
  }

  return truncateAtWord(firstSentence, 170);
}

function compactFactParts(facts: ReturnType<typeof listingFacts>) {
  return [
    facts.dietary.length ? `${lowerList(facts.dietary)} options` : undefined,
    facts.services.length ? lowerList(facts.services) : undefined,
    reviewPhrase(facts),
    pricePhrase(facts),
    nearbyPhrase(facts)
  ];
}

function sentenceFromParts(parts: Array<string | undefined>) {
  const cleanParts = parts.filter((part): part is string => Boolean(part));
  if (!cleanParts.length) return "";
  return `The listing includes ${formatList(cleanParts)}`;
}

function cuisinePhrase(facts: ReturnType<typeof listingFacts>) {
  return facts.categories.length ? `${formatList(facts.categories)} food` : `${facts.primaryCategory} food`;
}

function locationPhrase(facts: ReturnType<typeof listingFacts>) {
  return facts.areaLabel ? `${facts.locationLabel}, ${facts.areaLabel}` : facts.locationLabel;
}

function ratingPhrase(facts: ReturnType<typeof listingFacts>) {
  if (facts.rating && facts.reviewCount) {
    return `with a ${formatRating(facts.rating)} Google rating from ${facts.reviewCount.toLocaleString()} reviews`;
  }
  if (facts.reviewCount) return `with ${facts.reviewCount.toLocaleString()} Google reviews`;
  if (facts.rating) return `with a ${formatRating(facts.rating)} Google rating`;
  return undefined;
}

function reviewPhrase(facts: ReturnType<typeof listingFacts>) {
  if (facts.reviewCount) return `${facts.reviewCount.toLocaleString()} Google reviews`;
  if (facts.rating) return `${formatRating(facts.rating)} Google rating`;
  return undefined;
}

function pricePhrase(facts: ReturnType<typeof listingFacts>) {
  return facts.priceLevel ? `${facts.priceLevel} price level` : undefined;
}

function nearbyPhrase(facts: ReturnType<typeof listingFacts>) {
  if (facts.nearbyPlace) return `nearby ${facts.nearbyPlace}`;
  if (facts.tube) return `access near ${facts.tube}`;
  if (facts.busStop) return `access near ${facts.busStop}`;
  return undefined;
}

function transportPhrase(facts: ReturnType<typeof listingFacts>) {
  return facts.tube || facts.busStop || facts.nearbyPlace;
}

function prioritizedServices(values: string[]) {
  const priority = ["Takeaway", "Delivery", "Dine-in", "Outdoor seating", "No-contact delivery", "Kerbside pickup"];
  return [...values].sort((a, b) => serviceRank(a, priority) - serviceRank(b, priority));
}

function serviceRank(value: string, priority: string[]) {
  const index = priority.findIndex((item) => slugKey(item) === slugKey(value));
  return index === -1 ? priority.length : index;
}

function lowerList(values: string[]) {
  return formatList(values.map((value) => value.toLowerCase()));
}

function sentencePair(sentences: string[]) {
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((sentence) => (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`))
    .join(" ");
}

function formatList(values: string[]) {
  const items = values.filter(Boolean);
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function cleanList(values?: Array<string | undefined>) {
  return Array.from(new Set((values ?? []).map(cleanValue).filter((value): value is string => Boolean(value))));
}

function cleanValue(value?: string) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned || /^(none|none nearby|n\/a|na|not available)$/i.test(cleaned)) return undefined;
  return cleaned;
}

function cleanStation(value?: string) {
  const station = cleanValue(value);
  if (!station) return undefined;
  return /station$/i.test(station) ? station : `${station} Station`;
}

function formatRating(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function truncateAtWord(value: string, limit: number) {
  if (value.length <= limit) return value;
  const sliced = value.slice(0, limit - 1);
  const trimmed = sliced.slice(0, Math.max(0, sliced.lastIndexOf(" "))).trimEnd() || sliced.trimEnd();
  return `${trimmed.replace(/[,.]$/, "")}.`;
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
}

function slugKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
