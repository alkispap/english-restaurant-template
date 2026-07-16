import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  confirmedListingEntityResolutions,
  resolveListingEntitySourceId
} from "../src/data/listing-entity-resolutions";
import { listingSlugRedirects } from "../src/data/listing-slug-redirects";
import { listings } from "../src/data/listings";
import { publishedListings } from "../src/data/listing-publication";

const searchRecords = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "listing-search-records.json"), "utf8")
) as Array<{ slug: string }>;
const shortlistSummaries = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "shortlist-summaries.json"), "utf8")
) as Array<{ slug: string }>;

for (const resolution of confirmedListingEntityResolutions) {
  const canonical = listings.find((listing) => listing.slug === resolution.canonicalSlug);
  assert.ok(canonical, `canonical listing should exist: ${resolution.canonicalSlug}`);
  assert.equal(canonical.details?.placeId, resolution.canonicalSourceId);

  for (const aliasSourceId of resolution.aliasSourceIds) {
    assert.equal(resolveListingEntitySourceId(aliasSourceId), resolution.canonicalSourceId);
  }

  for (const aliasSlug of resolution.aliasSlugs) {
    assert.ok(!listings.some((listing) => listing.slug === aliasSlug), `retired listing should be absent: ${aliasSlug}`);
    assert.ok(!searchRecords.some((listing) => listing.slug === aliasSlug), `search index should omit: ${aliasSlug}`);
    assert.ok(!shortlistSummaries.some((listing) => listing.slug === aliasSlug), `shortlist index should omit: ${aliasSlug}`);
    assert.equal(listingSlugRedirects[aliasSlug as keyof typeof listingSlugRedirects], resolution.canonicalSlug);
  }
}

assert.equal(publishedListings.length, searchRecords.length);
assert.equal(publishedListings.length, shortlistSummaries.length);

console.log("listing entity resolution tests passed");
