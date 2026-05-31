import { siteConfig } from "@/config/site";
import type { Listing } from "@/data/listings";
import type { EavGroup } from "@/lib/directory-semantic-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single question-and-answer block representing one EAV group for a listing.
 *
 * - group:     The EAV group identifier (matches EavGroup in directory-semantic-map).
 * - question:  A plain-English question a visitor might ask about this topic.
 * - answer:    A factual, concise answer derived solely from listing data.
 * - available: false when the listing has no data for this group. Task 3 can use
 *              this flag to hide or grey-out the block in the UI.
 */
export type EavBlock = {
  group: EavGroup;
  question: string;
  answer: string;
  available: boolean;
};

/**
 * The full set of EAV summary blocks for a single listing.
 * Always contains exactly 7 blocks in a fixed order:
 *   location -> category -> services -> dietary -> transport -> reviews -> contactActions
 */
export type ListingEavSummary = {
  listingName: string;
  blocks: EavBlock[];
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Joins an array of strings into a natural English list.
 * ["a"]         → "a"
 * ["a", "b"]    → "a and b"
 * ["a","b","c"] → "a, b, and c"  (Oxford comma)
 */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Formats tube line names correctly.
 * ["Central"]           → "Central line"
 * ["Central","District"]→ "Central and District lines"
 */
function formatTubeLines(lines: string[]): string {
  if (lines.length === 0) return "an unknown line";
  const joined = joinList(lines);
  return `${joined} ${lines.length === 1 ? "line" : "lines"}`;
}

// ---------------------------------------------------------------------------
// Block builders — one per EAV group
// ---------------------------------------------------------------------------

function buildLocationBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `Where is ${name} located?`;

  const address = listing.fullAddress ?? listing.address;
  if (!address) {
    return {
      group: "location",
      question,
      answer: `No address is currently listed in our directory for ${name}.`,
      available: false,
    };
  }

  // Build a rich sentence using whatever sub-fields are available.
  // fullAddress already includes postcode + city in the data, so prefer it.
  const parts: string[] = [];
  if (listing.neighborhood) parts.push(listing.neighborhood);
  if (listing.borough && listing.borough !== listing.neighborhood) parts.push(listing.borough);
  const cityLabel = listing.city ?? siteConfig.city;
  if (cityLabel) parts.push(cityLabel);

  const locationPhrase = parts.length > 0 ? ` in ${parts.join(", ")}` : "";

  return {
    group: "location",
    question,
    answer: `${name} is located at ${address}${locationPhrase}.`,
    available: true,
  };
}

function buildCategoryBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `What type of food does ${name} serve?`;

  const categories = listing.categories ?? [];
  if (categories.length === 0) {
    return {
      group: "category",
      question,
      answer: `No cuisine categories are currently listed in our directory for ${name}.`,
      available: false,
    };
  }

  const categoryPhrase = joinList(categories);
  const suffix = listing.listingTypes && listing.listingTypes.length > 0
    ? ` It is listed under the dining type: ${joinList(listing.listingTypes)}.`
    : "";

  return {
    group: "category",
    question,
    answer: `${name} is categorised as a ${categoryPhrase} restaurant.${suffix}`,
    available: true,
  };
}

function buildServicesBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `What dining and service options are available at ${name}?`;

  const serviceOptions = listing.details?.serviceOptions ?? [];
  const diningOptions = listing.details?.diningOptions ?? [];

  if (serviceOptions.length === 0 && diningOptions.length === 0) {
    return {
      group: "services",
      question,
      answer: `No service or dining options are currently listed in our directory for ${name}.`,
      available: false,
    };
  }

  const parts: string[] = [];
  if (serviceOptions.length > 0) {
    parts.push(`Service options include ${joinList(serviceOptions)}`);
  }
  if (diningOptions.length > 0) {
    parts.push(`dining options include ${joinList(diningOptions)}`);
  }

  return {
    group: "services",
    question,
    answer: `${parts.join("; ")}.`,
    available: true,
  };
}

function buildDietaryBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `Does ${name} cater for special dietary requirements?`;

  const dietary = listing.dietaryOptions ?? [];
  if (dietary.length === 0) {
    return {
      group: "dietary",
      question,
      answer: `No specific dietary options are currently listed in our directory for ${name}.`,
      available: false,
    };
  }

  return {
    group: "dietary",
    question,
    answer: `${name} is listed with the following dietary options: ${joinList(dietary)}.`,
    available: true,
  };
}

function buildTransportBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `How do you get to ${name} by public transport?`;

  const loc = listing.location;
  const hasTube = !!(loc?.tubeStation && loc?.tubeDistanceMeters !== undefined);
  const hasBus = !!(loc?.busStop && loc?.busRoutes && loc.busRoutes.length > 0);

  if (!hasTube && !hasBus) {
    return {
      group: "transport",
      question,
      answer: `No public transport information is currently listed in our directory for ${name}.`,
      available: false,
    };
  }

  const sentences: string[] = [];

  if (hasTube && loc) {
    const tubeLines = formatTubeLines(loc.tubeLines ?? []);
    const dist = loc.tubeDistanceMeters;
    const walk = loc.tubeWalkMinutes;
    const walkPhrase = walk !== undefined ? `, approximately a ${walk}-minute walk` : "";
    sentences.push(
      `The nearest tube station is ${loc.tubeStation} (${tubeLines}), ${dist} metres away${walkPhrase}.`
    );
  }

  if (hasBus && loc) {
    const dist = loc.busDistanceMeters;
    const walk = loc.busWalkMinutes;
    const routes = joinList(loc.busRoutes ?? []);
    const distPhrase = dist !== undefined ? `, ${dist} metres away` : "";
    const walkPhrase = walk !== undefined ? ` (approximately a ${walk}-minute walk)` : "";
    sentences.push(
      `The nearest bus stop is ${loc.busStop}${distPhrase}${walkPhrase}, served by routes ${routes}.`
    );
  }

  return {
    group: "transport",
    question,
    answer: sentences.join(" "),
    available: true,
  };
}

function buildReviewsBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `What review signals are listed for ${name}?`;

  const rating = listing.rating;
  const reviewCount = listing.reviewCount;

  if (rating === undefined && reviewCount === undefined) {
    return {
      group: "reviews",
      question,
      answer: `${name} does not list rating or review-count data in the current directory data.`,
      available: false,
    };
  }

  const ratingPhrase = rating !== undefined ? `a listed rating of ${rating}/5 stars` : "a listed rating without a score";
  const reviewPhrase = reviewCount !== undefined
    ? `based on ${reviewCount.toLocaleString("en-GB")} Google ${reviewCount === 1 ? "review" : "reviews"}`
    : "with no review count currently listed";
  const reviewLinkPhrase = listing.contact?.googleReviewsUrl ? " A Google reviews link is available from this listing." : "";

  return {
    group: "reviews",
    question,
    answer: `${name} has ${ratingPhrase}, ${reviewPhrase}.${reviewLinkPhrase}`,
    available: true,
  };
}

function buildContactActionsBlock(listing: Listing): EavBlock {
  const name = listing.name;
  const question = `How can visitors contact or book ${name}?`;
  const actions = [
    listing.contact?.phone ? "phone" : undefined,
    listing.contact?.email ? "email" : undefined,
    listing.contact?.website ? "website" : undefined,
    listing.location?.googleMapsUrl || listing.fullAddress || listing.address ? "map search" : undefined,
    listing.contact?.googleReviewsUrl ? "Google reviews" : undefined,
    listing.contact?.reserveUrl ? "reservations" : undefined,
    listing.contact?.orderOnlineUrl ? "online ordering" : undefined,
    listing.contact?.appointmentUrl ? "appointments" : undefined,
    listing.contact?.menuUrl ? "menu" : undefined
  ].filter(Boolean) as string[];

  if (!actions.length) {
    return {
      group: "contactActions",
      question,
      answer: `${name} does not list contact actions in the current directory data.`,
      available: false,
    };
  }

  return {
    group: "contactActions",
    question,
    answer: `${name} lists contact actions for ${joinList(actions)}.`,
    available: true,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * buildListingEavSummary — converts a Listing object into a set of
 * question-led factual answer blocks, one per EAV group.
 *
 * Always returns exactly 7 blocks in this fixed order:
 *   location -> category -> services -> dietary -> transport -> reviews -> contactActions
 *
 * When data is missing for a group, the block is returned with
 *   available: false  and a plain-English fallback answer.
 *
 * This function never throws for missing or undefined fields.
 */
export function buildListingEavSummary(listing: Listing): ListingEavSummary {
  return {
    listingName: listing.name,
    blocks: [
      buildLocationBlock(listing),
      buildCategoryBlock(listing),
      buildServicesBlock(listing),
      buildDietaryBlock(listing),
      buildTransportBlock(listing),
      buildReviewsBlock(listing),
      buildContactActionsBlock(listing),
    ],
  };
}
