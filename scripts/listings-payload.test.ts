import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";

const groups = getFilterPanelOptionGroups();
const serializedBytes = Buffer.byteLength(JSON.stringify(groups), "utf8");
const root = process.cwd();
const listingsJsonPath = path.join(root, "data", "listings.json");
const listingSearchRecordsJsonPath = path.join(root, "data", "listing-search-records.json");
const listingFilterCountsJsonPath = path.join(root, "data", "listing-filter-counts.json");
const listingFilterCountsSourcePath = path.join(root, "src", "lib", "listing-filter-counts.ts");

assert.ok(serializedBytes < 75_000, `filter panel option payload should stay under 75KB, got ${serializedBytes}`);
assert.ok(groups.some((group) => group.name === "area"), "expected area filters");
assert.ok(groups.some((group) => group.name === "category"), "expected category filters");
assert.ok(
  fs.statSync(listingSearchRecordsJsonPath).size < fs.statSync(listingsJsonPath).size,
  "browser search records should be smaller than full listing records"
);
assert.ok(fs.existsSync(listingFilterCountsJsonPath), "directory imports should generate compact listing filter counts");
assert.ok(
  fs.statSync(listingFilterCountsJsonPath).size < 100_000,
  "listing filter counts should remain a compact client-safe route index"
);

const listingFilterCountsSource = fs.readFileSync(listingFilterCountsSourcePath, "utf8");
assert.doesNotMatch(
  listingFilterCountsSource,
  /@\/data\/listings|data\/listings\.json/,
  "listing filter counts should not pull the full listing dataset into client route-link code"
);
assert.match(
  listingFilterCountsSource,
  /listing-filter-counts\.json/,
  "listing filter counts should consume the compact generated route index"
);

console.log("listings payload tests passed");
