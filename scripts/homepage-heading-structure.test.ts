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

async function homepageUsesSeoFriendlyHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { DirectoryListingsPage } = await import("../src/components/DirectoryListingsPage");
  const { homepageHeadings } = await import("../src/lib/homepage-headings");
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

  [
    homepageHeadings.seoLinksTitle,
    `3,187 ${homepageHeadings.resultsHeadingContext} Found`,
    homepageHeadings.sourceContextTitle,
    homepageHeadings.listingRowTitles.highlyReviewed,
    homepageHeadings.listingRowTitles.budgetFriendly
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `homepage H2s should include "${heading}"`);
  });

  [
    "Best restaurant searches",
    "Recently added",
    "Useful shortcuts",
    "Local eats",
    "Budget-friendly"
  ].forEach((genericHeading) => {
    assert.ok(!h2s.includes(genericHeading), `generic heading "${genericHeading}" should not be an H2`);
  });

  [
    homepageHeadings.seoFeatureGroupTitles.area,
    homepageHeadings.seoFeatureGroupTitles.category,
    homepageHeadings.seoFeatureGroupTitles.areaCategory,
    homepageHeadings.seoFeatureGroupTitles.service,
    homepageHeadings.seoFeatureGroupTitles.dietary,
    homepageHeadings.seoFeatureGroupTitles.diningStyle,
    homepageHeadings.sourceContextQuestionTitles.data,
    homepageHeadings.sourceContextQuestionTitles.freshness,
    homepageHeadings.sourceContextQuestionTitles.choose,
    homepageHeadings.sidebarTitles.popularSearches,
    homepageHeadings.sidebarTitles.recentListings,
    homepageHeadings.sidebarTitles.usefulShortcuts
  ].forEach((heading) => {
    assert.ok(h3s.includes(heading), `homepage H3s should include "${heading}"`);
  });
}

homepageUsesSeoFriendlyHeadingOutline().then(() => {
  console.log("homepage heading structure tests passed");
});
