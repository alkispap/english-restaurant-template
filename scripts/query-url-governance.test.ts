import assert from "node:assert/strict";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { getAreas, getCategories, slugify } from "../src/lib/directory";
import {
  captureDirectoryQuerySnapshot,
  hasActiveDirectoryQuery,
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

function directoryQuerySnapshotsAreRecognizedAndImmutable() {
  assert.equal(hasActiveDirectoryQuery(new URLSearchParams()), false);
  assert.equal(hasActiveDirectoryQuery(new URLSearchParams("utm_source=newsletter&verify=20260721")), false);
  assert.equal(hasActiveDirectoryQuery(new URLSearchParams("utm_source=newsletter&q=Dishoom")), true);
  assert.equal(hasActiveDirectoryQuery(new URLSearchParams("view=map")), true);

  const location = {
    href: "https://example.test/restaurants/?q=Dishoom",
    pathname: "/restaurants/",
    search: "?q=Dishoom"
  };
  const snapshot = captureDirectoryQuerySnapshot(location);
  location.href = "https://example.test/restaurants/?area=harrow";
  location.search = "?area=harrow";

  assert.equal(snapshot.href, "https://example.test/restaurants/?q=Dishoom");
  assert.equal(snapshot.pathname, "/restaurants/");
  assert.equal(snapshot.normalizedQuery, "q=Dishoom");
  assert.equal(snapshot.searchParams.get("q"), "Dishoom");
  assert.equal(snapshot.searchParams.has("area"), false);
}

homepageMetadataStaysStaticForExport().then(() => {
  seoHubQueryStatesAreNoindexed();
  unknownHomepageQueryParamsDoNotWakeDirectoryDataset();
  directoryQuerySnapshotsAreRecognizedAndImmutable();
  console.log("query URL governance tests passed");
});
