import assert from "node:assert/strict";
import Module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { featuredDiningHubs } from "../src/config/featured-dining-hubs";
import { filterListings, slugify } from "../src/lib/directory";
import { getDirectoryLandingModel } from "../src/lib/directory-landing";
import {
  getSeoLandingHiddenFilterGroups,
  getSeoLandingPresentationValues
} from "../src/lib/seo-landing-filter-context";
import { getNeighborhoodSeoPage } from "../src/lib/seo-pages";
import { buildListingsPageHref } from "../src/lib/listings-page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;
const moduleWithLoad = Module as unknown as { _load: ModuleLoad };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
  if (request === "next/navigation") {
    return {
      usePathname: () => "/neighborhoods/southall",
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
      useSearchParams: () => new URLSearchParams()
    };
  }

  return originalLoad(request, parent, isMain);
};

const expectedCounts = new Map([
  ["southall", 82],
  ["wembley", 61],
  ["harrow", 43],
  ["tooting", 36],
  ["brick-lane", 12]
]);
const homepageHubs = getDirectoryLandingModel().diningHubs.items;

assert.deepEqual(
  homepageHubs.map((hub) => hub.href),
  featuredDiningHubs.map((hub) => `/neighborhoods/${hub.slug}`),
  "homepage and dedicated pages should share the featured dining hub taxonomy"
);

for (const hub of featuredDiningHubs) {
  const page = getNeighborhoodSeoPage(hub.slug, {});
  const matchingListings = filterListings({ neighborhood: hub.slug });
  const matchingSlugs = new Set(matchingListings.map((listing) => listing.slug));

  assert.ok(page, `expected ${hub.title} neighborhood page`);
  assert.equal(matchingListings.length, expectedCounts.get(hub.slug), `${hub.title} fixture count should remain intentional`);
  assert.equal(page.totalCount, matchingListings.length);
  assert.ok(page.listings.every((listing) => matchingSlugs.has(listing.slug)));
  assert.equal(page.filterPanelValues.neighborhood, undefined, "locked neighborhood should not appear as a query filter");
  assert.equal(page.filterPanelValues.sort, undefined, "implicit neighborhood sort should not appear in generated links");
  assert.deepEqual(page.definingContext, {
    key: "neighborhood",
    slug: hub.slug,
    label: hub.title,
    navigation: {
      label: "Dining hubs",
      items: featuredDiningHubs.map((item) => ({ label: item.title, href: `/neighborhoods/${item.slug}` })),
      allLabel: "All restaurants",
      allHref: "/restaurants/"
    }
  });
}

const southallListings = filterListings({ neighborhood: "southall" });
const splitCategory = [...new Set(southallListings.flatMap((listing) => listing.categories))]
  .map((category) => ({
    category,
    count: filterListings({ neighborhood: "southall", category: slugify(category) }).length
  }))
  .find((item) => item.count > 0 && item.count < southallListings.length);
assert.ok(splitCategory, "expected a category that narrows Southall results");

const refinedSouthall = getNeighborhoodSeoPage("southall", { category: slugify(splitCategory.category) });
assert.ok(refinedSouthall, "expected refined Southall page");
assert.equal(refinedSouthall.totalCount, splitCategory.count);
assert.equal(refinedSouthall.linkValues.category, slugify(splitCategory.category));
assert.equal(refinedSouthall.linkValues.neighborhood, undefined);
assert.equal(refinedSouthall.linkValues.sort, undefined);
assert.equal(
  buildListingsPageHref(refinedSouthall.linkValues, { category: undefined, page: undefined }),
  "/neighborhoods/southall",
  "removing the final refinement should return to the clean hub route"
);

const conflictingSouthall = getNeighborhoodSeoPage("southall", { neighborhood: "wembley" });
assert.ok(conflictingSouthall, "expected conflicting-query Southall model");
assert.equal(conflictingSouthall.definingContext?.slug, "southall");
assert.equal(conflictingSouthall.totalCount, southallListings.length, "route context should override neighborhood query conflicts");

assert.deepEqual(
  getSeoLandingHiddenFilterGroups({ kind: "neighborhood", definingContext: { key: "neighborhood" } }),
  ["neighborhood"]
);
assert.deepEqual(
  getSeoLandingPresentationValues(
    { basePath: "/neighborhoods/southall", neighborhood: "southall", category: "indian", sort: "rating" },
    "neighborhood",
    false
  ),
  { basePath: "/neighborhoods/southall", neighborhood: undefined, category: "indian", sort: undefined }
);

const nonFeaturedNeighborhood = getNeighborhoodSeoPage("soho", {});
assert.equal(nonFeaturedNeighborhood?.definingContext, undefined, "non-featured neighborhoods should remain unchanged");

async function diningHubPageRendersSwitcher() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const page = getNeighborhoodSeoPage("southall", {});
  assert.ok(page, "expected rendered Southall page model");

  const html = renderToStaticMarkup(
    React.createElement(AccountProvider, null, React.createElement(SeoLandingPage, { page }))
  );

  assert.ok(html.includes('aria-label="Dining hubs"'));
  assert.ok(html.includes('aria-current="page"'));
  for (const hub of featuredDiningHubs.filter((item) => item.slug !== "southall")) {
    assert.ok(html.includes(`href="/neighborhoods/${hub.slug}"`), `switcher should link to ${hub.title}`);
  }
  assert.ok(html.includes('href="/restaurants"'));
}

diningHubPageRendersSwitcher()
  .then(() => console.log("dedicated dining hub page tests passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
