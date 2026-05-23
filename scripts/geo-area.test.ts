import assert from "node:assert/strict";
import { nearestAreaFromCoordinates } from "../src/lib/geo-area";
import type { MapPoint } from "../src/lib/listings-page";

const points: MapPoint[] = [
  {
    slug: "central",
    name: "Central",
    area: "Westminster",
    categories: ["Indian"],
    latitude: 51.515,
    longitude: -0.141
  },
  {
    slug: "east",
    name: "East",
    area: "Redbridge",
    categories: ["Indian"],
    latitude: 51.59,
    longitude: 0.08
  },
  {
    slug: "unknown",
    name: "Unknown",
    categories: ["Indian"],
    latitude: 51,
    longitude: -0.1
  }
];

function returnsNearestAreaWithoutExposingCoordinates() {
  const result = nearestAreaFromCoordinates({ latitude: 51.588, longitude: 0.078 }, points);

  assert.deepEqual(result, {
    area: "Redbridge",
    slug: "redbridge"
  });
}

function ignoresListingsWithoutAreas() {
  const result = nearestAreaFromCoordinates({ latitude: 51.001, longitude: -0.1 }, points);

  assert.equal(result?.area, "Westminster");
}

function returnsUndefinedWhenNoAreaCanBeInferred() {
  assert.equal(
    nearestAreaFromCoordinates({ latitude: 51.5, longitude: -0.1 }, [
      {
        slug: "unknown",
        name: "Unknown",
        categories: [],
        latitude: 51.5,
        longitude: -0.1
      }
    ]),
    undefined
  );
}

returnsNearestAreaWithoutExposingCoordinates();
ignoresListingsWithoutAreas();
returnsUndefinedWhenNoAreaCanBeInferred();

console.log("geo area behavior tests passed");
