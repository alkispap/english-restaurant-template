import assert from "node:assert/strict";
import { listings } from "../src/data/listings";
import {
  getDirectoryHomeListingRows,
  getDirectoryHomeSections,
  getDirectoryListingsPageRows,
  getDirectorySidebarBlocks,
  getRecentlyAddedShortcutLinks,
  getShortcutLinksForSource
} from "../src/lib/directory-ux";

function homeSectionsResolveFromConfigAndSkipDisabledSections() {
  const sections = getDirectoryHomeSections([
    { id: "popular-searches", title: "Popular", source: "popularSearches", enabled: true, limit: 2 },
    { id: "recently-added", title: "Recent", source: "recentListings", enabled: false, limit: 2 },
    { id: "top-areas", title: "Areas", source: "topAreas", enabled: true, limit: 3 }
  ]);

  assert.deepEqual(sections.map((section) => section.id), ["popular-searches", "top-areas"]);
  assert.equal(sections[0].links.length, 2);
  assert.equal(sections[1].links.length, 3);
  assert.ok(sections.every((section) => !section.title.includes("{")));
}

function sidebarBlocksGenerateUsefulLinks() {
  const blocks = getDirectorySidebarBlocks([
    { id: "popular-searches", title: "Popular searches", source: "popularSearches", enabled: true, limit: 3 },
    { id: "top-categories", title: "Top {categoryPluralLabel}", source: "topCategories", enabled: true, limit: 4 },
    { id: "disabled", title: "Disabled", source: "topAreas", enabled: false, limit: 4 }
  ]);

  assert.deepEqual(blocks.map((block) => block.id), ["popular-searches", "top-categories"]);
  assert.ok(blocks.flatMap((block) => block.links).some((link) => link.href.startsWith("/best/")));
  assert.ok(blocks.flatMap((block) => block.links).some((link) => link.href.startsWith("/categories/")));
  assert.ok(blocks.every((block) => !block.title.includes("{")));
}

function recentlyAddedUsesImportedListingOrder() {
  const links = getRecentlyAddedShortcutLinks(3);

  assert.deepEqual(
    links.map((link) => link.href),
    listings.slice(0, 3).map((listing) => `/listings/${listing.slug}`)
  );
}

function shortcutSourcesReturnLinks() {
  assert.ok(getShortcutLinksForSource("popularSearches", 2).every((link) => link.href.startsWith("/best/")));
  assert.ok(getShortcutLinksForSource("openNow", 1).every((link) => link.href.includes("open=1")));
  assert.ok(getShortcutLinksForSource("transport", 2).every((link) => /[?&](tube|bus)=/.test(link.href)));
  assert.ok(getShortcutLinksForSource("listingTypes", 2).every((link) => link.href.startsWith("/types/")));
}

function topNeighborhoodsUseMostListingCounts() {
  const expectedTopNeighborhood = Array.from(
    listings.reduce((counts, listing) => {
      if (!listing.neighborhood) return counts;
      counts.set(listing.neighborhood, (counts.get(listing.neighborhood) ?? 0) + 1);
      return counts;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const [topNeighborhood] = getShortcutLinksForSource("topNeighborhoods", 1);

  assert.ok(expectedTopNeighborhood, "expected imported listings to include neighborhoods");
  assert.equal(topNeighborhood.label, expectedTopNeighborhood[0]);
  assert.equal(topNeighborhood.count, expectedTopNeighborhood[1]);
  assert.ok(Number(topNeighborhood.count) > 1, "top neighborhood should reflect real listing counts");
}

function defaultHomepageSeparatesListingRowsFromLinkSections() {
  const listingRows = getDirectoryHomeListingRows();
  const linkSections = getDirectoryHomeSections();

  assert.deepEqual(
    listingRows.map((row) => row.id),
    ["local-eats", "budget-friendly", "highly-rated", "recently-added"]
  );
  assert.ok(listingRows.every((row) => row.listings.length > 0));
  assert.ok(listingRows.every((row) => row.seeAllHref));
  assert.ok(!linkSections.some((section) => ["open-now", "dining-needs", "popular-searches"].includes(section.id)));
}

function homepageListingRowsResolveExpectedUrlsAndListings() {
  const rows = getDirectoryHomeListingRows();
  const budget = rows.find((row) => row.id === "budget-friendly");
  const rated = rows.find((row) => row.id === "highly-rated");
  const recent = rows.find((row) => row.id === "recently-added");

  assert.equal(budget?.seeAllHref, "/?sort=price");
  assert.equal(rated?.seeAllHref, "/?sort=rating");
  assert.deepEqual(
    recent?.listings.slice(0, 3).map((listing) => listing.slug),
    listings.slice(0, 3).map((listing) => listing.slug)
  );
}

function listingsPageRowsAvoidCurrentResultSetWhenPossible() {
  const current = listings.slice(0, 12);
  const rows = getDirectoryListingsPageRows(current);
  const currentSlugs = new Set(current.map((listing) => listing.slug));

  assert.deepEqual(rows.map((row) => row.id), ["local-eats", "budget-friendly"]);
  assert.ok(rows.every((row) => row.seeAllHref));
  assert.ok(rows.some((row) => row.listings.some((listing) => !currentSlugs.has(listing.slug))));
}

homeSectionsResolveFromConfigAndSkipDisabledSections();
sidebarBlocksGenerateUsefulLinks();
recentlyAddedUsesImportedListingOrder();
shortcutSourcesReturnLinks();
topNeighborhoodsUseMostListingCounts();
defaultHomepageSeparatesListingRowsFromLinkSections();
homepageListingRowsResolveExpectedUrlsAndListings();
listingsPageRowsAvoidCurrentResultSetWhenPossible();

console.log("directory UX behavior tests passed");
