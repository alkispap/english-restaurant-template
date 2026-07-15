import assert from "node:assert/strict";
import Module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterListings, slugify } from "../src/lib/directory";
import { getDirectoryLandingModel } from "../src/lib/directory-landing";
import { getSeoLandingHiddenFilterGroups } from "../src/lib/seo-landing-filter-context";
import { getFacetSeoPage } from "../src/lib/seo-pages";
import { buildListingsPageHref } from "../src/lib/listings-page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;
const moduleWithLoad = Module as unknown as { _load: ModuleLoad };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
  if (request === "next/navigation") {
    return {
      usePathname: () => "/dietary/halal",
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
      useSearchParams: () => new URLSearchParams()
    };
  }

  return originalLoad(request, parent, isMain);
};

const dietaryCards = getDirectoryLandingModel().primaryNeeds.items;
const expectedSlugs = ["halal", "vegetarian", "vegan", "gluten-free"];
const expectedLabels = ["Halal", "Vegetarian", "Vegan", "Gluten-Free"];

assert.deepEqual(
  dietaryCards.map((card) => card.href),
  expectedSlugs.map((slug) => `/dietary/${slug}`),
  "homepage dietary cards should use dedicated dietary landing pages"
);

for (const [index, slug] of expectedSlugs.entries()) {
  const page = getFacetSeoPage("dietary", slug, {});
  const expectedListings = filterListings({ dietary: slug });
  const expectedListingSlugs = new Set(expectedListings.map((listing) => listing.slug));

  assert.ok(page, `expected a dedicated ${slug} page`);
  assert.equal(page.metadata.canonical, `/dietary/${slug}`);
  assert.equal(page.totalCount, expectedListings.length, `${slug} page should apply its dietary filter`);
  assert.equal(page.filterPanelValues.dietary, undefined, `${slug} route context should not leak into query controls`);
  assert.equal(page.filterPanelValues.sort, undefined, `${slug} implicit default sort should not leak into query controls`);
  assert.ok(
    page.listings.every((listing) => expectedListingSlugs.has(listing.slug)),
    `${slug} result cards should all come from the matching dietary result set`
  );
  assert.deepEqual(page.definingContext, {
    key: "dietary",
    slug,
    label: expectedLabels[index],
    navigation: {
      label: "Dietary options",
      items: expectedSlugs.map((itemSlug, itemIndex) => ({
        label: expectedLabels[itemIndex],
        href: `/dietary/${itemSlug}`
      })),
      allLabel: "All restaurants",
      allHref: "/restaurants/"
    }
  });
}

const halalListing = filterListings({ dietary: "halal" })[0];
assert.ok(halalListing?.area, "expected a Halal listing with an area for refinement coverage");
const refinedHalalPage = getFacetSeoPage("dietary", "halal", { area: slugify(halalListing.area) });
assert.ok(refinedHalalPage, "expected refined Halal page");
assert.equal(
  refinedHalalPage.totalCount,
  filterListings({ dietary: "halal", area: slugify(halalListing.area) }).length,
  "unrelated query filters should refine the fixed dietary result set"
);
assert.equal(refinedHalalPage.filterPanelValues.dietary, undefined);
assert.equal(refinedHalalPage.filterPanelValues.area, slugify(halalListing.area));
assert.equal(
  buildListingsPageHref(refinedHalalPage.linkValues, { area: undefined, page: undefined }),
  "/dietary/halal",
  "removing the final refinement should return to the clean dietary route"
);
assert.equal(refinedHalalPage.metadata.canonical, "/dietary/halal");
assert.equal(
  refinedHalalPage.metadata.robots && typeof refinedHalalPage.metadata.robots === "object"
    ? refinedHalalPage.metadata.robots.index
    : undefined,
  false,
  "refined query combinations should remain noindex"
);

const conflictingHalalPage = getFacetSeoPage("dietary", "halal", { dietary: "vegan" });
assert.ok(conflictingHalalPage, "expected conflicting-query Halal page model");
assert.equal(conflictingHalalPage.definingContext?.slug, "halal", "route dietary context should override query conflicts");
assert.equal(conflictingHalalPage.totalCount, filterListings({ dietary: "halal" }).length);

assert.deepEqual(
  getSeoLandingHiddenFilterGroups({ kind: "facet", definingContext: { key: "dietary" } }),
  ["dietary"],
  "dedicated dietary pages should hide the conflicting dietary filter group"
);
assert.deepEqual(getSeoLandingHiddenFilterGroups({ kind: "area" }), ["area"]);

async function dietaryPageRendersSwitcher() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const page = getFacetSeoPage("dietary", "halal", {});
  assert.ok(page, "expected rendered Halal page model");

  const html = renderToStaticMarkup(
    React.createElement(AccountProvider, null, React.createElement(SeoLandingPage, { page }))
  );

  assert.ok(html.includes('aria-label="Dietary options"'), "dietary page should render the dietary switcher");
  assert.ok(html.includes('aria-current="page"'), "current dietary option should expose selected semantics");
  for (const slug of expectedSlugs.filter((item) => item !== "halal")) {
    assert.ok(html.includes(`href="/dietary/${slug}"`), `switcher should link to ${slug}`);
  }
  assert.ok(html.includes('href="/restaurants"'), "switcher should provide an explicit route to all restaurants");
}

dietaryPageRendersSwitcher()
  .then(() => console.log("dedicated dietary page tests passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
