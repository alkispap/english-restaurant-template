import assert from "node:assert/strict";
import { getFilterPanelOptionGroups } from "../src/lib/filter-panel-options";
import { filterListingSearchRecords } from "../src/lib/listing-search";

const priceGroup = getFilterPanelOptionGroups().find((group) => group.name === "price");

assert.ok(priceGroup, "price filter group should be available");
assert.ok(priceGroup.options.length > 0, "price filter should expose selectable options");

priceGroup.options.forEach((option) => {
  const results = filterListingSearchRecords({ price: option.value });
  assert.ok(
    results.length > 0,
    `price filter value "${option.value}" (${option.label}) should return matching listings`
  );
});

console.log("listing price filter tests passed");
