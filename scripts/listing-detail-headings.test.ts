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
      notFound: () => {
        throw new Error("notFound");
      },
      usePathname: () => "/restaurants/the-curry-club-london",
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
      useSearchParams: () => new URLSearchParams()
    };
  }

  return originalLoad(request, parent, isMain);
};

function textFromTags(html: string, tag: "h1" | "h2" | "h3") {
  return Array.from(html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gis"))).map((match) =>
    decodeHtml(match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
  );
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}

async function renderListingHeadings(slug: string) {
  const pageModule = await import("../src/app/restaurants/[slug]/page");
  const element = await pageModule.default({ params: Promise.resolve({ slug }) });
  const html = renderToStaticMarkup(element);

  return {
    h1s: textFromTags(html, "h1"),
    h2s: textFromTags(html, "h2"),
    h3s: textFromTags(html, "h3")
  };
}

async function listingDetailPagesUseSeoFocusedH1AndH2Headings() {
  const samples = [
    { slug: "the-curry-club-london", name: "The Curry Club London" },
    { slug: "hyderabad-darbar", name: "HYDERABAD DARBAR" },
    { slug: "saravanaa-bhavan", name: "Saravanaa Bhavan" }
  ];

  for (const sample of samples) {
    const { h1s, h2s, h3s } = await renderListingHeadings(sample.slug);

    assert.deepEqual(h1s, [`${sample.name} in Redbridge, London`], `${sample.slug} should have one local SEO H1`);

    [
      `Quick Facts About ${sample.name}`,
      `${sample.name} Services, Dining Options, and Features`,
      `Guest Information for ${sample.name}`,
      `Transport and Directions to ${sample.name}`,
      `Comments About ${sample.name}`,
      `${sample.name} Location and Contact Details`,
      `${sample.name} Opening Hours`,
      `${sample.name} Reviews and Ratings`,
      `Explore More Indian Restaurants Near ${sample.name}`,
      "Similar Indian Restaurants in London"
    ].forEach((heading) => {
      assert.ok(h2s.includes(heading), `${sample.slug} should include H2 "${heading}"`);
    });

    [
      "Services and features",
      "Guest information",
      "Transport",
      "Comments",
      "Location and contact",
      "Opening hours",
      "Reviews",
      "Explore contextually",
      "Similar listings"
    ].forEach((oldHeading) => {
      assert.ok(!h2s.includes(oldHeading), `${sample.slug} should not keep generic H2 "${oldHeading}"`);
    });

    [
      "Indian Restaurants Near Redbridge",
      "Similar Indian Cuisine in London",
      "Indian Restaurants by Features and Dietary Needs"
    ].forEach((heading) => {
      assert.ok(h3s.includes(heading), `${sample.slug} should include keyword-focused H3 "${heading}"`);
    });

    ["Local area", "Similar cuisine", "Features & dietary", "Social links"].forEach((oldHeading) => {
      assert.ok(!h3s.includes(oldHeading), `${sample.slug} should not keep weak H3 "${oldHeading}"`);
    });
  }
}

async function listingDetailHeadingFallbackUsesLondonWhenAreaIsMissing() {
  const { buildListingDetailHeadings, buildListingDetailPageTitle } = await import("../src/lib/listing-detail-headings");

  const headings = buildListingDetailHeadings({ name: "Sample Restaurant" });

  assert.equal(headings.h1, "Sample Restaurant in London");
  assert.equal(buildListingDetailPageTitle({ name: "Sample Restaurant" }), "Sample Restaurant in London");
}

async function listingDetailPageTitlesUseSeoFocusedLocalPattern() {
  const { buildListingDetailPageTitle } = await import("../src/lib/listing-detail-headings");

  [
    { name: "The Curry Club London", area: "Redbridge", expected: "The Curry Club London in Redbridge, London" },
    { name: "HYDERABAD DARBAR", area: "Redbridge", expected: "HYDERABAD DARBAR in Redbridge, London" },
    { name: "Saravanaa Bhavan", area: "Redbridge", expected: "Saravanaa Bhavan in Redbridge, London" }
  ].forEach((sample) => {
    assert.equal(buildListingDetailPageTitle(sample), sample.expected);
  });
}

listingDetailPagesUseSeoFocusedH1AndH2Headings()
  .then(() => listingDetailHeadingFallbackUsesLondonWhenAreaIsMissing())
  .then(() => listingDetailPageTitlesUseSeoFocusedLocalPattern())
  .then(() => {
    console.log("listing detail heading tests passed");
  });
