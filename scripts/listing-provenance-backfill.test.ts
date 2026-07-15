import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import { auditListingOperationalQuality } from "../src/lib/listing-operational-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";

const expected = {
  sourceName: "Indian Restaurants - Outscraper - Test.csv",
  firstRecordedAt: "2026-07-01T04:40:55.000Z",
  recordDateBasis: "first-committed",
  sourceCommit: "80eb6b4f2ac8db490423757cc1eb3edafc5f66e3",
  sourceSnapshotSha256: "3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d"
} as const;

const sourcePath = path.join(process.cwd(), "data", expected.sourceName);
const sourceHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
assert.equal(sourceHash, expected.sourceSnapshotSha256, "historical source snapshot should remain byte-identical");
const ledger = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "listing-verification-events.json"), "utf8")
) as ListingVerificationLedger;
const eventById = new Map(ledger.events.map((event) => [event.id, event]));

for (const listing of listings) {
  assert.ok(listing.provenance, `listing should have provenance: ${listing.slug}`);
  assert.equal(listing.provenance.sourceName, expected.sourceName);
  assert.ok(listing.provenance.sourceId, `listing should have a source ID: ${listing.slug}`);
  assert.equal(listing.provenance.importedAt, undefined, "unknown historical import times must not be invented");
  assert.equal(listing.provenance.firstRecordedAt, expected.firstRecordedAt);
  assert.equal(listing.provenance.recordDateBasis, expected.recordDateBasis);
  assert.equal(listing.provenance.sourceCommit, expected.sourceCommit);
  assert.equal(listing.provenance.sourceSnapshotSha256, expected.sourceSnapshotSha256);
  if (listing.provenance.verificationStatus === "unverified") {
    assert.equal(listing.provenance.lastVerifiedAt, undefined, "historical provenance alone must not claim verification");
    assert.equal(listing.provenance.lastVerificationEventId, undefined, "unverified records must not reference a verification event");
  } else {
    const event = eventById.get(listing.provenance.lastVerificationEventId ?? "");
    assert.ok(event, `verified listing must reference a retained event: ${listing.slug}`);
    assert.equal(event.listingSlug, listing.slug);
    assert.equal(event.checkedAt, listing.provenance.lastVerifiedAt);
    assert.equal(event.verificationStatus, listing.provenance.verificationStatus);
  }
}

assert.equal(listings.find((listing) => listing.slug === "gandhi-tandoori")?.provenance?.sourceId, "gandhitandoori:712chigwellrd");
assert.equal(auditListingOperationalQuality(listings).coverage.provenance.count, listings.length);

console.log("listing provenance backfill tests passed");
