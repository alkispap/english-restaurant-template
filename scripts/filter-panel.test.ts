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
const responsiveFiltersSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "ResponsiveDirectoryFilters.tsx"), "utf8");

const topLevelPanelOrder = [
  'group("area")',
  'group("neighborhood")',
  'group("category")',
  'group("price")',
  'name="rating"',
  'group("dining")',
  'group("dietary")',
  'group("service")',
  "labels.advanced",
  "labels.transport"
];

topLevelPanelOrder.reduce((previousIndex, token) => {
  const nextIndex = filterPanelSource.indexOf(token);
  assert.notEqual(nextIndex, -1, `filter panel should include ${token}`);
  assert.ok(nextIndex > previousIndex, `${token} should appear after the previous Tripadvisor-style filter group`);
  return nextIndex;
}, -1);

const advancedSection = filterPanelSource.slice(
  filterPanelSource.indexOf("labels.advanced"),
  filterPanelSource.indexOf("labels.transport")
);

[
  'group("type")',
  'group("offering")',
  'group("highlight")',
  'group("popularFor")',
  'group("amenity")',
  'group("accessibility")',
  'group("atmosphere")',
  'group("crowd")',
  'group("planning")',
  'group("payment")',
  'group("children")',
  'group("parking")',
  'group("pets")'
].forEach((token) => {
  assert.match(advancedSection, new RegExp(token.replace(/[()"]/g, "\\$&")), `${token} should live inside More filters`);
});

assert.doesNotMatch(
  filterPanelSource.slice(0, filterPanelSource.indexOf("labels.advanced")),
  /group\("type"\)|group\("offering"\)|group\("highlight"\)|group\("popularFor"\)/,
  "secondary restaurant filters should not render before More filters"
);
assert.doesNotMatch(filterPanelSource, /Apply filters/, "filter panel should not render a manual Apply filters button");
assert.match(filterPanelSource, /onChange=\{\([^)]*\)\s*=>\s*applySelectFilter/, "rating select should auto-apply on change");
assert.match(filterPanelSource, /window\.history\.pushState/, "rating select should update the URL without a full navigation");
assert.doesNotMatch(filterPanelSource, /directory-url-change/, "rating select should not manually dispatch duplicate directory-url-change events");
assert.match(listingsViewSource, /ResponsiveDirectoryFilters/, "listings view should render filters through the responsive filter wrapper");
assert.match(responsiveFiltersSource, /max-h-\[calc\(100vh-6rem\)\]/, "desktop filters should have a viewport-bounded scroll area");
assert.match(responsiveFiltersSource, /overflow-y-auto/, "desktop filters should scroll internally under the mouse");

console.log("filter panel state tests passed");
