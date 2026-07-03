import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAreaSeoPage, getCategorySeoPage } from "../src/lib/seo-pages";
import { buildBrowserSeoLandingPage } from "../src/lib/seo-landing-browser";

function seoLandingPageMountsQueryEnhancer() {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "components", "SeoLandingPage.tsx"), "utf8");

  assert.match(
    source,
    /SeoLandingQueryEnhancer/,
    "SEO landing pages should mount a client query enhancer for filter URL changes"
  );
}

function seoLandingQueryEnhancerLazyLoadsHeavyModules() {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "components", "SeoLandingQueryEnhancer.tsx"), "utf8");

  assert.doesNotMatch(
    source,
    /import \{ SeoLandingPageContent \}/,
    "SEO landing query enhancer should not statically import the heavy SEO content renderer"
  );
  assert.match(
    source,
    /Promise\.all\(\[[\s\S]*import\("@\/lib\/seo-landing-browser"\)[\s\S]*import\("@\/components\/SeoLandingPageContent"\)/,
    "SEO landing query enhancer should lazy-load browser model and content modules only for query URLs"
  );
}

function browserSeoLandingBuilderUsesCurrentQueryParams() {
  const cleanPage = getAreaSeoPage("harrow", {});
  const openPage = buildBrowserSeoLandingPage({
    pathname: "/areas/harrow",
    searchParams: new URLSearchParams("open=1")
  });

  assert.ok(cleanPage, "expected clean Harrow area page");
  assert.ok(openPage, "expected browser builder to resolve Harrow area page");
  assert.equal(openPage.kind, "area");
  assert.equal(openPage.openOnly, true, "open=1 should activate Open now state");
  assert.ok(
    openPage.totalCount <= cleanPage.totalCount,
    "Open now result count should not exceed the clean area result count"
  );
  assert.equal(openPage.metadata.canonical, "/areas/harrow");
  assert.deepEqual(openPage.metadata.robots, { index: false, follow: true });
}

function browserSeoLandingBuilderCoversSeoPageFamilies() {
  const paths = [
    "/areas/harrow",
    "/categories/indian",
    "/areas/harrow/categories/indian",
    "/neighborhoods/soho",
    "/best/best-rated",
    "/services/takeaway",
    "/dietary/halal",
    "/offerings/beer",
    "/types/casual-dining"
  ];

  const resolved = paths.map((pathname) =>
    buildBrowserSeoLandingPage({
      pathname,
      searchParams: new URLSearchParams("sort=reviews")
    })
  );

  assert.equal(resolved.length, paths.length);
  assert.ok(resolved.every(Boolean), "browser builder should resolve all SEO landing route families");
}

function categoryQueriesStayCanonicalizedAndNoindexed() {
  const queriedCategoryPage = buildBrowserSeoLandingPage({
    pathname: "/categories/indian",
    searchParams: new URLSearchParams("open=1&sort=reviews")
  });
  const directCategoryPage = getCategorySeoPage("indian", { open: "1", sort: "reviews" });

  assert.ok(queriedCategoryPage, "expected browser builder to resolve category page");
  assert.equal(queriedCategoryPage.metadata.canonical, "/categories/indian");
  assert.deepEqual(queriedCategoryPage.metadata.robots, { index: false, follow: true });
  assert.equal(queriedCategoryPage.totalCount, directCategoryPage?.totalCount);
}

seoLandingPageMountsQueryEnhancer();
seoLandingQueryEnhancerLazyLoadsHeavyModules();
browserSeoLandingBuilderUsesCurrentQueryParams();
browserSeoLandingBuilderCoversSeoPageFamilies();
categoryQueriesStayCanonicalizedAndNoindexed();

console.log("SEO landing query enhancer tests passed");
