import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const listingsViewSource = fs.readFileSync(path.join(root, "src", "components", "DirectoryListingsView.tsx"), "utf8");
const seoLandingSource = fs.readFileSync(path.join(root, "src", "components", "SeoLandingPageContent.tsx"), "utf8");
const seoResultsShellSource = fs.readFileSync(path.join(root, "src", "components", "SeoLandingResultsShell.tsx"), "utf8");
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
assert.match(responsiveFiltersSource, /useModalDialog/, "mobile filter screen should use shared modal focus management");
assert.match(responsiveFiltersSource, /createPortal\(/, "mobile filter screen should render at page level for safe background isolation");
assert.match(responsiveFiltersSource, /ref=\{mobileTriggerRef\}/, "mobile filter trigger should support focus restoration");
assert.match(responsiveFiltersSource, /ref=\{mobileCloseRef\}/, "mobile filter screen should move focus to its close control");
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
assert.match(
  listingsViewSource,
  /grid-cols-\[minmax\(0,1fr\)\][^\"]*lg:grid-cols-\[280px_minmax\(0,1fr\)\]/,
  "directory result grids should use a shrink-safe mobile track without changing the desktop columns"
);
assert.match(
  seoLandingSource,
  /id="seo-landing-server-results"[^>]*grid-cols-\[minmax\(0,1fr\)\][^\"]*lg:grid-cols-\[280px_minmax\(0,1fr\)\]/,
  "server-rendered SEO results should use a shrink-safe mobile track"
);
assert.match(
  seoResultsShellSource,
  /id="seo-landing-client-results"[^>]*grid-cols-\[minmax\(0,1fr\)\][^\"]*lg:grid-cols-\[280px_minmax\(0,1fr\)\]/,
  "query-enhanced SEO results should use the same shrink-safe mobile track"
);
assert.match(
  responsiveFiltersSource,
  /aria-label="Directory filters" className="min-w-0 max-w-full lg:hidden"/,
  "mobile filter workspace should be allowed to shrink within the 320px content column"
);
assert.match(
  responsiveFiltersSource,
  /mt-4 flex min-w-0 w-full max-w-full justify-center[\s\S]*placement="320x50"/,
  "mobile filter advertising should be constrained to the available content width"
);
assert.doesNotMatch(
  listingsViewSource + seoLandingSource + responsiveFiltersSource,
  /overflow-x-hidden|overflow-x:\s*hidden/,
  "reflow fixes should not hide document overflow"
);

console.log("responsive directory filters tests passed");
