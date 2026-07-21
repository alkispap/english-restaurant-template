import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { applyPublicationDecision, type ListingPublicationLedger, type ListingPublicationRegistry } from "../src/lib/listing-publication";
import { auditListingPublicationQuality } from "../src/lib/listing-publication-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";

const listing: Listing = {
  name: "Example",
  slug: "example",
  images: [], categories: [], listingTypes: [], dietaryOptions: [], tags: [],
  provenance: { sourceName: "source.csv", sourceId: "source-1", verificationStatus: "unverified" }
};
const registry: ListingPublicationRegistry = {
  version: 1,
  baseline: { id: "baseline-1", createdAt: "2026-07-16T07:00:00.000Z", sourceSha256: "abc", listingCount: 1, actor: "system:migration", reason: "legacy-public-baseline" },
  entries: [{ listingSlug: "example", listingSourceId: "source-1", status: "published", reason: "legacy-public-baseline", origin: "migration-baseline", effectiveAt: "2026-07-16T07:00:00.000Z", changedBy: "system:migration" }]
};
const verification: ListingVerificationLedger = {
  version: 1,
  events: [{ id: "verification-1", listingSlug: "example", listingSourceId: "source-1", recordedAt: "2026-07-16T07:30:00.000Z", checkedAt: "2026-07-16T07:20:00.000Z", reviewedBy: "directory-editor", outcome: "needs-review", evidence: [{ sourceName: "Source", sourceUrl: "https://example.com", accessedAt: "2026-07-16T07:10:00.000Z" }], fieldsChecked: ["name"], changes: [], notes: "Identity conflict." }]
};
const ledger: ListingPublicationLedger = { version: 1, events: [] };
const before = auditListingPublicationQuality([listing], registry, ledger, { sourceSha256: "abc", verificationLedger: verification, now: new Date("2026-07-16T10:00:00.000Z") });
assert.ok(before.issues.some((issue) => issue.code === "published_open_verification_conflicts"));

const decision = applyPublicationDecision(
  { slug: "example", sourceId: "source-1" },
  registry.entries[0],
  { listingSlug: "example", expectedSourceId: "source-1", expectedCurrent: { status: "published", reason: "legacy-public-baseline" }, reviewedAt: "2026-07-16T08:00:00.000Z", reviewedBy: "directory-editor", next: { status: "pending-review", reason: "identity-uncertain" }, evidence: [{ type: "verification-event", eventId: "verification-1" }], notes: "Hold while identity is resolved." },
  "2026-07-16T08:01:00.000Z"
);
const migratedRegistry = structuredClone(registry);
migratedRegistry.entries[0] = decision.state;
const migratedLedger = { version: 1, events: [decision.event] } satisfies ListingPublicationLedger;
const after = auditListingPublicationQuality([listing], migratedRegistry, migratedLedger, { sourceSha256: "abc", verificationLedger: verification, now: new Date("2026-07-16T10:00:00.000Z") });
assert.equal(after.status, "ready");

const corrupted = structuredClone(migratedRegistry);
corrupted.entries[0].status = "published";
corrupted.entries[0].reason = "review-resolved";
const broken = auditListingPublicationQuality([listing], corrupted, migratedLedger, { sourceSha256: "abc", verificationLedger: verification, now: new Date("2026-07-16T10:00:00.000Z") });
assert.ok(broken.issues.some((issue) => issue.code === "publication_event_chain_mismatch"));

console.log("listing publication quality tests passed");
