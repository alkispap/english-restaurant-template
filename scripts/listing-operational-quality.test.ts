import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { auditListingOperationalQuality, renderListingOperationalQualityReport } from "../src/lib/listing-operational-quality";

const completeListing: Listing = {
  name: "Sample Spice",
  slug: "sample-spice",
  description: "An Indian restaurant in London.",
  images: ["https://images.example/sample.webp"],
  area: "Camden",
  neighborhood: "Camden Town",
  borough: "Camden",
  postcode: "NW1 8NH",
  address: "1 High Street",
  city: "London",
  categories: ["Indian"],
  listingTypes: ["Casual dining"],
  dietaryOptions: [],
  tags: ["Indian"],
  rating: 4.5,
  reviewCount: 120,
  contact: { website: "https://example.com", phone: "+44 20 0000 0000" },
  location: { latitude: 51.54, longitude: -0.14 },
  details: {
    placeId: "place-1",
    workingHours: [{ day: "Monday", hours: "09:00-17:00" }]
  },
  provenance: {
    sourceName: "Example source",
    sourceId: "place-1",
    importedAt: "2026-07-01",
    lastVerifiedAt: "2026-07-01",
    verificationStatus: "editor-verified"
  }
};

assert.equal(auditListingOperationalQuality([completeListing]).verdict, "pass");

const duplicate: Listing = {
  ...completeListing,
  name: "Sample Spice ",
  images: [],
  categories: [],
  contact: {},
  provenance: undefined,
  rating: 6,
  details: { placeId: "place-1", workingHours: [] }
};
const report = auditListingOperationalQuality([completeListing, duplicate]);
const byCode = new Map(report.issues.map((issue) => [issue.code, issue]));

assert.equal(report.verdict, "not_ready");
assert.equal(byCode.get("duplicate_slugs")?.severity, "critical");
assert.equal(byCode.get("duplicate_place_ids")?.count, 2);
assert.equal(byCode.get("possible_duplicate_name_postcode")?.severity, "high");
assert.equal(byCode.get("invalid_rating_review_pair")?.severity, "critical");
assert.equal(byCode.get("missing_provenance")?.count, 1);
assert.equal(byCode.get("missing_images")?.count, 1);
assert.equal(byCode.get("missing_categories")?.severity, "medium");
assert.equal(byCode.get("missing_contact_action")?.count, 1);
assert.match(renderListingOperationalQualityReport(report), /one row per restaurant location/);

console.log("listing operational quality tests passed");
