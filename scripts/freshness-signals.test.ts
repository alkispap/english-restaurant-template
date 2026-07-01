import assert from "node:assert/strict";
import fs from "node:fs";
import { SEO_POLICY } from "../src/lib/seo-policy";
import { getAreaSeoPage } from "../src/lib/seo-pages";

const expectedLabel = "Directory data last updated: 18 May 2026";
const expectedIsoDate = "2026-05-18";

function policyDateIsReusable() {
  assert.equal(SEO_POLICY.directoryLastModified.toISOString().slice(0, 10), expectedIsoDate);
  assert.equal(SEO_POLICY.lastCheckedLabel, expectedLabel);
}

function seoLandingPagesUseDatedFreshnessLabel() {
  const page = getAreaSeoPage("harrow", {});

  assert.ok(page, "expected Harrow area SEO page model");
  assert.equal(page.hero.checkedLabel, expectedLabel);
}

function homepageAndListingPagesRenderFreshnessSignals() {
  const homepageView = fs.readFileSync("src/components/DirectoryListingsView.tsx", "utf8");
  const listingPage = fs.readFileSync("src/app/restaurants/[slug]/page.tsx", "utf8");

  assert.ok(homepageView.includes("DirectoryFreshnessLabel"), "homepage should render the reusable freshness label");
  assert.ok(listingPage.includes("DirectoryFreshnessLabel"), "restaurant detail pages should render the reusable freshness label");
}

function guideArticlesRenderVisiblePublishedAndUpdatedDates() {
  const guideContent = fs.readFileSync("src/components/GuideArticleContent.tsx", "utf8");

  assert.ok(guideContent.includes("Published:"), "guide article header should visibly show published date");
  assert.ok(guideContent.includes("Updated:"), "guide article header should visibly show updated date");
}

policyDateIsReusable();
seoLandingPagesUseDatedFreshnessLabel();
homepageAndListingPagesRenderFreshnessSignals();
guideArticlesRenderVisiblePublishedAndUpdatedDates();

console.log("freshness signal tests passed");
