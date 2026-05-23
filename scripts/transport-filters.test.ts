import assert from "node:assert/strict";
import { listings } from "../src/data/listings";
import {
  filterListings,
  getBusStops,
  getNearbyPlaces,
  getTubeStations,
  slugify
} from "../src/lib/directory";
import { buildListingsPageHref, type ListingsPageLinkValues } from "../src/lib/listings-page";

function filtersMatchUndergroundStations() {
  const station = "Barkingside Underground Station";
  const results = filterListings({ tube: slugify(station) });

  assert.ok(results.length > 0, "expected at least one listing near Barkingside Underground Station");
  assert.ok(
    results.every((listing) => slugify(listing.location?.tubeStation ?? "") === slugify(station)),
    "tube filter should match the structured tubeStation field only"
  );
}

function filtersMatchBusStops() {
  const stop = "Waverley Gardens";
  const results = filterListings({ bus: slugify(stop) });

  assert.ok(results.length > 0, "expected at least one listing near Waverley Gardens");
  assert.ok(
    results.every((listing) => slugify(listing.location?.busStop ?? "") === slugify(stop)),
    "bus filter should match the structured busStop field only"
  );
}

function filtersMatchExactNearbyPlaceNames() {
  const place = "British Library Exhibition Space";
  const results = filterListings({ nearby: slugify(place) });

  assert.ok(results.length > 0, "expected at least one listing near British Library Exhibition Space");
  assert.ok(
    results.every((listing) =>
      listing.location?.nearbyPlaces?.some((nearbyPlace) => slugify(nearbyPlace.name) === slugify(place))
    ),
    "nearby filter should match exact nearby place names only"
  );
}

function transportFilterOptionsComeFromStructuredListingData() {
  assert.ok(getTubeStations().includes("Barkingside Underground Station"));
  assert.ok(getBusStops().includes("Waverley Gardens"));
  assert.ok(getNearbyPlaces().includes("British Library Exhibition Space"));
}

function transportFilterUrlsPreserveActiveState() {
  const values: ListingsPageLinkValues = {
    tube: "barkingside-underground-station",
    bus: "waverley-gardens",
    nearby: "british-library-exhibition-space",
    open: true,
    view: "map",
    page: 4
  };

  assert.equal(
    buildListingsPageHref(values, { page: 1 }),
    "/?tube=barkingside-underground-station&bus=waverley-gardens&nearby=british-library-exhibition-space&open=1&view=map"
  );
}

function transportFiltersDoNotUseKeywordSearch() {
  const keywordResults = filterListings({ q: "British Library Exhibition Space" });
  const nearbyResults = filterListings({ nearby: "british-library-exhibition-space" });

  assert.deepEqual(
    nearbyResults.map((listing) => listing.slug),
    listings
      .filter((listing) =>
        listing.location?.nearbyPlaces?.some(
          (nearbyPlace) => slugify(nearbyPlace.name) === "british-library-exhibition-space"
        )
      )
      .map((listing) => listing.slug)
  );
  assert.notDeepEqual(
    keywordResults.map((listing) => listing.slug),
    nearbyResults.map((listing) => listing.slug),
    "structured nearby filtering should not rely on keyword search behavior"
  );
}

filtersMatchUndergroundStations();
filtersMatchBusStops();
filtersMatchExactNearbyPlaceNames();
transportFilterOptionsComeFromStructuredListingData();
transportFilterUrlsPreserveActiveState();
transportFiltersDoNotUseKeywordSearch();

console.log("transport filter behavior tests passed");
