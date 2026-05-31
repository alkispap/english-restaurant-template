import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getAreas, slugify } from "../src/lib/directory";
import { seoLandingHeadings } from "../src/lib/seo-landing-headings";
import { getAreaSeoPage } from "../src/lib/seo-pages";

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
  const componentPath = path.join(process.cwd(), "src", "components", "SeoLandingPage.tsx");
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

  assert.deepEqual(h1s, [headings.heroTitle], "SEO landing page should render one helper-generated H1");
  [
    headings.guideTitle,
    headings.related.areaCategoryLinksTitle,
    headings.related.areaLinksTitle,
    headings.related.usefulSearchesTitle,
    seoLandingHeadings.sectionTitles.informationGain,
    seoLandingHeadings.sectionTitles.faqs
  ].forEach((heading) => {
    assert.ok(h2s.includes(heading), `SEO landing H2s should include "${heading}"`);
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
}

function textFromTags(html: string, tag: "h1" | "h2" | "h3") {
  return Array.from(html.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "gis"))).map((match) =>
    match[1].replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").replace(/\s+/g, " ").trim()
  );
}

seoLandingPageDoesNotRenderSummaryCards();
seoLandingPageRendersEntitySpecificHeadingOutline().then(() => {
  console.log("SEO landing page render tests passed");
});
