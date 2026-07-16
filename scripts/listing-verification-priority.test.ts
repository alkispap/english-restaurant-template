import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import type { ListingVerificationEvent, ListingVerificationLedger } from "../src/lib/listing-verification";
import {
  prioritizeListingVerification,
  renderListingVerificationPriorityReport
} from "../src/lib/listing-verification-priority";

const now = new Date("2026-07-16T00:00:00.000Z");
const clean: Listing = {
  name: "Popular Complete Restaurant",
  slug: "popular-complete",
  images: [],
  categories: ["Indian"],
  listingTypes: ["Restaurant"],
  dietaryOptions: [],
  tags: [],
  featured: true,
  rating: 5,
  reviewCount: 1_000_000,
  contact: { phone: "+44 20 0000 0000" },
  details: { workingHours: [{ day: "Monday", hours: "12-10pm" }] },
  provenance: { sourceName: "fixture", sourceId: "complete", importedAt: "2026-01-01T00:00:00.000Z", verificationStatus: "unverified" }
};
const incomplete: Listing = {
  name: "Incomplete Restaurant",
  slug: "incomplete",
  images: [],
  categories: [],
  listingTypes: [],
  dietaryOptions: [],
  tags: [],
  provenance: { sourceName: "fixture", sourceId: "incomplete", importedAt: "2026-01-01T00:00:00.000Z", verificationStatus: "unverified" }
};
const fresh: Listing = {
  ...structuredClone(clean),
  slug: "fresh",
  provenance: {
    sourceName: "fixture",
    sourceId: "fresh",
    importedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "editor-verified",
    lastVerifiedAt: "2026-07-15T00:00:00.000Z",
    lastVerificationEventId: "fresh-event"
  }
};
const stale: Listing = {
  ...structuredClone(clean),
  slug: "stale",
  provenance: {
    sourceName: "fixture",
    sourceId: "stale",
    importedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "source-verified",
    lastVerifiedAt: "2026-01-01T00:00:00.000Z",
    lastVerificationEventId: "stale-event"
  }
};
const openReviewEvent: ListingVerificationEvent = {
  id: "review-event",
  listingSlug: clean.slug,
  recordedAt: "2026-07-15T12:05:00.000Z",
  checkedAt: "2026-07-15T12:00:00.000Z",
  reviewedBy: "directory-editor",
  outcome: "needs-review",
  evidence: [{ sourceName: "Official site", sourceUrl: "https://example.com", accessedAt: "2026-07-15T12:00:00.000Z" }],
  fieldsChecked: ["name"],
  changes: [],
  notes: "Conflicting identity evidence."
};
const ledger: ListingVerificationLedger = { version: 1, events: [] };

let report = prioritizeListingVerification([clean, incomplete, fresh, stale], ledger, now);
assert.deepEqual(report.priorities.map((item) => item.slug), ["incomplete", "popular-complete", "stale"]);
assert.equal(report.totals.queuedWithDataGaps, 1);
assert.equal(report.totals.stale180Days, 1);
assert.equal(report.priorities[0].gaps.length, 4);
assert.equal(report.priorities.find((item) => item.slug === "popular-complete")?.valueScore, 210);

report = prioritizeListingVerification([clean, incomplete], { version: 1, events: [openReviewEvent] }, now);
assert.equal(report.priorities[0].slug, clean.slug);
assert.equal(report.priorities[0].state, "open-needs-review");

const resolvedEvent: ListingVerificationEvent = {
  ...openReviewEvent,
  id: "resolved-event",
  checkedAt: "2026-07-15T13:00:00.000Z",
  recordedAt: "2026-07-15T13:05:00.000Z",
  outcome: "verified",
  verificationStatus: "editor-verified",
  notes: undefined
};
report = prioritizeListingVerification([clean], { version: 1, events: [openReviewEvent, resolvedEvent] }, now);
assert.equal(report.priorities[0].state, "unverified");

const markdown = renderListingVerificationPriorityReport(report, 1);
assert.match(markdown, /Listing Verification Priority Queue/);
assert.match(markdown, /capped value proxy/);
assert.match(markdown, /popular-complete/);

console.log("listing verification priority tests passed");
