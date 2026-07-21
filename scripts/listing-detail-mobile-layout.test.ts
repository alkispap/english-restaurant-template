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
  /<ListingDetailMobileChrome[\s\S]*listing=\{mobileChromeListing\}[\s\S]*tabs=\{tabs\}/,
  "restaurant detail page should render the mobile detail chrome with compact listing props and tabs"
);
assert.match(
  pageSource,
  /mobileChromeListingFromListing\(listing\)/,
  "restaurant detail page should map the full listing to compact mobile chrome props"
);
assert.ok(
  !pageSource.includes("<ListingDetailMobileChrome listing={listing}"),
  "restaurant detail page should not pass the full listing object into mobile chrome"
);
assert.doesNotMatch(
  mobileChromeSource,
  /listing: Listing/,
  "mobile chrome props should not accept the full Listing type"
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
  /inert=\{!showStickyAreaBar\}/,
  "mobile sticky area bar controls should not remain focusable while the bar is off-screen"
);
assert.match(
  mobileChromeSource,
  /aria-hidden=\{!showStickyAreaBar\}/,
  "mobile sticky area bar should leave the accessibility tree while it is off-screen"
);
assert.match(
  mobileChromeSource,
  /inert=\{showStickyAreaBar\}/,
  "original mobile actions should not duplicate sticky keyboard stops after scrolling"
);
assert.match(
  mobileChromeSource,
  /md:hidden/,
  "mobile TripAdvisor-style chrome should be hidden on tablet and desktop layouts"
);
assert.equal(
  countOccurrences(pageSource, "<h1"),
  1,
  "restaurant detail pages should retain one semantic H1"
);
assert.match(
  pageSource,
  /<h1 className="sr-only text-4xl font-bold text-ink md:not-sr-only md:block">\{headings\.h1\}<\/h1>/,
  "the restaurant H1 should remain in the mobile accessibility tree while retaining the desktop layout"
);
assert.match(
  mobileChromeSource,
  /<p aria-hidden="true" className="mt-5 text-\[2rem\]/,
  "the mirrored visual mobile title should not duplicate the semantic H1 for assistive technology"
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

function countOccurrences(value: string, pattern: string) {
  return value.split(pattern).length - 1;
}

console.log("listing detail mobile layout tests passed");
