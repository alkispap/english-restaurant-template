import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { listings } from "../src/data/listings";
import { getRelatedListings, isCategoryTag, slugify } from "../src/lib/directory";
import { getListingExploreLinks } from "../src/lib/directory-growth";

const sample = listings.slice(0, 100);
const start = performance.now();

for (const listing of sample) {
  getRelatedListings(listing, 8);
  getListingExploreLinks(listing);
  const tags = [...listing.categories, ...listing.listingTypes, ...listing.dietaryOptions];
  tags.map((tag) => (isCategoryTag(tag) ? slugify(tag) : tag));
}

const elapsed = performance.now() - start;

assert.ok(
  elapsed < 4000,
  `listing build helpers should not repeatedly scan all listings during static export; took ${Math.round(elapsed)}ms`
);

console.log("listing build performance tests passed");
