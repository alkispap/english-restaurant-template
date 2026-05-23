import assert from "node:assert/strict";
import {
  MAX_VISIBLE_MAP_MARKERS,
  createMapClusterIndex,
  getVisibleMapItems
} from "../src/lib/map-density";
import type { MapPoint } from "../src/lib/listings-page";

const densePoints: MapPoint[] = Array.from({ length: 80 }, (_, index) => ({
  slug: `restaurant-${index}`,
  name: `Restaurant ${index}`,
  area: "Redbridge",
  categories: ["Indian"],
  latitude: 51.58 + index * 0.0001,
  longitude: 0.08 + index * 0.0001
}));

function lowZoomGroupsDenseListingsIntoClusters() {
  const index = createMapClusterIndex(densePoints);
  const items = getVisibleMapItems(index, [-0.2, 51.4, 0.3, 51.8], 10);

  assert.ok(items.some((item) => item.kind === "cluster" && item.count > 1));
  assert.ok(items.length < densePoints.length);
}

function highZoomCanShowIndividualListings() {
  const index = createMapClusterIndex(densePoints.slice(0, 5));
  const items = getVisibleMapItems(index, [-0.2, 51.4, 0.3, 51.8], 18);

  assert.equal(items.filter((item) => item.kind === "listing").length, 5);
}

function visibleItemsAreCappedForLargeDatasets() {
  const index = createMapClusterIndex(
    Array.from({ length: MAX_VISIBLE_MAP_MARKERS + 50 }, (_, index) => ({
      slug: `spread-${index}`,
      name: `Spread ${index}`,
      area: "London",
      categories: ["Indian"],
      latitude: 51.3 + (index % 30) * 0.01,
      longitude: -0.4 + Math.floor(index / 30) * 0.01
    }))
  );
  const items = getVisibleMapItems(index, [-0.6, 51.2, 0.6, 51.8], 18);

  assert.ok(items.length <= MAX_VISIBLE_MAP_MARKERS);
}

lowZoomGroupsDenseListingsIntoClusters();
highZoomCanShowIndividualListings();
visibleItemsAreCappedForLargeDatasets();

console.log("map density behavior tests passed");
