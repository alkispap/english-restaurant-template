import assert from "node:assert/strict";
import {
  getAreaDirectoryCards,
  getAreaGuideModel,
  getCategoryOptionsByArea,
  getNeighborhoodOptionsByArea
} from "../src/lib/area-guide";

function areaDirectoryIncludesMainAreas() {
  const slugs = getAreaDirectoryCards(100).map((area) => area.slug);

  assert.ok(slugs.includes("harrow"));
  assert.ok(slugs.includes("redbridge"));
}

function harrowGuideHasNeighborhoodsAndCategories() {
  const guide = getAreaGuideModel("harrow");

  assert.ok(guide);
  assert.equal(guide.areaLabel, "Harrow");
  assert.ok(guide.neighborhoods.length > 0);
  assert.ok(guide.categories.length > 0);
}

function neighborhoodOptionsUseNeighborhoodRoutes() {
  const neighborhoods = getNeighborhoodOptionsByArea("harrow");

  assert.ok(neighborhoods.length > 0);
  assert.ok(neighborhoods.every((neighborhood) => neighborhood.href.startsWith("/neighborhoods/")));
  assert.ok(neighborhoods.every((neighborhood) => neighborhood.count > 0));
}

function categoryOptionsUseAreaCategoryRoutes() {
  const categories = getCategoryOptionsByArea("harrow");

  assert.ok(categories.length > 0);
  assert.ok(categories.every((category) => category.href.startsWith("/areas/harrow/categories/")));
  assert.ok(categories.every((category) => category.count > 0));
}

areaDirectoryIncludesMainAreas();
harrowGuideHasNeighborhoodsAndCategories();
neighborhoodOptionsUseNeighborhoodRoutes();
categoryOptionsUseAreaCategoryRoutes();

console.log("area guide tests passed");
