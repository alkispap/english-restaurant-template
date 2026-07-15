import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { applyListingVerification, type ListingVerificationLedger, type ListingVerificationProposal } from "../src/lib/listing-verification";
import { auditListingVerificationQuality, renderListingVerificationQualityReport } from "../src/lib/listing-verification-quality";

const base: Listing = {
  name: "Example Restaurant",
  slug: "example-restaurant",
  images: [],
  categories: ["Indian"],
  listingTypes: ["Restaurant"],
  dietaryOptions: [],
  tags: [],
  address: "1 Example Road",
  postcode: "SW1A 1AA",
  businessStatus: "Operational",
  contact: { website: "https://example.com", phone: "+44 20 0000 0000" },
  details: { workingHours: [{ day: "Monday", hours: "5-11pm" }] },
  provenance: {
    sourceName: "source.csv",
    sourceId: "place-1",
    importedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "unverified"
  }
};
const emptyLedger: ListingVerificationLedger = { version: 1, events: [] };
let report = auditListingVerificationQuality([base], emptyLedger, new Date("2026-07-16T00:00:00.000Z"));
assert.equal(report.coverage.unverified, 1);
assert.equal(report.verdict, "not_ready");
assert.equal(report.issues.find((issue) => issue.code === "unverified_listings")?.severity, "high");

const proposal: ListingVerificationProposal = {
  listingSlug: base.slug,
  checkedAt: "2026-07-15T12:00:00.000Z",
  reviewedBy: "directory-editor",
  outcome: "verified",
  verificationStatus: "editor-verified",
  evidence: [{ sourceName: "Official site", sourceUrl: "https://example.com", accessedAt: "2026-07-15T11:55:00.000Z" }],
  fieldsChecked: ["name", "address", "postcode", "businessStatus", "contact.website", "contact.phone", "details.workingHours"],
  changes: []
};
const applied = applyListingVerification(base, proposal, "2026-07-15T12:05:00.000Z");
const ledger: ListingVerificationLedger = { version: 1, events: [applied.event] };
report = auditListingVerificationQuality([applied.listing], ledger, new Date("2026-07-16T00:00:00.000Z"));
assert.equal(report.coverage.freshVerified, 1);
assert.equal(report.verdict, "pass");

const mismatched = structuredClone(applied.listing);
mismatched.provenance!.lastVerificationEventId = "missing-event";
report = auditListingVerificationQuality([mismatched], ledger, new Date("2026-07-16T00:00:00.000Z"));
assert.equal(report.issues.find((issue) => issue.code === "verified_state_without_matching_event")?.severity, "critical");

report = auditListingVerificationQuality([applied.listing], ledger, new Date("2027-02-01T00:00:00.000Z"));
assert.equal(report.coverage.stale180DaysOrMore, 1);
assert.equal(report.issues.find((issue) => issue.code === "verification_180_days_stale")?.severity, "high");

const markdown = renderListingVerificationQualityReport(report);
assert.match(markdown, /Listing Verification Quality Audit/);
assert.match(markdown, /verification_180_days_stale/);

console.log("listing verification quality tests passed");
