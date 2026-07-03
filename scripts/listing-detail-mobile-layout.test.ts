import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/restaurants/[slug]/page.tsx"), "utf8");
const mobileChromePath = path.join(process.cwd(), "src/components/ListingDetailMobileChrome.tsx");

assert.ok(
  fs.existsSync(mobileChromePath),
  "restaurant detail pages should use a dedicated mobile TripAdvisor-style chrome component"
);

const mobileChromeSource = fs.existsSync(mobileChromePath) ? fs.readFileSync(mobileChromePath, "utf8") : "";

assert.match(
  pageSource,
  /<ListingDetailMobileChrome[\s\S]*listing=\{listing\}[\s\S]*tabs=\{tabs\}/,
  "restaurant detail page should render the mobile detail chrome with listing and tabs"
);
assert.match(
  mobileChromeSource,
  /See all restaurants in/,
  "mobile sticky bar should include the TripAdvisor-style area backlink copy"
);
assert.match(
  mobileChromeSource,
  /areaPath\(slugify\(listing\.area\)\)/,
  "mobile area backlink should use the clean area page route when an area exists"
);
assert.doesNotMatch(
  mobileChromeSource,
  /from "@\/lib\/directory"/,
  "mobile detail chrome should not import the heavy directory module"
);
assert.match(
  mobileChromeSource,
  /from "@\/lib\/slug"/,
  "mobile detail chrome should import slugify from the lightweight slug helper"
);
assert.match(
  mobileChromeSource,
  /directoryIndexPath\(\)/,
  "mobile area backlink should fall back to the directory index when area is missing"
);
assert.match(
  mobileChromeSource,
  /SaveListingButton[\s\S]*compact/,
  "mobile sticky bar should expose a compact save action"
);
assert.match(
  mobileChromeSource,
  /ShareButton[\s\S]*className=\{[^}]*compactShareClassName/,
  "mobile sticky bar should expose a compact share action"
);
assert.match(
  mobileChromeSource,
  /window\.scrollY\s*>\s*140/,
  "mobile sticky area bar should appear only after the user scrolls past the hero area"
);
assert.match(
  mobileChromeSource,
  /md:hidden/,
  "mobile TripAdvisor-style chrome should be hidden on tablet and desktop layouts"
);
assert.match(
  pageSource,
  /<section id="mobile-at-a-glance"/,
  "restaurant detail page should render a mobile At a glance section"
);
assert.match(
  pageSource,
  /<section id="mobile-location"/,
  "restaurant detail page should render a mobile Location section"
);

console.log("listing detail mobile layout tests passed");
