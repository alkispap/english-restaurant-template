import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const listingsViewSource = fs.readFileSync(path.join(root, "src", "components", "DirectoryListingsView.tsx"), "utf8");
const responsiveFiltersPath = path.join(root, "src", "components", "ResponsiveDirectoryFilters.tsx");

assert.ok(fs.existsSync(responsiveFiltersPath), "directory listings should have a responsive filter wrapper");
assert.match(listingsViewSource, /ResponsiveDirectoryFilters/, "listings view should delegate filter rendering to the responsive wrapper");
assert.doesNotMatch(
  listingsViewSource,
  /<FilterPanel[\s\S]*<FilterPanel/,
  "listings view should not mount separate mobile and desktop FilterPanel trees"
);

const responsiveFiltersSource = fs.readFileSync(responsiveFiltersPath, "utf8");

assert.match(responsiveFiltersSource, /"use client"/, "responsive filter wrapper should choose the active filter UI on the client");
assert.match(responsiveFiltersSource, /matchMedia\("\(min-width: 1024px\)"\)/, "responsive filter wrapper should use the lg breakpoint");
assert.match(responsiveFiltersSource, /FilterPanel/, "responsive filter wrapper should still render the existing filter panel");
assert.match(responsiveFiltersSource, /DirectorySidebar/, "desktop filter wrapper should keep the directory sidebar");
assert.match(responsiveFiltersSource, /useState\(false\)/, "mobile filters should track whether the details panel is open");
assert.doesNotMatch(responsiveFiltersSource, /<details/, "mobile filters should not use a dropdown details element");
assert.doesNotMatch(responsiveFiltersSource, /onToggle=\{handleMobileFiltersToggle\}/, "mobile filters should not depend on details toggle state");
assert.match(responsiveFiltersSource, /aria-expanded=\{mobileFiltersOpen\}/, "mobile filter trigger should expose its open state");
assert.match(responsiveFiltersSource, /role="dialog"/, "open mobile filters should render as a dialog-style screen");
assert.match(responsiveFiltersSource, /aria-modal="true"/, "mobile filter screen should be modal for assistive technology");
assert.match(responsiveFiltersSource, /fixed inset-0 z-50/, "mobile filter screen should cover the viewport");
assert.match(responsiveFiltersSource, /Show results/, "mobile filter screen should include a Show results close button");
assert.match(responsiveFiltersSource, /sticky bottom-0/, "Show results should stay visible at the bottom of the filter screen");
assert.match(responsiveFiltersSource, /document\.body\.style\.overflow/, "mobile filter screen should lock page scroll while open");
assert.match(responsiveFiltersSource, /event\.key === "Escape"/, "mobile filter screen should close on Escape");
assert.match(
  responsiveFiltersSource,
  /!mobileFiltersOpen[\s\S]*SelectedFilterChips/,
  "collapsed mobile filters should render selected chips outside the filter panel"
);
assert.match(
  responsiveFiltersSource,
  /getSelectedFilters\(model\.filterPanelValues, model\.filterOptionGroups, hiddenGroups\)/,
  "outside selected chips should respect the same hidden groups as the filter panel"
);

console.log("responsive directory filters tests passed");
