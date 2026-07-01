import type { Listing } from "@/data/listings";
import { siteConfig } from "@/config/site";

export type ListingDetailHeadings = {
  h1: string;
  quickFacts: string;
  services: string;
  guestInfo: string;
  transport: string;
  nearby: string;
  comments: string;
  contact: string;
  hours: string;
  reviews: string;
  explore: string;
  similar: string;
};

export function buildListingDetailHeadings(listing: Pick<Listing, "name" | "area">): ListingDetailHeadings {
  const niche = titleCase(siteConfig.niche);
  const localNiche = titleCase(siteConfig.niche.replace(new RegExp(`\\s+in\\s+${escapeRegExp(siteConfig.cityOrRegion)}$`, "i"), ""));

  return {
    h1: buildListingDetailPageTitle(listing),
    quickFacts: `Quick Facts About ${listing.name}`,
    services: `${listing.name} Services, Dining Options, and Features`,
    guestInfo: `Guest Information for ${listing.name}`,
    transport: `Transport and Directions to ${listing.name}`,
    nearby: `Nearby Places Around ${listing.name}`,
    comments: `Comments About ${listing.name}`,
    contact: `${listing.name} Location and Contact Details`,
    hours: `${listing.name} Opening Hours`,
    reviews: `${listing.name} Reviews and Ratings`,
    explore: `Explore More ${localNiche} Near ${listing.name}`,
    similar: `Similar ${niche}`
  };
}

export function buildListingDetailPageTitle(listing: Pick<Listing, "name" | "area">) {
  const location = listing.area ? `${listing.area}, ${siteConfig.cityOrRegion}` : siteConfig.cityOrRegion;
  return `${listing.name} in ${location}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCase(value: string) {
  const smallWords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to"]);
  return value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
