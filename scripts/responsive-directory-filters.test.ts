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

console.log("responsive directory filters tests passed");
