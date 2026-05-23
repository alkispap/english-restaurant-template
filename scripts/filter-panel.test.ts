import assert from "node:assert/strict";
import { getPersistentFilterFields } from "../src/components/FilterPanel";

function filterPanelPreservesNonCheckboxState() {
  const fields = getPersistentFilterFields({
    basePath: "/best/best-rated",
    q: "dosa",
    sort: "reviews",
    open: true,
    view: "map",
    category: "indian"
  });

  assert.deepEqual(fields, [
    { name: "q", value: "dosa" },
    { name: "sort", value: "reviews" },
    { name: "open", value: "1" },
    { name: "view", value: "map" }
  ]);
}

filterPanelPreservesNonCheckboxState();

console.log("filter panel state tests passed");
