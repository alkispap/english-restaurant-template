import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getPublicSeoUpgradeTargets,
  getTemplatePageInventory,
  groupTemplatePagesByCategory,
  type TemplatePageCategory
} from "../src/lib/page-inventory";

const inventory = getTemplatePageInventory();
const byId = new Map(inventory.map((page) => [page.id, page]));

const expectedIds = [
  "homepage",
  "listings-redirect",
  "listing-detail",
  "areas-index",
  "categories-index",
  "area-hub",
  "neighborhood-hub",
  "category-hub",
  "area-category-hub",
  "best-hub",
  "service-facet",
  "dietary-facet",
  "offering-facet",
  "type-facet",
  "guides-index",
  "guide-article",
  "compare",
  "about",
  "contact",
  "privacy-policy",
  "terms",
  "methodology",
  "suggest-update",
  "sitemap",
  "robots",
  "shortlist-api"
];

assert.deepEqual(
  [...byId.keys()].sort(),
  [...expectedIds].sort(),
  "page inventory should list every known template route exactly once"
);

assert.equal(byId.get("homepage")?.urlPattern, "/", "homepage route should be inventoried");
assert.equal(byId.get("listings-redirect")?.category, "redirect", "/listings should be marked as a redirect");
assert.equal(byId.get("shortlist-api")?.category, "api", "shortlist API should not be treated as an SEO page");
assert.equal(byId.get("sitemap")?.category, "system-seo", "sitemap should be classified as system SEO");
assert.equal(byId.get("robots")?.category, "system-seo", "robots should be classified as system SEO");

const dynamicSeoIds = inventory.filter((page) => page.category === "dynamic-seo").map((page) => page.id).sort();
assert.deepEqual(
  dynamicSeoIds,
  [
    "area-category-hub",
    "area-hub",
    "best-hub",
    "category-hub",
    "dietary-facet",
    "neighborhood-hub",
    "offering-facet",
    "service-facet",
    "type-facet"
  ],
  "dynamic SEO landing page family should be complete"
);

const publicUpgradeTargets = getPublicSeoUpgradeTargets();
assert.equal(publicUpgradeTargets[0].id, "listing-detail", "listing detail pages should be the first remaining upgrade priority");
assert.equal(publicUpgradeTargets[0].upgradePriority, "high");
assert.ok(
  publicUpgradeTargets.some((page) => page.id === "listing-detail" && page.upgradePriority === "high"),
  "listing detail pages should be marked as high-priority SEO upgrade targets"
);
assert.ok(
  !publicUpgradeTargets.some((page) => page.category === "dynamic-seo"),
  "dynamic SEO pages should no longer be remaining upgrade targets after helper upgrade"
);
assert.ok(
  publicUpgradeTargets.every((page) => page.category !== "api" && page.category !== "system-seo"),
  "API and system SEO routes should not be included as public content upgrade targets"
);

const grouped = groupTemplatePagesByCategory();
const expectedCategories: TemplatePageCategory[] = [
  "homepage-search",
  "redirect",
  "listing-detail",
  "directory-index",
  "dynamic-seo",
  "article-guide",
  "utility",
  "trust-support",
  "system-seo",
  "api"
];
assert.deepEqual(
  [...grouped.keys()].sort(),
  [...expectedCategories].sort(),
  "inventory grouping should cover every page category"
);

inventory.forEach((page) => {
  assert.ok(page.urlPattern, `${page.id} should have a URL pattern`);
  assert.ok(page.routeFile, `${page.id} should record its route file`);
  assert.ok(page.componentOrModel, `${page.id} should record the component/model source`);
  assert.ok(page.headingSource, `${page.id} should record heading source`);
  assert.ok(page.metadataSource, `${page.id} should record metadata source`);
  assert.ok(page.reusableStatus, `${page.id} should record reusable status`);
  assert.ok(page.staleWordingRisk, `${page.id} should record stale wording risk`);
  assert.ok(page.upgradePriority, `${page.id} should record upgrade priority`);
});

const appFiles = fs
  .readdirSync(path.join(process.cwd(), "src", "app"), { recursive: true })
  .map(String)
  .filter((file) => file.endsWith("page.tsx") || file.endsWith("route.ts") || file === "sitemap.ts" || file === "robots.ts")
  .map((file) => path.join("src", "app", file).replaceAll("\\", "/"))
  .filter((file) => !file.endsWith("not-found.tsx"));
const inventoriedFiles = new Set(inventory.map((page) => page.routeFile));

appFiles.forEach((file) => {
  assert.ok(inventoriedFiles.has(file), `${file} should be represented in page inventory`);
});

console.log("page inventory tests passed");
