import assert from "node:assert/strict";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { getAreas, getCategories, slugify } from "../src/lib/directory";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "../src/lib/directory-listings-search-params";
import { getAreaSeoPage, getCategorySeoPage } from "../src/lib/seo-pages";

async function homepageMetadataStaysStaticForExport() {
  const metadata = await homepageMetadata();

  assert.deepEqual(metadata.alternates, { canonical: "/" });
  assert.equal(metadata.robots, undefined);
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

function unknownHomepageQueryParamsDoNotWakeDirectoryDataset() {
  const ignoredOnly = searchParamsRecordFromUrlSearchParams(new URLSearchParams("verify=20260621&utm_source=test"));
  assert.equal(normalizeSearchParams(ignoredOnly), "");

  const mixed = searchParamsRecordFromUrlSearchParams(new URLSearchParams("verify=20260621&q=dosa"));
  assert.equal(normalizeSearchParams(mixed), "q=dosa");
}

homepageMetadataStaysStaticForExport().then(() => {
  seoHubQueryStatesAreNoindexed();
  unknownHomepageQueryParamsDoNotWakeDirectoryDataset();
  console.log("query URL governance tests passed");
});
