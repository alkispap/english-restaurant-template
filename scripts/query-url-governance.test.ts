import assert from "node:assert/strict";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { getAreas, getCategories, slugify } from "../src/lib/directory";
import { getAreaSeoPage, getCategorySeoPage } from "../src/lib/seo-pages";

async function homepageQueryStatesAreNoindexed() {
  const metadata = await homepageMetadata({
    searchParams: Promise.resolve({ area: "redbridge", service: "takeaway", open: "1" })
  });

  assert.deepEqual(metadata.alternates, { canonical: "/areas/redbridge" });
  assert.deepEqual(metadata.robots, { index: false, follow: true });
}

function seoHubQueryStatesAreNoindexed() {
  const area = getAreas().find((item) => slugify(item) === "redbridge") ?? getAreas()[0];
  const category = getCategories().find((item) => slugify(item) === "indian") ?? getCategories()[0];
  assert.ok(area, "expected area data");
  assert.ok(category, "expected category data");

  const cleanAreaPage = getAreaSeoPage(slugify(area), {});
  const queriedAreaPage = getAreaSeoPage(slugify(area), { open: "1", service: "takeaway" });
  const queriedCategoryPage = getCategorySeoPage(slugify(category), { sort: "reviews" });

  assert.ok(cleanAreaPage?.isIndexable, "clean area hub should stay indexable when thresholds are met");
  assert.equal(queriedAreaPage?.isIndexable, false);
  assert.equal(queriedAreaPage?.metadata.canonical, `/areas/${slugify(area)}`);
  assert.deepEqual(queriedAreaPage?.metadata.robots, { index: false, follow: true });
  assert.equal(queriedCategoryPage?.isIndexable, false);
  assert.equal(queriedCategoryPage?.metadata.canonical, `/categories/${slugify(category)}`);
}

homepageQueryStatesAreNoindexed().then(() => {
  seoHubQueryStatesAreNoindexed();
  console.log("query URL governance tests passed");
});
