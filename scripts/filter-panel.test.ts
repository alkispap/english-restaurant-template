import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

const filterPanelSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "FilterPanel.tsx"), "utf8");
const listingsViewSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "DirectoryListingsView.tsx"), "utf8");

assert.doesNotMatch(filterPanelSource, /Apply filters/, "filter panel should not render a manual Apply filters button");
assert.match(filterPanelSource, /onChange=\{\([^)]*\)\s*=>\s*applySelectFilter/, "rating select should auto-apply on change");
assert.match(filterPanelSource, /window\.history\.pushState/, "rating select should update the URL without a full navigation");
assert.match(filterPanelSource, /directory-url-change/, "rating select should notify the listings query enhancer");
assert.match(listingsViewSource, /max-h-\[calc\(100vh-6rem\)\]/, "desktop filters should have a viewport-bounded scroll area");
assert.match(listingsViewSource, /overflow-y-auto/, "desktop filters should scroll internally under the mouse");

console.log("filter panel state tests passed");
