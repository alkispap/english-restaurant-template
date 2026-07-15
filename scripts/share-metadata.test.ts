import assert from "node:assert/strict";
import { listingShareMetadata } from "../src/lib/share-metadata";
import type { Listing } from "../src/data/listings";
import { getSiteUrl } from "../src/lib/site-url";
import { siteConfig } from "../src/config/site";

const listing: Listing = {
  name: "Sample Restaurant",
  slug: "sample-restaurant",
  metaTitle: "Sample Restaurant | London",
  metaDescription: "Sample description for sharing.",
  description: "Fallback description.",
  images: ["https://images.unsplash.com/photo-1"],
  categories: ["Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
};

function listingShareMetadataUsesListingContent() {
  const metadata = listingShareMetadata(listing);

  assert.equal(metadata.title, "Sample Restaurant | London");
  assert.equal(metadata.description, "Sample description for sharing.");
  assert.equal(metadata.url, `${getSiteUrl()}/restaurants/sample-restaurant/`);
  assert.deepEqual(metadata.images, ["https://images.unsplash.com/photo-1"]);
}

function listingShareMetadataFallsBackWhenImageMissing() {
  const metadata = listingShareMetadata({ ...listing, images: [], metaDescription: undefined });

  assert.equal(metadata.description, "Fallback description.");
  assert.deepEqual(metadata.images, [siteConfig.heroImage]);
}

listingShareMetadataUsesListingContent();
listingShareMetadataFallsBackWhenImageMissing();

console.log("share metadata behavior tests passed");
