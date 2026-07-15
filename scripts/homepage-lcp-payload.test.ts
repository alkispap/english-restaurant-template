import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function source(...segments: string[]) {
  return fs.readFileSync(path.join(root, ...segments), "utf8");
}

function homepagePreloadsResponsiveHeroImages() {
  const pageSource = source("src", "app", "page.tsx");

  assert.match(pageSource, /rel="preload"/, "homepage should preload the hero image");
  assert.match(pageSource, /siteConfig\.heroImageMobile/, "homepage should preload the mobile hero image");
  assert.match(pageSource, /siteConfig\.heroImage/, "homepage should preload the desktop hero image");
  assert.match(pageSource, /media="\([^"]*max-width: 639px\)"/, "mobile hero preload should be media-scoped");
  assert.match(pageSource, /media="\([^"]*min-width: 640px\)"/, "desktop hero preload should be media-scoped");
}

function homepageHeroImageIsLcpFriendly() {
  const viewSource = source("src", "components", "DirectoryLandingPage.tsx");
  const heroImageStart = viewSource.indexOf(`src={siteConfig.heroImage}`);
  assert.ok(heroImageStart >= 0, "homepage hero image should use the configured hero image");

  const heroImageMarkup = viewSource.slice(heroImageStart, heroImageStart + 500);
  assert.match(heroImageMarkup, /width=\{\d+\}/, "homepage hero image should declare an intrinsic width");
  assert.match(heroImageMarkup, /height=\{\d+\}/, "homepage hero image should declare an intrinsic height");
  assert.match(heroImageMarkup, /loading="eager"/, "homepage hero image should load eagerly");
  assert.match(heroImageMarkup, /fetchPriority="high"/, "homepage hero image should remain high priority");
}

function cleanHomepageDoesNotHydrateDirectoryModel() {
  const homepageSource = source("src", "app", "page.tsx");
  const listingsPageSource = source("src", "components", "DirectoryListingsPage.tsx");

  assert.match(homepageSource, /<DirectoryLandingPage \/>/, "homepage should use its static landing-page renderer");
  assert.doesNotMatch(
    homepageSource,
    /DirectoryListingsPage|DirectoryListingsQueryEnhancer/,
    "clean homepage should not mount or hydrate directory query results"
  );
  assert.doesNotMatch(
    listingsPageSource,
    /initialModel=\{model\}/,
    "directory query enhancer should not serialize the full listings model across the client boundary"
  );
}

function searchBarUsesCompactAreaCentroids() {
  const searchBarSource = source("src", "components", "SearchBar.tsx");
  const locateAreaSource = source("src", "components", "LocateAreaButton.tsx");

  assert.doesNotMatch(searchBarSource, /mapPoints:/, "SearchBar should not require full map point props");
  assert.doesNotMatch(searchBarSource, /<SearchBarClient/, "first-paint SearchBar should render server HTML");
  assert.match(searchBarSource, /areaCentroids/, "SearchBar should pass compact area centroids to geolocation only");
  assert.doesNotMatch(locateAreaSource, /mapPoints:/, "geolocation should not require full map point props");
}

function homepageRowsUseListingSummaries() {
  const listingSearchSource = source("src", "lib", "listing-search.ts");

  assert.match(
    listingSearchSource,
    /toListingResultSummary/,
    "homepage listing rows should compact full search records before rendering client carousel cards"
  );
}

function listingRowsAvoidMobileCarouselLcpSuppression() {
  const rowSectionSource = source("src", "components", "ListingRowSection.tsx");

  assert.doesNotMatch(
    rowSectionSource,
    /overflow-x-auto scroll-smooth px-4 pb-3 pt-4/,
    "mobile listing carousels should avoid the px-4 shorthand that suppresses Lighthouse LCP detection"
  );
  assert.match(
    rowSectionSource,
    /overflow-x-auto scroll-smooth pl-4 pr-4 pb-3 pt-4/,
    "mobile listing carousels should keep their spacing with split left/right padding utilities"
  );
}

function buildRemovesTailwindGlobalScrollSnapStrictness() {
  const postcssSource = source("postcss.config.mjs");
  const postcssPluginSource = source("scripts", "postcss-remove-tailwind-global-scroll-snap-strictness.cjs");

  assert.match(
    postcssSource,
    /remove-tailwind-global-scroll-snap-strictness/,
    "build should remove Tailwind's global scroll-snap strictness variable because it suppresses Chrome LCP detection"
  );
  assert.match(
    postcssPluginSource,
    /--tw-scroll-snap-strictness/,
    "the PostCSS patch should target the exact Tailwind scroll-snap custom property"
  );
}

homepagePreloadsResponsiveHeroImages();
homepageHeroImageIsLcpFriendly();
cleanHomepageDoesNotHydrateDirectoryModel();
searchBarUsesCompactAreaCentroids();
homepageRowsUseListingSummaries();
listingRowsAvoidMobileCarouselLcpSuppression();
buildRemovesTailwindGlobalScrollSnapStrictness();

console.log("homepage LCP payload tests passed");
