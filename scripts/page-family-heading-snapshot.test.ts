import assert from "node:assert/strict";
import {
  getTemplatePageInventory,
  getTemplatePageSeoUpgradeSummary,
  type TemplatePageInventoryItem
} from "../src/lib/page-inventory";

const inventory = getTemplatePageInventory();

function getPage(id: string): TemplatePageInventoryItem {
  const page = inventory.find((item) => item.id === id);
  assert.ok(page, `expected inventory page ${id}`);
  return page;
}

[
  {
    id: "homepage",
    headingSource: "homepageHeadings helper + DirectoryListingsPage",
    metadataSource: "src/app/page.tsx generateMetadata + siteConfig"
  },
  {
    id: "areas-index",
    headingSource: "src/app/areas/page.tsx inline headings",
    metadataSource: "src/app/areas/page.tsx metadata"
  },
  {
    id: "categories-index",
    headingSource: "src/app/categories/page.tsx inline headings",
    metadataSource: "src/app/categories/page.tsx metadata"
  },
  {
    id: "area-hub",
    headingSource: "SeoLandingPage model from getAreaSeoPage",
    metadataSource: "getSeoPageMetadata(page)"
  },
  {
    id: "listing-detail",
    headingSource: "src/app/listings/[slug]/page.tsx inline detail sections",
    metadataSource: "generateMetadata from listingShareMetadata"
  },
  {
    id: "about",
    headingSource: "TrustPage from getTrustPage('about')",
    metadataSource: "trust page title/description"
  }
].forEach((expected) => {
  const page = getPage(expected.id);
  assert.equal(page.headingSource, expected.headingSource, `${expected.id} heading source should be stable`);
  assert.equal(page.metadataSource, expected.metadataSource, `${expected.id} metadata source should be stable`);
});

assert.equal(getPage("homepage").reusableStatus, "helper-backed", "homepage should stay helper-backed");
assert.equal(getPage("areas-index").reusableStatus, "partially-config-driven", "areas index needs reusable helper work");
assert.equal(getPage("categories-index").reusableStatus, "partially-config-driven", "categories index needs reusable helper work");
assert.equal(getPage("area-hub").reusableStatus, "helper-backed", "SEO landing pages should stay helper-backed");
assert.equal(getPage("listing-detail").staleWordingRisk, "medium", "listing detail copy needs reusable heading review");
assert.equal(getPage("compare").upgradePriority, "low", "compare should remain lower priority than SEO landing pages");

const summary = getTemplatePageSeoUpgradeSummary();
assert.ok(!summary.highPriorityIds.includes("area-hub"), "summary should not call out upgraded area hub as high priority");
assert.ok(summary.highPriorityIds.includes("listing-detail"), "summary should call out listing detail as high priority");
assert.ok(summary.mediumPriorityIds.includes("areas-index"), "summary should call out areas index as medium priority");
assert.ok(summary.mediumPriorityIds.includes("categories-index"), "summary should call out categories index as medium priority");
assert.ok(summary.lowerPriorityIds.includes("about"), "summary should call out trust pages as lower priority");
assert.ok(!summary.publicSeoUpgradeIds.includes("shortlist-api"), "summary should exclude API routes");
assert.ok(!summary.publicSeoUpgradeIds.includes("sitemap"), "summary should exclude system SEO files");

console.log("page family heading snapshot tests passed");
