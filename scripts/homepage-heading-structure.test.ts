import assert from "node:assert/strict";
import Module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;

const moduleWithLoad = Module as unknown as { _load: ModuleLoad };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
  if (request === "next/navigation") {
    return {
      usePathname: () => "/",
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
      useSearchParams: () => new URLSearchParams()
    };
  }

  return originalLoad(request, parent, isMain);
};

function textFromTags(html: string, tag: "h1" | "h2" | "h3") {
  return Array.from(html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gis"))).map((match) =>
    match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  );
}

function countOccurrences(value: string, pattern: string) {
  return value.split(pattern).length - 1;
}

async function homepageUsesConversionFirstHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { DirectoryListingsPage } = await import("../src/components/DirectoryListingsPage");
  const { buildDirectoryListingsModel } = await import("../src/lib/directory-listings-model");
  const { homepageHeadings } = await import("../src/lib/homepage-headings");
  const model = buildDirectoryListingsModel({
    searchParams: {},
    basePath: "/",
    title: homepageHeadings.heroTitle,
    description: homepageHeadings.heroDescription
  });
  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(DirectoryListingsPage, {
        searchParams: {},
        basePath: "/",
        title: homepageHeadings.heroTitle,
        description: homepageHeadings.heroDescription
      })
    )
  );

  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");
  const h3s = textFromTags(html, "h3");

  assert.deepEqual(h1s, [homepageHeadings.heroTitle], "homepage should have one clear H1");
  assert.ok(html.includes('action="/restaurants"'), "homepage search form should send visitors to the restaurants search page");
  assert.ok(html.includes('href="/restaurants?open=1"'), "homepage should expose an Open now quick link");
  assert.ok(html.includes('href="/restaurants?sort=rating"'), "homepage should expose a Best rated quick link");
  assert.ok(html.includes('href="/services/takeaway"'), "homepage should expose a Takeaway discovery link");
  assert.ok(html.includes('href="/dietary/halal"'), "homepage should expose a Halal discovery link");
  assert.ok(!html.includes("Apply filters"), "clean homepage should not render the full filter panel");
  assert.ok(
    !h2s.includes(`3,187 ${homepageHeadings.resultsHeadingContext} Found`),
    "clean homepage should not render the full results heading"
  );

  assert.ok(h2s.includes("Popular ways to explore"), "homepage should include an image-led discovery section");
  assert.ok(h2s.includes("Popular restaurants to start with"), "homepage should include one compact listing row");
  assert.equal(
    countOccurrences(html, 'data-homepage-discovery-card="true"'),
    6,
    "homepage should render exactly six discovery cards"
  );
  assert.equal(model.homepageSeoGroups.length, 0, "clean homepage should not build the old SEO link payload");
  assert.equal(model.sourceContextGuide, null, "clean homepage should not build the old source-context payload");

  [
    "Best restaurant searches",
    "Recently added",
    "Useful shortcuts",
    "Local eats",
    "Budget-friendly",
    homepageHeadings.seoLinksTitle,
    homepageHeadings.sourceContextTitle,
    homepageHeadings.listingRowTitles.budgetFriendly
  ].forEach((genericHeading) => {
    assert.ok(!h2s.includes(genericHeading), `homepage should not render "${genericHeading}" as an H2`);
  });

  [
    "Browse by area",
    "Browse cuisines",
    "Takeaway",
    "Halal",
    "Vegetarian",
    "Best rated"
  ].forEach((heading) => {
    assert.ok(h3s.includes(heading), `homepage discovery cards should include "${heading}"`);
  });
}

async function restaurantsPageRendersFullSearchAndFilterWorkspace() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { DirectoryListingsPage } = await import("../src/components/DirectoryListingsPage");
  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(DirectoryListingsPage, {
        searchParams: {},
        basePath: "/restaurants"
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  assert.deepEqual(h1s, ["Find restaurants in London"], "restaurants page should have one clear H1");
  assert.ok(html.includes('action="/restaurants"'), "restaurants page search form should submit to /restaurants");
  assert.ok(html.includes('aria-label="Directory filters"'), "restaurants page should render the responsive filter workspace");
  assert.ok(!html.includes("Apply filters"), "restaurants page filters should auto-apply without a manual Apply button");
  assert.ok(h2s.includes("3,187 restaurants found"), "restaurants page should render the full results heading");
  assert.ok(html.includes("Open now"), "restaurants page should render the open-now control");
  assert.ok(html.includes('aria-label="List view"'), "restaurants page should render the list view control");
  assert.ok(html.includes('aria-label="Map view"'), "restaurants page should render the map view control");
}

homepageUsesConversionFirstHeadingOutline().then(() => restaurantsPageRendersFullSearchAndFilterWorkspace()).then(() => {
  console.log("homepage heading structure tests passed");
});
