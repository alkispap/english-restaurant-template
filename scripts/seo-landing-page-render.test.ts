import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getAreas, getCategories, getNeighborhoods, slugify } from "../src/lib/directory";
import { getAreaCategoryCombinations } from "../src/lib/directory-growth";
import { seoLandingHeadings } from "../src/lib/seo-landing-headings";
import {
  getAreaCategorySeoPage,
  getAreaSeoPage,
  getCategorySeoPage,
  getFacetSeoPage,
  getNeighborhoodSeoPage,
  getPopularSearchSeoPage
} from "../src/lib/seo-pages";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;

const moduleWithLoad = Module as unknown as { _load: ModuleLoad };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function patchedLoad(request: string, parent: unknown, isMain: boolean) {
  if (request === "next/navigation") {
    return {
      usePathname: () => "/areas/camden",
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
      useSearchParams: () => new URLSearchParams()
    };
  }

  return originalLoad(request, parent, isMain);
};

function seoLandingPageDoesNotRenderSummaryCards() {
  const componentPath = path.join(process.cwd(), "src", "components", "SeoLandingPageContent.tsx");
  const source = fs.readFileSync(componentPath, "utf8");
  const componentBody = source.split("function Breadcrumbs")[0];

  assert.ok(
    !componentBody.includes("<SummaryStats"),
    "SEO pages should not render the summary cards block"
  );
  assert.ok(
    !source.includes('aria-label="Directory summary"'),
    "SEO landing page should not include directory summary card markup"
  );
}

async function seoLandingPageRendersEntitySpecificHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const area = getAreas()[0];
  assert.ok(area, "expected area data");
  const page = getAreaSeoPage(slugify(area), {});
  assert.ok(page, "expected area page model");
  const headings = seoLandingHeadings.area(area);

  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(SeoLandingPage, {
        page
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  const h3s = textFromTags(html, "h3");

  assert.deepEqual(h1s, [headings.heroTitle], "SEO landing page should render one helper-generated H1");
  [
    `${page.totalCount.toLocaleString()} Indian Restaurants in ${area} Found`,
    headings.related.areaCategoryLinksTitle,
    headings.related.areaLinksTitle,
    headings.related.usefulSearchesTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `SEO landing H2s should include "${heading}"`);
  });
  [
    "Area guide",
    `Neighborhoods in ${area}`,
    `Cuisine types in ${area}`,
    `Search neighborhoods in ${area}`,
    `Search cuisine types in ${area}`
  ].forEach((copy) => {
    assert.ok(!html.includes(copy), `area SEO landing page should not render "${copy}"`);
  });
  assert.ok(
    !h2s.some((heading) =>
      [
        "Local decision signals",
        "Questions people ask",
        "Related areas",
        "Useful searches",
        "Popular searches",
        "Top areas",
        "Recently added",
        "Browse by need",
        "Useful shortcuts"
      ].includes(heading)
    ),
    "SEO landing H2s should avoid generic old headings"
  );
  assert.ok(
    html.replaceAll("&amp;", "&").includes(headings.faq.chooseQuestion),
    "FAQ text should use helper-generated question wording"
  );
  [
    "Indian Restaurant Price and Review Signals",
    "How to Choose the Right Indian Restaurant",
    "Practical Visit Notes for Indian Restaurants"
  ].forEach((heading) => {
    assert.ok(h3s.includes(heading), `SEO landing H3s should include "${heading}"`);
  });
  ["Price and review signals", "Best-fit guidance", "Practical visit notes"].forEach((oldHeading) => {
    assert.ok(!h3s.includes(oldHeading), `SEO landing H3s should not keep generic "${oldHeading}"`);
  });
}

function areaLandingPageKeepsFiltersFocusedOnCurrentArea() {
  const componentPath = path.join(process.cwd(), "src", "components", "SeoLandingPageContent.tsx");
  const source = fs.readFileSync(componentPath, "utf8");
  const componentBody = source.split("function Breadcrumbs")[0];

  assert.match(
    componentBody,
    /ResponsiveDirectoryFilters/,
    "SEO landing pages should use the same responsive filter wrapper as directory listings"
  );
  assert.match(
    componentBody,
    /hiddenGroups=\{areaScopedHiddenFilterGroups\(page\)\}/,
    "area-scoped SEO landing pages should hide the already-selected area filter group"
  );
  assert.doesNotMatch(
    componentBody,
    /summary[^>]*>\s*Filters and guides\s*</,
    "mobile area filters should not combine filters with guide/sidebar blocks"
  );
}

function areaLandingPageDoesNotRenderLowerGuideBlock() {
  const componentPath = path.join(process.cwd(), "src", "components", "SeoLandingPageContent.tsx");
  const source = fs.readFileSync(componentPath, "utf8");

  assert.match(
    source,
    /function GuideSection\(\{ page \}: \{ page: SeoPageModel \}\) \{[\s\S]*?page\.kind === "area"/,
    "area SEO pages should skip the lower guide section to reduce page clutter"
  );
}

function textFromTags(html: string, tag: "h1" | "h2" | "h3") {
  return Array.from(html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gis"))).map((match) =>
    match[1].replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").replace(/\s+/g, " ").trim()
  );
}

seoLandingPageDoesNotRenderSummaryCards();
areaLandingPageKeepsFiltersFocusedOnCurrentArea();
areaLandingPageDoesNotRenderLowerGuideBlock();
seoLandingPageRendersEntitySpecificHeadingOutline()
  .then(() => neighborhoodLandingPageRendersLocalSeoHeadingOutline())
  .then(() => categoryLandingPageRendersCuisineSeoHeadingOutline())
  .then(() => areaCategoryLandingPageRendersLocalCuisineSeoHeadingOutline())
  .then(() => bestLandingPageRendersIntentSeoHeadingOutline())
  .then(() => facetLandingPagesRenderFacetSpecificSeoHeadingOutlines())
  .then(() => {
    console.log("SEO landing page render tests passed");
  });

async function neighborhoodLandingPageRendersLocalSeoHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const neighborhood = getNeighborhoods()[0];
  assert.ok(neighborhood, "expected neighborhood data");
  const page = getNeighborhoodSeoPage(slugify(neighborhood), {});
  assert.ok(page, "expected neighborhood page model");
  const headings = seoLandingHeadings.neighborhood(neighborhood);

  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(SeoLandingPage, {
        page
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");
  assert.deepEqual(h1s, [headings.heroTitle], "neighborhood page should render one local SEO H1");
  [
    `${page.totalCount.toLocaleString()} Indian Restaurants in ${neighborhood} Found`,
    headings.guideTitle,
    headings.related.areaLinksTitle,
    headings.related.categoryLinksTitle,
    headings.related.usefulSearchesTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `neighborhood SEO landing H2s should include "${heading}"`);
  });
}

async function categoryLandingPageRendersCuisineSeoHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const category = getCategories().find((item) => slugify(item) !== "indian") ?? getCategories()[0];
  assert.ok(category, "expected category data");
  const page = getCategorySeoPage(slugify(category), {});
  assert.ok(page, "expected category page model");
  const headings = seoLandingHeadings.category(category);

  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(SeoLandingPage, {
        page
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  assert.deepEqual(h1s, [headings.heroTitle], "category page should render one cuisine SEO H1");
  [
    `${page.totalCount.toLocaleString()} ${category} Restaurants in London Found`,
    headings.guideTitle,
    headings.related.areaCategoryLinksTitle,
    headings.related.categoryLinksTitle,
    headings.related.usefulSearchesTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `category SEO landing H2s should include "${heading}"`);
  });
}

async function areaCategoryLandingPageRendersLocalCuisineSeoHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const combination = getAreaCategoryCombinations().find((item) => item.count >= 10);
  assert.ok(combination, "expected area and category combination data");
  const page = getAreaCategorySeoPage(combination.areaSlug, combination.categorySlug, {});
  assert.ok(page, "expected area category page model");
  const headings = seoLandingHeadings.areaCategory(combination.areaLabel, combination.categoryLabel);

  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(SeoLandingPage, {
        page
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  assert.deepEqual(h1s, [headings.heroTitle], "area category page should render one local cuisine SEO H1");
  [
    `${page.totalCount.toLocaleString()} ${combination.categoryLabel} Restaurants in ${combination.areaLabel} Found`,
    headings.guideTitle,
    headings.related.categoryLinksTitle,
    headings.related.areaLinksTitle,
    headings.related.usefulSearchesTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `area category SEO landing H2s should include "${heading}"`);
  });
}

async function bestLandingPageRendersIntentSeoHeadingOutline() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const page = getPopularSearchSeoPage("best-rated", {});
  assert.ok(page, "expected best-rated page model");
  const headings = seoLandingHeadings.best("Best rated restaurants in London");

  const html = renderToStaticMarkup(
    React.createElement(
      AccountProvider,
      null,
      React.createElement(SeoLandingPage, {
        page
      })
    )
  );
  const h1s = textFromTags(html, "h1");
  const h2s = textFromTags(html, "h2");

  assert.deepEqual(h1s, [headings.heroTitle], "best page should render one search-intent SEO H1");
  [
    `${page.totalCount.toLocaleString()} Indian Restaurants in London Found`,
    headings.guideTitle,
    headings.related.areaLinksTitle,
    headings.related.categoryLinksTitle,
    headings.related.areaCategoryLinksTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `best SEO landing H2s should include "${heading}"`);
  });
}

async function facetLandingPagesRenderFacetSpecificSeoHeadingOutlines() {
  const { AccountProvider } = await import("../src/components/AccountProvider");
  const { SeoLandingPage } = await import("../src/components/SeoLandingPage");
  const samples = [
    { facet: "service" as const, label: "Takeaway", expectedContext: "Indian Restaurants with Takeaway in London" },
    { facet: "dietary" as const, label: "Halal", expectedContext: "Halal Indian Restaurants in London" },
    { facet: "offering" as const, label: "Alcohol", expectedContext: "Indian Restaurants with Alcohol in London" },
    { facet: "type" as const, label: "Casual Dining", expectedContext: "Casual Dining Indian Restaurants in London" }
  ];

  for (const sample of samples) {
    const page = getFacetSeoPage(sample.facet, slugify(sample.label), {});
    assert.ok(page, `expected ${sample.facet} page model`);
    const headings = seoLandingHeadings.facet(sample.facet, sample.label);

    const html = renderToStaticMarkup(
      React.createElement(
        AccountProvider,
        null,
        React.createElement(SeoLandingPage, {
          page
        })
      )
    );
    const h1s = textFromTags(html, "h1");
    const h2s = textFromTags(html, "h2");

    assert.deepEqual(h1s, [headings.heroTitle], `${sample.facet} page should render one facet SEO H1`);
    [
      `${page.totalCount.toLocaleString()} ${sample.expectedContext} Found`,
      headings.guideTitle,
      headings.related.areaLinksTitle,
      headings.related.categoryLinksTitle,
      headings.related.usefulSearchesTitle,
      seoLandingHeadings.sectionTitles.informationGain,
      seoLandingHeadings.sectionTitles.faqs
    ].forEach((heading) => {
      assert.ok(h2s.includes(heading), `${sample.facet} SEO landing H2s should include "${heading}"`);
    });
  }
}
