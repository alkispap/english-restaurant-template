import type { Listing } from "@/data/listings";
import { siteConfig } from "@/config/site";

export type ListingShareMetadata = {
  title: string;
  description: string;
  url: string;
  images: string[];
};

export function listingShareMetadata(listing: Listing): ListingShareMetadata {
  const title = listing.metaTitle || listing.name;
  const description =
    listing.metaDescription ||
    listing.description ||
    `${listing.name} ${listing.categories.slice(0, 2).join(", ")} listing.`;
  const url = `${siteConfig.url}/${siteConfig.listingBasePath}/${listing.slug}`;
  const images = listing.images[0] ? [listing.images[0]] : [];

  return {
    title,
    description,
    url,
    images
  };
}
