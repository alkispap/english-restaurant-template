import assert from "node:assert/strict";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { generateMetadata as restaurantsMetadata } from "../src/app/restaurants/page";
import { getAreas, getCategories, slugify } from "../src/lib/directory";
import {
  captureDirectoryQuerySnapshot,
  DIRECTORY_QUERY_ROBOTS_CONTENT,
  getDirectoryQueryRobotsContent,
  hasActiveDirectoryQuery,
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams,
  syncDirectoryQueryRobotsMeta
} from "../src/lib/directory-listings-search-params";
import { getAreaSeoPage, getCategorySeoPage } from "../src/lib/seo-pages";

async function homepageMetadataStaysStaticForExport() {
  const metadata = await homepageMetadata();
  const restaurants = await restaurantsMetadata();

  assert.deepEqual(metadata.alternates, { canonical: "/" });
  assert.equal(metadata.robots, undefined);
  assert.deepEqual(restaurants.alternates, { canonical: "/restaurants/" });
  assert.equal(restaurants.robots, undefined);
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

function directoryQueryRobotsPolicyMatchesRecognizedFilters() {
  assert.equal(getDirectoryQueryRobotsContent(new URLSearchParams()), null);
  assert.equal(getDirectoryQueryRobotsContent(new URLSearchParams("utm_source=newsletter&verify=20260721")), null);
  assert.equal(getDirectoryQueryRobotsContent(new URLSearchParams("q=Dishoom")), DIRECTORY_QUERY_ROBOTS_CONTENT);
  assert.equal(
    getDirectoryQueryRobotsContent(new URLSearchParams("utm_source=newsletter&area=harrow")),
    DIRECTORY_QUERY_ROBOTS_CONTENT
  );
}

function directoryQueryRobotsMetaIsAddedUpdatedAndRemoved() {
  type FakeMeta = { content: string; dataset: Record<string, string>; name: string; remove: () => void };
  const state: { currentMeta: FakeMeta | null } = { currentMeta: null };
  const documentRoot = {
    createElement() {
      return {
        content: "",
        dataset: {},
        name: "",
        remove() {
          state.currentMeta = null;
        }
      };
    },
    head: {
      append(meta: FakeMeta) {
        state.currentMeta = meta;
      },
      querySelector() {
        return state.currentMeta;
      }
    }
  } as unknown as Document;

  syncDirectoryQueryRobotsMeta(new URLSearchParams("area=harrow"), documentRoot);
  assert.equal(state.currentMeta?.name, "robots");
  assert.equal(state.currentMeta?.content, DIRECTORY_QUERY_ROBOTS_CONTENT);
  assert.equal(state.currentMeta?.dataset.directoryQueryRobots, "true");
  syncDirectoryQueryRobotsMeta(new URLSearchParams(), documentRoot);
  assert.equal(state.currentMeta, null);
}

homepageMetadataStaysStaticForExport().then(() => {
  seoHubQueryStatesAreNoindexed();
  unknownHomepageQueryParamsDoNotWakeDirectoryDataset();
  directoryQuerySnapshotsAreRecognizedAndImmutable();
  directoryQueryRobotsPolicyMatchesRecognizedFilters();
  directoryQueryRobotsMetaIsAddedUpdatedAndRemoved();
  console.log("query URL governance tests passed");
});
