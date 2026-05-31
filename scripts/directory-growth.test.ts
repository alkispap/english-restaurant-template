import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { directoryConfig } from "../src/config/directory";
import {
  getAreaCategoryCombinations,
  getFooterGroups,
  getListingExploreLinks,
  getListingsByAreaAndCategory,
  getPopularSearchBySlug,
  getPopularSearchResults,
  getPopularSearches,
  getRatingFilterOptions,
  resolveDirectoryTemplate
} from "../src/lib/directory-growth";
import { areaCategoryPath, popularSearchPath } from "../src/lib/routes";
import { listings } from "../src/data/listings";

function popularSearchesResolveLabelsAndFilters() {
  const searches = getPopularSearches();
  const first = searches[0];

  assert.ok(first, "expected at least one configured popular search");
  assert.equal(first.href, popularSearchPath(first.slug));
  assert.ok(!first.title.includes("{"), "title placeholders should be resolved");
  assert.ok(!first.description.includes("{"), "description placeholders should be resolved");

  const configured = getPopularSearchBySlug(first.slug);
  assert.equal(configured?.slug, first.slug);

  const results = getPopularSearchResults(first.slug);
  assert.ok(Array.isArray(results));
  assert.ok(results.length > 0, "expected the first preset to match imported listings");
  assert.equal(getPopularSearchBySlug("missing-search"), undefined);
  assert.deepEqual(getPopularSearchResults("missing-search"), []);
}

function popularSearchesAcceptAdditionalFilters() {
  const allBestRated = getPopularSearchResults("best-rated");
  const redbridgeBestRated = getPopularSearchResults("best-rated", { area: "redbridge" });

  assert.ok(allBestRated.length > redbridgeBestRated.length);
  assert.ok(redbridgeBestRated.length > 0);
  assert.ok(redbridgeBestRated.every((listing) => listing.area === "Redbridge"));
}

function areaCategoryCombinationsRequireBothValues() {
  const combinations = getAreaCategoryCombinations();
  const first = combinations[0];

  assert.ok(first, "expected imported listings to produce area/category combinations");
  assert.equal(first.href, areaCategoryPath(first.areaSlug, first.categorySlug));

  const results = getListingsByAreaAndCategory(first.areaSlug, first.categorySlug);
  assert.ok(results.length > 0);
  assert.ok(results.every((listing) => listing.area === first.areaLabel));
  assert.ok(results.every((listing) => listing.categories.includes(first.categoryLabel)));

  assert.deepEqual(getListingsByAreaAndCategory("missing-area", first.categorySlug), []);
  assert.deepEqual(getListingsByAreaAndCategory(first.areaSlug, "missing-category"), []);
}

function footerGroupsGenerateMixedLinks() {
  const groups = getFooterGroups();
  const links = groups.flatMap((group) => group.links);

  assert.ok(groups.length >= 3, "expected grouped footer sections");
  assert.ok(links.some((link) => link.href === "/"));
  assert.ok(links.some((link) => link.href.startsWith("/best/")));
  assert.ok(links.some((link) => link.href.startsWith("/areas/")));
  assert.ok(links.every((link) => !link.label.includes("{")));
}

function ratingOptionsComeFromImportedListings() {
  const options = getRatingFilterOptions();

  assert.deepEqual(options.map((option) => option.label), ["5+", "4+", "3+", "2+", "1+"]);
  assert.deepEqual(options.map((option) => option.value), ["5", "4", "3", "2", "1"]);
}

function listingExploreLinksAreUsefulAndUnique() {
  const listing = listings.find((item) => item.area && item.categories.length && item.details?.serviceOptions?.length);
  assert.ok(listing, "expected a listing with area, category, and service data");

  const groups = getListingExploreLinks(listing);
  const links = groups.flatMap((group) => group.links);
  const hrefs = links.map((link) => link.href);

  assert.ok(links.some((link) => link.href.startsWith("/areas/")));
  assert.ok(links.some((link) => link.href.startsWith("/categories/")));
  assert.ok(links.some((link) => link.href.includes("/categories/") && link.href.startsWith("/areas/")));
  assert.ok(links.some((link) => link.href.startsWith("/services/")));
  assert.equal(new Set(hrefs).size, hrefs.length, "explore links should not contain duplicate hrefs");
  assert.ok(links.every((link) => !link.label.includes("{")));
  assert.ok(links.length >= 10, "listing detail pages should expose a broad set of internal links");
}

function sitemapIncludesGeneratedGrowthRoutes() {
  const urls = sitemap().map((entry) => entry.url);
  const popularSearch = directoryConfig.popularSearches[0];
  const combination = getAreaCategoryCombinations()[0];

  assert.ok(popularSearch, "expected at least one popular search config");
  assert.ok(combination, "expected at least one area/category combination");
  assert.ok(urls.some((url) => url.endsWith(popularSearchPath(popularSearch.slug))));
  assert.ok(urls.some((url) => url.endsWith(areaCategoryPath(combination.areaSlug, combination.categorySlug))));
}

function templateResolverUsesDirectoryLabels() {
  assert.equal(
    resolveDirectoryTemplate("{listingPluralLabel} in {cityOrRegion}"),
    `${directoryConfig.listingPluralLabel} in London`
  );
}

popularSearchesResolveLabelsAndFilters();
popularSearchesAcceptAdditionalFilters();
areaCategoryCombinationsRequireBothValues();
footerGroupsGenerateMixedLinks();
ratingOptionsComeFromImportedListings();
listingExploreLinksAreUsefulAndUnique();
sitemapIncludesGeneratedGrowthRoutes();
templateResolverUsesDirectoryLabels();

console.log("directory growth behavior tests passed");
