import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import { auditListingOperationalQuality } from "../src/lib/listing-operational-quality";

const expected = {
  sourceName: "Indian Restaurants - Outscraper - Test.csv",
  firstRecordedAt: "2026-07-01T04:40:55.000Z",
  recordDateBasis: "first-committed",
  sourceCommit: "80eb6b4f2ac8db490423757cc1eb3edafc5f66e3",
  sourceSnapshotSha256: "3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d",
  verificationStatus: "unverified"
} as const;

const sourcePath = path.join(process.cwd(), "data", expected.sourceName);
const sourceHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
assert.equal(sourceHash, expected.sourceSnapshotSha256, "historical source snapshot should remain byte-identical");

for (const listing of listings) {
  assert.ok(listing.provenance, `listing should have provenance: ${listing.slug}`);
  assert.equal(listing.provenance.sourceName, expected.sourceName);
  assert.ok(listing.provenance.sourceId, `listing should have a source ID: ${listing.slug}`);
  assert.equal(listing.provenance.importedAt, undefined, "unknown historical import times must not be invented");
  assert.equal(listing.provenance.firstRecordedAt, expected.firstRecordedAt);
  assert.equal(listing.provenance.recordDateBasis, expected.recordDateBasis);
  assert.equal(listing.provenance.sourceCommit, expected.sourceCommit);
  assert.equal(listing.provenance.sourceSnapshotSha256, expected.sourceSnapshotSha256);
  assert.equal(listing.provenance.verificationStatus, expected.verificationStatus);
  assert.equal(listing.provenance.lastVerifiedAt, undefined, "backfill must not claim a verification event");
}

assert.equal(listings.find((listing) => listing.slug === "gandhi-tandoori")?.provenance?.sourceId, "gandhitandoori:712chigwellrd");
assert.equal(auditListingOperationalQuality(listings).coverage.provenance.count, listings.length);

console.log("listing provenance backfill tests passed");
