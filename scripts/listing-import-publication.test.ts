import assert from "node:assert/strict";
import type { ImportedListing } from "../src/lib/directory-import";
import { reconcileListingImport } from "../src/lib/listing-import-publication";
import type { ListingPublicationRegistry } from "../src/lib/listing-publication";

const retained = [listing("retained", "source-1")];
const registry: ListingPublicationRegistry = {
  version: 1,
  baseline: { id: "baseline", createdAt: "2026-07-16T00:00:00.000Z", sourceSha256: "hash", listingCount: 1, actor: "system:migration", reason: "legacy-public-baseline" },
  entries: [{ listingSlug: "retained", listingSourceId: "source-1", status: "published", reason: "legacy-public-baseline", origin: "migration-baseline", effectiveAt: "2026-07-16T00:00:00.000Z", changedBy: "system:migration" }]
};

const reconciliation = reconcileListingImport(retained, [listing("retained", "source-1"), listing("new-restaurant", "source-2")], registry, "2026-07-16T10:00:00.000Z");
assert.equal(reconciliation.listings.length, 2);
assert.equal(reconciliation.matchedCount, 1);
assert.equal(reconciliation.newCount, 1);
assert.equal(reconciliation.sourceAbsentCount, 0);
assert.deepEqual(reconciliation.registry.entries.find((state) => state.listingSlug === "new-restaurant"), {
  listingSlug: "new-restaurant",
  listingSourceId: "source-2",
  status: "pending-review",
  reason: "new-import",
  origin: "import-default",
  effectiveAt: "2026-07-16T10:00:00.000Z",
  changedBy: "system:import"
});

const absent = reconcileListingImport(retained, [], registry, "2026-07-16T10:00:00.000Z");
assert.equal(absent.listings.length, 1, "source absence must not delete the retained record");
assert.deepEqual(absent.sourceAbsentSlugs, ["retained"]);
assert.equal(absent.registry.entries[0].status, "published", "source absence must not infer closure or change publication");

assert.throws(() => reconcileListingImport(retained, [listing("renamed", "source-1")], registry), /use verification\/entity resolution/);
assert.throws(() => reconcileListingImport(retained, [listing("retained", "different-source")], registry), /different source ID/);

console.log("listing import publication tests passed");

function listing(slug: string, sourceId: string): ImportedListing {
  return {
    name: slug,
    slug,
    images: [], categories: [], listingTypes: [], dietaryOptions: [], tags: [],
    provenance: { sourceName: "source.csv", sourceId, importedAt: "2026-07-16T10:00:00.000Z", verificationStatus: "unverified" }
  };
}
