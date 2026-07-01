import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const listingsSourcePath = path.join(root, "src", "data", "listings.ts");
const listingsJsonPath = path.join(root, "data", "listings.json");
const listingSearchRecordsJsonPath = path.join(root, "data", "listing-search-records.json");

assert.ok(fs.existsSync(listingsJsonPath), "listing records should be stored in data/listings.json");
assert.ok(
  fs.existsSync(listingSearchRecordsJsonPath),
  "compact client search records should be stored in data/listing-search-records.json"
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

console.log("listings data storage tests passed");
