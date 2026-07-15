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
  const { DirectoryLandingPage } = await import("../src/components/DirectoryLandingPage");
  const html = renderToStaticMarkup(React.createElement(DirectoryLandingPage));

  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");
  const h3s = textFromTags(html, "h3");

  assert.deepEqual(h1s, ["Indian Restaurants in London"], "homepage should have one clear H1");
  assert.ok(html.includes('action="/restaurants/"'), "homepage search form should send visitors to the restaurants search page");
  assert.ok(html.includes('href="/services/takeaway"'), "homepage should expose a Takeaway discovery link");
  assert.ok(html.includes('href="/dietary/halal"'), "homepage should expose a Halal discovery link");
  assert.ok(!html.includes("Apply filters"), "clean homepage should not render the full filter panel");
  assert.ok(
    !h2s.includes("3,187 restaurants found"),
    "clean homepage should not render the full results heading"
  );

  assert.deepEqual(
    h2s,
    [
      "Choose by dietary need",
      "Explore London dining hubs",
      "Best rated Indian restaurants in London",
      "How do you want to eat?",
      "Browse all London regions",
      "Search all Indian restaurants in London"
    ],
    "homepage sections should follow the agreed intent-first order"
  );
  assert.equal(h2s.filter((heading) => heading === "Best rated Indian restaurants in London").length, 1, "homepage should render one compact restaurant row");
  assert.ok(!html.includes("Halal Verified"), "homepage should not claim unrecorded dietary verification");

  [
    "Best restaurant searches",
    "Recently added",
    "Useful shortcuts",
    "Local eats",
    "Budget-friendly",
    "Popular Indian restaurant searches",
    "City Indian restaurant guides",
    "All areas in London"
  ].forEach((genericHeading) => {
    assert.ok(!h2s.includes(genericHeading), `homepage should not render "${genericHeading}" as an H2`);
  });

  ["Southall", "Wembley", "Harrow", "Tooting", "Brick Lane", "Halal", "Vegetarian", "Vegan", "Gluten-free", "Takeaway", "Delivery", "Outdoor seating"].forEach((heading) => {
    assert.ok(h3s.includes(heading), `homepage discovery cards should include "${heading}"`);
  });

  ["Central London", "North London", "South London", "East London", "West London"].forEach((region) => {
    assert.ok(html.includes(region), `homepage compact region links should include "${region}"`);
  });

  assert.equal(countOccurrences(html, "<h2"), 6, "minimal homepage should render five discovery headings and the final CTA heading");
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
        basePath: "/restaurants/"
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  assert.deepEqual(h1s, ["Find restaurants in London"], "restaurants page should have one clear H1");
  assert.ok(html.includes('action="/restaurants/"'), "restaurants page search form should submit directly to /restaurants/");
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
