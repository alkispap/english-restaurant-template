import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { auditListingMediaQuality, renderListingMediaQualityReport } from "../src/lib/listing-media-quality";
import { validateListingMediaRightsDeclaration, type ListingMediaRegistry } from "../src/lib/listing-media-provenance";

const listing: Listing = {
  name: "Priority Spice",
  slug: "priority-spice",
  images: ["https://images.example.com/restaurant.webp"],
  logo: "https://images.example.com/logo.webp",
  categories: ["Indian"], listingTypes: [], dietaryOptions: [], tags: [],
  rating: 4.8, reviewCount: 1000, featured: true,
  contact: { website: "https://example.com" }
};
const registry: ListingMediaRegistry = {
  version: 1,
  sources: { source: { sourceName: "fixture.csv" } },
  assets: [
    {
      url: listing.images[0], sourceRef: "source", rightsStatus: "licensed",
      publicationStatus: "published",
      rightsEvidence: "docs/permission.md", licenseName: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      attributionRequired: true, attributionText: "Example photographer",
      usages: [{ listingSlug: listing.slug, kind: "gallery", sourceId: "place-1" }]
    },
    {
      url: listing.logo!, sourceRef: "source", rightsStatus: "unknown",
      publicationStatus: "published",
      usages: [{ listingSlug: listing.slug, kind: "logo", sourceId: "place-1" }]
    }
  ]
};

const report = auditListingMediaQuality([listing], registry, "2026-07-16T00:00:00.000Z");
assert.equal(report.totals.registeredUrls, 2);
assert.equal(report.totals.approvedUrls, 1);
assert.equal(report.totals.listingsWithApprovedGalleryImages, 1);
assert.equal(report.issues.find((issue) => issue.code === "unapproved_media_rights")?.count, 1);
assert.equal(report.issues.find((issue) => issue.code === "missing_approved_priority_gallery_image"), undefined);
assert.equal(report.verdict, "not_ready");
assert.match(renderListingMediaQualityReport(report), /Priority listings for rights-cleared gallery images/);

const unregistered = auditListingMediaQuality([listing], { version: 1, sources: {}, assets: [] });
assert.equal(unregistered.issues.find((issue) => issue.code === "unregistered_display_media")?.severity, "critical");
assert.equal(unregistered.enrichmentPriority[0].slug, listing.slug);

assert.deepEqual(validateListingMediaRightsDeclaration({ rightsStatus: "licensed" }), [
  "--source-ref must be a lowercase hyphenated identifier",
  "--source-name is required",
  "--rights-evidence is required and must reference retained non-secret evidence",
  "--license-name is required for licensed media",
  "--license-url must use HTTP(S) for licensed media"
]);
assert.deepEqual(validateListingMediaRightsDeclaration({
  sourceRef: "owner-export",
  sourceName: "Owner export",
  rightsStatus: "permission-confirmed",
  rightsEvidence: "docs/permissions/owner-export.md"
}), []);

console.log("listing media quality tests passed");
