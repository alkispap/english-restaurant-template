import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import {
  buildFreshnessAuditReport,
  renderFreshnessAuditReport,
  type FreshnessAuditReport
} from "../src/lib/freshness-audit";

const activeListing: Listing = {
  name: "Complete Active Listing",
  slug: "complete-active-listing",
  description: "A complete listing with enough details for visitors to trust before planning a visit.",
  images: ["https://example.com/photo.jpg"],
  area: "Harrow",
  neighborhood: "Harrow",
  address: "1 Station Road",
  fullAddress: "1 Station Road, Harrow, London",
  categories: ["Indian"],
  listingTypes: ["Casual Dining"],
  dietaryOptions: ["Vegetarian"],
  tags: ["Indian", "Vegetarian", "Takeaway"],
  rating: 4.7,
  reviewCount: 120,
  businessStatus: "OPERATIONAL",
  contact: {
    phone: "+44 20 0000 0000",
    website: "https://example.com",
    googleReviewsUrl: "https://example.com/reviews",
    menuUrl: "https://example.com/menu"
  },
  location: {
    latitude: 51.5,
    longitude: -0.1,
    googleMapsUrl: "https://example.com/maps"
  },
  details: {
    workingHours: [{ day: "Monday", hours: "12-10pm" }],
    serviceOptions: ["Takeaway", "Dine-in"],
    offerings: ["Vegetarian options"],
    googleVerified: true,
    placeId: "test-place-id"
  }
};

const mediumQualityListing: Listing = {
  name: "Medium Quality Listing",
  slug: "medium-quality-listing",
  description: "A mostly useful listing that needs a review before it is treated as fully fresh.",
  images: ["https://example.com/photo.jpg"],
  area: "Harrow",
  fullAddress: "2 Station Road, Harrow, London",
  categories: ["Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: ["Indian", "Takeaway"],
  rating: 4.3,
  reviewCount: 25,
  businessStatus: "OPERATIONAL",
  contact: {
    phone: "+44 20 0000 0001",
    website: "https://example.com"
  },
  location: {
    latitude: 51.5,
    longitude: -0.1
  },
  details: {
    workingHours: [{ day: "Monday", hours: "12-10pm" }],
    serviceOptions: ["Takeaway"]
  }
};

const thinListing: Listing = {
  name: "Thin Listing",
  slug: "thin-listing",
  images: [],
  categories: [],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
};

function audit(listings: Listing[], now = new Date("2026-06-01T00:00:00.000Z")): FreshnessAuditReport {
  return buildFreshnessAuditReport(listings, { now, directoryLastModified: new Date("2026-05-18T00:00:00.000Z") });
}

function resultFor(report: FreshnessAuditReport, slug: string) {
  const result = report.listings.find((listing) => listing.slug === slug);
  assert.ok(result, `expected result for ${slug}`);
  return result;
}

function issueCodes(report: FreshnessAuditReport, slug: string) {
  return resultFor(report, slug).issues.map((issue) => issue.code);
}

let report = audit([activeListing]);
assert.equal(resultFor(report, activeListing.slug).level, "ok");
assert.equal(report.totals.ok, 1);
assert.equal(report.totals.medium, 0);
assert.equal(report.totals.high, 0);

report = audit([{ ...activeListing, slug: "closed", name: "Closed", businessStatus: "Closed permanently" }]);
assert.equal(resultFor(report, "closed").level, "high");
assert.ok(issueCodes(report, "closed").includes("permanently_closed"));
assert.equal(report.totals.permanentlyClosed, 1);

report = audit([{ ...activeListing, slug: "temporary", name: "Temporary", businessStatus: "CLOSED_TEMPORARILY" }]);
assert.equal(resultFor(report, "temporary").level, "medium");
assert.ok(issueCodes(report, "temporary").includes("temporarily_closed"));
assert.equal(report.totals.temporarilyClosed, 1);

report = audit([{ ...activeListing, slug: "other-status", name: "Other Status", businessStatus: "CLOSED_FOR_RENOVATION" }]);
assert.equal(resultFor(report, "other-status").level, "medium");
assert.ok(issueCodes(report, "other-status").includes("non_operational_status"));

report = audit([{ ...activeListing, slug: "no-hours", name: "No Hours", details: { ...activeListing.details, workingHours: [] } }]);
assert.ok(issueCodes(report, "no-hours").includes("missing_hours"));
assert.equal(report.totals.missingHours, 1);

report = audit([{ ...activeListing, slug: "no-images", name: "No Images", images: [] }]);
assert.ok(issueCodes(report, "no-images").includes("missing_images"));
assert.equal(report.totals.missingImages, 1);

report = audit([{ ...activeListing, slug: "no-reviews", name: "No Reviews", rating: undefined, reviewCount: undefined }]);
assert.ok(issueCodes(report, "no-reviews").includes("missing_rating"));
assert.ok(issueCodes(report, "no-reviews").includes("missing_review_count"));
assert.equal(report.totals.missingReviews, 1);

report = audit([{ ...activeListing, slug: "no-contact-actions", name: "No Contact", contact: undefined, location: undefined }]);
assert.ok(issueCodes(report, "no-contact-actions").includes("missing_contact_actions"));
assert.equal(report.totals.missingContactActions, 1);

report = audit([thinListing]);
assert.equal(resultFor(report, thinListing.slug).level, "high");
assert.ok(issueCodes(report, thinListing.slug).includes("low_quality_score"));

report = audit([mediumQualityListing]);
assert.equal(resultFor(report, mediumQualityListing.slug).level, "medium");
assert.ok(issueCodes(report, mediumQualityListing.slug).includes("borderline_quality_score"));

report = buildFreshnessAuditReport([activeListing], {
  now: new Date("2026-05-01T00:00:00.000Z"),
  directoryLastModified: new Date("2026-01-01T00:00:00.000Z")
});
assert.equal(report.directoryFreshnessLevel, "medium");
assert.ok(report.recommendations.some((recommendation) => recommendation.includes("older than 90 days")));

report = buildFreshnessAuditReport([activeListing], {
  now: new Date("2026-08-01T00:00:00.000Z"),
  directoryLastModified: new Date("2026-01-01T00:00:00.000Z")
});
assert.equal(report.directoryFreshnessLevel, "high");
assert.ok(report.recommendations.some((recommendation) => recommendation.includes("older than 180 days")));

const output = renderFreshnessAuditReport(audit([activeListing, thinListing]));
assert.ok(output.includes("Freshness audit"));
assert.ok(output.includes("Listings checked: 2"));
assert.ok(output.includes("High risk: 1"));
assert.ok(output.includes("Top listings needing review:"));
assert.ok(output.includes("Recommended actions:"));

console.log("Freshness audit tests passed");
