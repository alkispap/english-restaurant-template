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
  const viewSource = source("src", "components", "DirectoryListingsView.tsx");
  const heroImageStart = viewSource.indexOf(`src={siteConfig.heroImage}`);
  assert.ok(heroImageStart >= 0, "homepage hero image should use the configured hero image");

  const heroImageMarkup = viewSource.slice(heroImageStart, heroImageStart + 500);
  assert.match(heroImageMarkup, /width=\{\d+\}/, "homepage hero image should declare an intrinsic width");
  assert.match(heroImageMarkup, /height=\{\d+\}/, "homepage hero image should declare an intrinsic height");
  assert.match(heroImageMarkup, /loading="eager"/, "homepage hero image should load eagerly");
  assert.match(heroImageMarkup, /fetchPriority="high"/, "homepage hero image should remain high priority");
}

function cleanHomepageDoesNotHydrateDirectoryModel() {
  const pageSource = source("src", "components", "DirectoryListingsPage.tsx");
  const enhancerStart = pageSource.indexOf("<DirectoryListingsQueryEnhancer");
  assert.ok(enhancerStart >= 0, "directory listings page should still support query enhancement");

  const enhancerMarkup = pageSource.slice(Math.max(0, enhancerStart - 300), enhancerStart + 300);
  assert.match(
    enhancerMarkup,
    /model\.searchQuery/,
    "query enhancer should only mount when a query state exists, not on the clean homepage"
  );
}

function searchBarUsesCompactAreaCentroids() {
  const searchBarSource = source("src", "components", "SearchBar.tsx");
  const searchClientSource = source("src", "components", "SearchBarClient.tsx");

  assert.doesNotMatch(searchBarSource, /mapPoints:/, "SearchBar should not require full map point props");
  assert.doesNotMatch(searchBarSource, /<SearchBarClient/, "first-paint SearchBar should render server HTML");
  assert.match(searchBarSource, /areaCentroids/, "SearchBar should pass compact area centroids to geolocation only");
  assert.doesNotMatch(searchClientSource, /mapPoints:/, "SearchBarClient should not require full map point props");
}

function homepageRowsUseListingSummaries() {
  const listingSearchSource = source("src", "lib", "listing-search.ts");

  assert.match(
    listingSearchSource,
    /toListingResultSummary/,
    "homepage listing rows should compact full search records before rendering client carousel cards"
  );
}

homepagePreloadsResponsiveHeroImages();
homepageHeroImageIsLcpFriendly();
cleanHomepageDoesNotHydrateDirectoryModel();
searchBarUsesCompactAreaCentroids();
homepageRowsUseListingSummaries();

console.log("homepage LCP payload tests passed");
