import assert from "node:assert/strict";
import { buildListingDetailTabs } from "../src/lib/listing-detail-nav";
import type { Listing } from "../src/data/listings";

function baseListing(overrides: Partial<Listing> = {}): Listing {
  return {
    name: "Sample Restaurant",
    slug: "sample-restaurant",
    images: [],
    categories: [],
    listingTypes: [],
    dietaryOptions: [],
    tags: [],
    ...overrides
  };
}

function labels(listing: Listing) {
  return buildListingDetailTabs(listing).map((tab) => tab.label);
}

function fullRestaurantTabsUseVisualPageOrder() {
  const listing = baseListing({
    rating: 4.5,
    reviewCount: 200,
    contact: {
      website: "https://example.com",
      phone: "+44 20 0000 0000",
      googleReviewsUrl: "https://example.com/reviews",
      reserveUrl: "https://example.com/reserve",
      orderOnlineUrl: "https://example.com/order",
      appointmentUrl: "https://example.com/book",
      menuUrl: "https://example.com/menu"
    },
    location: {
      latitude: 51.5,
      googleMapsUrl: "https://maps.example.com",
      tubeStation: "Central Station",
      busStop: "High Street",
      nearbyPlaces: [{ label: "Landmark", name: "Town Hall" }]
    },
    details: {
      workingHours: [{ day: "Monday", hours: "12-10pm" }],
      serviceOptions: ["Delivery"],
      accessibility: ["Wheelchair-accessible entrance"]
    }
  });

  assert.deepEqual(labels(listing), [
    "Photos",
    "Overview",
    "Services",
    "Guest Info",
    "Contact",
    "Hours",
    "Transport",
    "Nearby",
    "Reviews"
  ]);
}

function missingOptionalSectionsAreRemoved() {
  const listing = baseListing({
    details: {
      serviceOptions: ["Takeaway"]
    }
  });

  assert.deepEqual(labels(listing), ["Photos", "Overview", "Services"]);
}

function contactCanComeFromLocationOnly() {
  const listing = baseListing({
    location: {
      latitude: 51.5
    }
  });

  assert.deepEqual(labels(listing), ["Photos", "Overview", "Contact"]);
}

function transportRequiresTubeOrBus() {
  assert.deepEqual(
    labels(
      baseListing({
        location: {
          latitude: 51.5,
          nearbyPlaces: [{ label: "Park", name: "Green Park" }]
        }
      })
    ),
    ["Photos", "Overview", "Contact", "Nearby"]
  );

  assert.deepEqual(
    labels(
      baseListing({
        location: {
          busStop: "High Street"
        }
      })
    ),
    ["Photos", "Overview", "Transport"]
  );
}

fullRestaurantTabsUseVisualPageOrder();
missingOptionalSectionsAreRemoved();
contactCanComeFromLocationOnly();
transportRequiresTubeOrBus();

console.log("listing-detail-nav behavior tests passed");
