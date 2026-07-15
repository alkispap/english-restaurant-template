import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unpackListingSearchRecords } from "../src/lib/listing-search-index";

const root = process.cwd();
const listingsSourcePath = path.join(root, "src", "data", "listings.ts");
const listingsJsonPath = path.join(root, "data", "listings.json");
const listingSearchRecordsJsonPath = path.join(root, "data", "listing-search-records.json");
const listingSearchIndexJsonPath = path.join(root, "data", "listing-search-index.json");
const shortlistSummariesJsonPath = path.join(root, "data", "shortlist-summaries.json");

assert.ok(fs.existsSync(listingsJsonPath), "listing records should be stored in data/listings.json");
assert.ok(
  fs.existsSync(listingSearchRecordsJsonPath),
  "compact client search records should be stored in data/listing-search-records.json"
);
assert.ok(
  fs.existsSync(listingSearchIndexJsonPath),
  "browser search records should have a generated packed index"
);
assert.ok(
  fs.existsSync(shortlistSummariesJsonPath),
  "compact compare shortlist summaries should be stored in data/shortlist-summaries.json"
);

const listingsSource = fs.readFileSync(listingsSourcePath, "utf8");
assert.ok(
  fs.statSync(listingsSourcePath).size < 20000,
  "src/data/listings.ts should stay small for faster local Next development"
);
assert.ok(
  !listingsSource.includes("const listingsJson"),
  "src/data/listings.ts should not embed the listing records as a TypeScript string"
);

const listings = JSON.parse(fs.readFileSync(listingsJsonPath, "utf8"));
assert.ok(Array.isArray(listings), "data/listings.json should contain a listing array");
assert.ok(listings.length > 0, "data/listings.json should include imported listings");

const searchRecords = JSON.parse(fs.readFileSync(listingSearchRecordsJsonPath, "utf8"));
assert.ok(Array.isArray(searchRecords), "data/listing-search-records.json should contain a listing array");
assert.equal(
  searchRecords.length,
  listings.length,
  "compact client search records should stay in sync with full listing records"
);
assert.ok(
  fs.statSync(listingSearchRecordsJsonPath).size < fs.statSync(listingsJsonPath).size,
  "compact client search records should be smaller than full listing records"
);

const packedSearchIndex = JSON.parse(fs.readFileSync(listingSearchIndexJsonPath, "utf8"));
const unpackedSearchRecords = JSON.parse(JSON.stringify(unpackListingSearchRecords(packedSearchIndex)));
assert.deepEqual(
  unpackedSearchRecords,
  searchRecords,
  "packed browser search records should decode without losing listing fields"
);
assert.ok(
  fs.statSync(listingSearchIndexJsonPath).size < fs.statSync(listingSearchRecordsJsonPath).size / 2,
  "packed browser search index should remain less than half the verbose search-record size"
);

const shortlistSummaries = JSON.parse(fs.readFileSync(shortlistSummariesJsonPath, "utf8"));
assert.ok(Array.isArray(shortlistSummaries), "data/shortlist-summaries.json should contain a listing array");
assert.equal(
  shortlistSummaries.length,
  listings.length,
  "compact compare shortlist summaries should stay in sync with full listing records"
);
assert.ok(
  fs.statSync(shortlistSummariesJsonPath).size < fs.statSync(listingSearchRecordsJsonPath).size,
  "compare shortlist summaries should be smaller than browser search records"
);
assert.ok(
  shortlistSummaries.every((summary) => !("description" in summary) && !("images" in summary) && !("details" in summary)),
  "compare shortlist summaries should not carry full search-card fields"
);

const listingImagesBySlug = new Map(listings.map((listing) => [listing.slug, listing.images.slice(0, 3)]));
const recordsWithImageDrift = searchRecords
  .filter((record) => JSON.stringify(record.images) !== JSON.stringify(listingImagesBySlug.get(record.slug) ?? []))
  .map((record) => record.slug);

assert.deepEqual(recordsWithImageDrift, [], "compact client search records should use the same cleaned listing-card images");

console.log("listings data storage tests passed");
