import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getPersistentFilterFields, getSelectedFilters } from "../src/components/FilterPanel";

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

function selectedFilterChipsUseLabelsAndHiddenGroups() {
  const filters = getSelectedFilters(
    {
      basePath: "/areas/ealing",
      q: "dosa",
      open: true,
      sort: "reviews",
      view: "map",
      page: 3,
      area: "ealing",
      category: ["south-indian", "biryani"],
      rating: "4"
    },
    [
      {
        name: "area",
        label: "Area",
        modalLabel: "Area",
        options: [{ label: "Ealing", value: "ealing" }],
        totalOptions: 1
      },
      {
        name: "category",
        label: "Cuisine",
        modalLabel: "Cuisine",
        options: [
          { label: "South Indian", value: "south-indian" },
          { label: "Biryani", value: "biryani" }
        ],
        totalOptions: 2
      },
      {
        name: "rating",
        label: "Minimum rating",
        modalLabel: "Minimum rating",
        options: [{ label: "4.0+", value: "4" }],
        totalOptions: 1
      }
    ],
    ["area"]
  );

  assert.deepEqual(
    filters.map((filter) => filter.label),
    ["Search: dosa", "Open now", "South Indian", "Biryani", "4.0+"],
    "selected filters should include search and open state, use option labels, and exclude hidden groups"
  );
  assert.ok(
    filters.every((filter) => filter.href.startsWith("/areas/ealing")),
    "selected filter links should preserve the current base path"
  );
  assert.ok(
    filters.some((filter) => filter.key === "category-south-indian"),
    "selected filter keys should include the filter group and selected value"
  );
  assert.ok(
    filters.find((filter) => filter.key === "search-query")?.href.includes("sort=reviews"),
    "removing the search chip should preserve sort state"
  );
  assert.ok(
    !filters.find((filter) => filter.key === "search-query")?.href.includes("q=dosa"),
    "removing the search chip should remove q"
  );
  assert.ok(
    !filters.find((filter) => filter.key === "open-now")?.href.includes("open=1"),
    "removing Open now should remove open state"
  );
}

selectedFilterChipsUseLabelsAndHiddenGroups();

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
assert.match(filterPanelSource, /Selected filters/, "selected summary should have a clear heading");
assert.match(filterPanelSource, /active/, "selected summary should show an active filter count");
assert.match(filterPanelSource, /q: undefined/, "clear all should remove search text");
assert.match(filterPanelSource, /open: undefined/, "clear all should remove Open now");
assert.match(listingsViewSource, /ResponsiveDirectoryFilters/, "listings view should render filters through the responsive filter wrapper");
assert.match(responsiveFiltersSource, /max-h-\[calc\(100vh-6rem\)\]/, "desktop filters should have a viewport-bounded scroll area");
assert.match(responsiveFiltersSource, /overflow-y-auto/, "desktop filters should scroll internally under the mouse");

console.log("filter panel state tests passed");
