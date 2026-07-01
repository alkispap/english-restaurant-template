import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { auditLocalBusinessDataQuality } from "../src/lib/local-business-data-quality";

const baseListing: Listing = {
  name: "Sample Spice",
  slug: "sample-spice",
  description: "Sample Spice is an Indian restaurant in Ilford, London.",
  images: [],
  area: "Redbridge",
  neighborhood: "Ilford",
  borough: "Redbridge",
  address: "10 High Street",
  fullAddress: "10 High Street, Ilford, IG1 1AA, London",
  postcode: "IG1 1AA",
  city: "London",
  categories: ["Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: ["Indian"],
  rating: 4.5,
  reviewCount: 120,
  contact: {
    phone: "+44 20 0000 0000",
    website: "https://example.com",
    googleReviewsUrl: "https://example.com/reviews"
  },
  location: {
    latitude: 51.56,
    longitude: 0.07
  },
  details: {
    placeId: "place-1"
  }
};

function listing(overrides: Partial<Listing>): Listing {
  return {
    ...baseListing,
    contact: {
      ...baseListing.contact,
      ...overrides.contact
    },
    location: {
      ...baseListing.location,
      ...overrides.location
    },
    details: {
      ...baseListing.details,
      ...overrides.details
    },
    ...overrides
  };
}

function codes(listings: Listing[]) {
  return auditLocalBusinessDataQuality(listings).issues.map((issue) => issue.code);
}

function issue(listings: Listing[], code: string) {
  const match = auditLocalBusinessDataQuality(listings).issues.find((item) => item.code === code);
  assert.ok(match, `expected issue ${code}`);
  return match;
}

assert.deepEqual(codes([baseListing]), []);

assert.equal(
  issue([listing({ slug: "bad-coordinate", location: { latitude: 47.73855, longitude: 12.5088275 } })], "coordinates_outside_london").severity,
  "warning"
);

assert.equal(
  issue([listing({ slug: "missing-location", address: undefined, postcode: undefined, area: undefined, neighborhood: undefined, borough: undefined })], "core_location_fields_missing").severity,
  "warning"
);

assert.equal(
  issue([baseListing, listing({ name: "Duplicate Slug", slug: "sample-spice", details: { placeId: "place-2" } })], "duplicate_slugs").severity,
  "warning"
);

assert.equal(
  issue([baseListing, listing({ name: "Duplicate Place", slug: "duplicate-place", details: { placeId: "place-1" } })], "duplicate_place_ids").severity,
  "warning"
);

assert.equal(
  issue([listing({ slug: "bad-url", contact: { website: "not a url" } })], "invalid_contact_urls").severity,
  "warning"
);

assert.equal(
  issue(
    [
      baseListing,
      listing({ name: "Shared Phone", slug: "shared-phone", contact: { phone: "+44 20 0000 0000" }, details: { placeId: "place-2" } })
    ],
    "duplicate_phone_numbers"
  ).severity,
  "info"
);

const summary = auditLocalBusinessDataQuality([
  baseListing,
  listing({ slug: "missing-category", categories: [], details: { placeId: "place-2" } })
]).summary;
assert.equal(summary.totalListings, 2);
assert.equal(summary.withCategories, 1);
assert.equal(summary.withCoordinates, 2);

console.log("local business data quality tests passed");
