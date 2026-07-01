import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  getStaticAreaParams,
  getStaticCategoryParams,
  getStaticFacetParams,
  getStaticNeighborhoodParams,
  getStaticPopularSearchParams
} from "../src/lib/static-route-params";
import sitemap from "../src/app/sitemap";

process.env.NEXT_STATIC_EXPORT = "1";

const start = performance.now();

const counts = {
  areas: getStaticAreaParams().length,
  categories: getStaticCategoryParams().length,
  neighborhoods: getStaticNeighborhoodParams().length,
  types: getStaticFacetParams("type", "type").length,
  dietary: getStaticFacetParams("dietary", "dietary").length,
  services: getStaticFacetParams("service", "service").length,
  offerings: getStaticFacetParams("offering", "offering").length,
  popularSearches: getStaticPopularSearchParams().length,
  sitemapRoutes: sitemap().length
};

const elapsed = performance.now() - start;

assert.ok(counts.areas > 0, "static export should generate area params");
assert.ok(counts.categories > 0, "static export should generate category params");
assert.ok(counts.neighborhoods > 0, "static export should generate neighborhood params");
assert.ok(counts.popularSearches > 0, "static export should generate popular search params");
assert.ok(counts.sitemapRoutes > 0, "sitemap should include routes");
assert.ok(
  elapsed < 8_000,
  `static route params and sitemap should use indexed counts instead of repeated full filtering; took ${Math.round(elapsed)}ms`
);

console.log("static route params performance tests passed");
