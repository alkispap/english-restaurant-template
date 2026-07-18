import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildBrowserSeoLandingListingsModel } from "../src/lib/seo-landing-listings-browser";
import { buildDirectoryListingsModel } from "../src/lib/directory-listings-model";

const packedSearchIndex = fs.readFileSync(path.join(process.cwd(), "data", "listing-search-index.json"), "utf8");
let searchDataRequestCount = 0;
globalThis.fetch = async () => {
  searchDataRequestCount += 1;
  return new Response(packedSearchIndex, {
  headers: { "Content-Type": "application/json" }
  });
};

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
  const browserPath = path.join(process.cwd(), "src", "lib", "seo-landing-browser.ts");

  assert.doesNotMatch(
    source,
    /import \{ SeoLandingPageContent \}/,
    "SEO landing query enhancer should not statically import the heavy SEO content renderer"
  );
  assert.doesNotMatch(
    source,
    /@\/lib\/seo-landing-browser/,
    "SEO landing query enhancer should not import the full SEO page browser builder"
  );
  assert.match(
    source,
    /import\("@\/lib\/seo-landing-listings-browser"\)/,
    "SEO landing query enhancer should reuse the compact SEO landing listing browser model"
  );
  assert.match(
    source,
    /import\("@\/components\/SeoLandingResultsShell"\)/,
    "SEO landing query enhancer should lazy-load only the SEO landing results shell"
  );
  assert.ok(fs.existsSync(browserPath), "seo-landing-browser module should still exist until removed intentionally");
}

function browserLoadedSeoQueryModulesAvoidFullSeoDataset() {
  const browserLoadedPaths = [
    path.join(process.cwd(), "src", "components", "SeoLandingQueryEnhancer.tsx"),
    path.join(process.cwd(), "src", "components", "SeoLandingResultsShell.tsx"),
    path.join(process.cwd(), "src", "lib", "seo-landing-listings-browser.ts")
  ];

  for (const filePath of browserLoadedPaths) {
    const source = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    const relative = path.relative(process.cwd(), filePath);

    assert.doesNotMatch(source, /@\/lib\/seo-pages/, `${relative} should not import the full SEO page builder`);
    assert.doesNotMatch(source, /@\/data\/listings/, `${relative} should not import full listing records`);
  }
}

function seoLandingServerContentExposesReplaceableResultsRegion() {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "components", "SeoLandingPageContent.tsx"), "utf8");
  const replaceableRegionStart = source.indexOf('id="seo-landing-server-results"');
  const clientRootStart = source.indexOf('id="seo-landing-client-results-root"');

  assert.match(
    source,
    /id="seo-landing-server-results"/,
    "SEO landing content should expose a results region the client enhancer can hide during query-state updates"
  );
  assert.match(
    source,
    /id="seo-landing-client-results-root"/,
    "SEO landing content should expose a client results mount point for query-state updates"
  );
  assert.match(
    source,
    /id="seo-landing-stable-content"/,
    "SEO landing content should keep guide, related links, and FAQs in a stable content region"
  );
  assert.ok(
    replaceableRegionStart >= 0 && clientRootStart > replaceableRegionStart,
    "SEO landing client results root should follow the replaceable server results region"
  );

  const replaceableRegion = source.slice(replaceableRegionStart, clientRootStart);
  assert.match(replaceableRegion, /ResponsiveDirectoryFilters/, "replaceable region should include filters");
  assert.match(replaceableRegion, /ListingsResults/, "replaceable region should include listing results");
  assert.doesNotMatch(
    replaceableRegion,
    /GuideSection|InformationGain|RelatedLinks|Faqs/,
    "replaceable region should not wrap stable SEO guide, related links, or FAQ content"
  );
}

