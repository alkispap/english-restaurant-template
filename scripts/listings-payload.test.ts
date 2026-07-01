import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";

const groups = getFilterPanelOptionGroups();
const serializedBytes = Buffer.byteLength(JSON.stringify(groups), "utf8");
const root = process.cwd();
const listingsJsonPath = path.join(root, "data", "listings.json");
const listingSearchRecordsJsonPath = path.join(root, "data", "listing-search-records.json");

assert.ok(serializedBytes < 75_000, `filter panel option payload should stay under 75KB, got ${serializedBytes}`);
assert.ok(groups.some((group) => group.name === "area"), "expected area filters");
assert.ok(groups.some((group) => group.name === "category"), "expected category filters");
assert.ok(
  fs.statSync(listingSearchRecordsJsonPath).size < fs.statSync(listingsJsonPath).size,
  "browser search records should be smaller than full listing records"
);

console.log("listings payload tests passed");