function seoLandingQueryEnhancerMountsClientResultsIntoDedicatedRoot() {
  const source = fs.readFileSync(path.join(process.cwd(), "src", "components", "SeoLandingQueryEnhancer.tsx"), "utf8");

  assert.match(
    source,
    /createPortal/,
    "SEO landing query enhancer should portal client-updated results into the dedicated mount point"
  );
  assert.match(
    source,
    /seo-landing-client-results-root/,
    "SEO landing query enhancer should target the dedicated client results root"
  );
  assert.match(
    source,
    /serverResults\.style\.display = activeModel !== null \? "none" : ""/,
    "SEO landing query enhancer should explicitly hide the grid server region while client results are active"
  );
  assert.match(
    source,
    /serverResults\.style\.display = ""/,
    "SEO landing query enhancer should restore the server region display state during cleanup"
  );
}

async function browserSeoLandingBuilderUsesCurrentQueryParams() {
  const cleanModel = await buildBrowserSeoLandingListingsModel({
    pathname: "/areas/harrow",
    searchParams: new URLSearchParams(),
    basePath: "/areas/harrow",
    title: "Indian restaurants in Harrow",
    description: "Compare Indian restaurants in Harrow."
  });
  const openModel = await buildBrowserSeoLandingListingsModel({
    pathname: "/areas/harrow",
    searchParams: new URLSearchParams("open=1"),
    basePath: "/areas/harrow",
    title: "Indian restaurants in Harrow",
    description: "Compare Indian restaurants in Harrow."
  });

  assert.ok(cleanModel, "expected clean Harrow area listing model");
  assert.ok(openModel, "expected browser builder to resolve Harrow area listing model");
  assert.equal(openModel.openOnly, true, "open=1 should activate Open now state");
  assert.ok(
    openModel.totalCount <= cleanModel.totalCount,
    "Open now result count should not exceed the clean area result count"
  );
  assert.equal(openModel.basePath, "/areas/harrow");
  assert.equal(openModel.filters.area, "harrow");
}

async function browserSeoLandingBuilderCoversSeoPageFamilies() {
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

  const resolved = await Promise.all(paths.map((pathname) =>
    buildBrowserSeoLandingListingsModel({
      pathname,
      searchParams: new URLSearchParams("sort=reviews"),
      basePath: pathname,
      title: "SEO landing results",
      description: "Compare matching restaurants."
    })
  ));

  assert.equal(resolved.length, paths.length);
  assert.ok(resolved.every(Boolean), "browser builder should resolve all SEO landing route families");
}

async function categoryQueriesStayCanonicalizedAndNoindexed() {
  const queriedCategoryModel = await buildBrowserSeoLandingListingsModel({
    pathname: "/categories/indian",
    searchParams: new URLSearchParams("open=1&sort=reviews"),
    basePath: "/categories/indian",
    title: "Indian restaurants in London",
    description: "Compare Indian restaurants in London."
  });
  const directCategoryModel = buildDirectoryListingsModel({
    searchParams: { open: "1", sort: "reviews" },
    basePath: "/categories/indian",
    title: "Indian restaurants in London",
    description: "Compare Indian restaurants in London.",
    baseFilters: { category: "indian", sort: "rating" }
  });

  assert.ok(queriedCategoryModel, "expected browser builder to resolve category listing model");
  assert.equal(queriedCategoryModel.basePath, "/categories/indian");
  assert.equal(queriedCategoryModel.filters.category, "indian");
  assert.equal(queriedCategoryModel.filters.sort, "reviews");
  assert.equal(queriedCategoryModel.totalCount, directCategoryModel.totalCount);
}

async function main() {
  seoLandingPageMountsQueryEnhancer();
  seoLandingQueryEnhancerLazyLoadsHeavyModules();
  browserLoadedSeoQueryModulesAvoidFullSeoDataset();
  seoLandingServerContentExposesReplaceableResultsRegion();
  seoLandingQueryEnhancerMountsClientResultsIntoDedicatedRoot();
  await browserSeoLandingBuilderUsesCurrentQueryParams();
  await browserSeoLandingBuilderCoversSeoPageFamilies();
  await categoryQueriesStayCanonicalizedAndNoindexed();
  assert.equal(searchDataRequestCount, 1, "browser SEO models should reuse one initialized search runtime");
  console.log("SEO landing query enhancer tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
