import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import { auditListingMediaQuality } from "../src/lib/listing-media-quality";
import { isApprovedListingMediaAsset, listingMediaUsages, type ListingMediaRegistry } from "../src/lib/listing-media-provenance";
import { historicalCsvSnapshotSha256 } from "./source-snapshot-hash";

const registry = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "listing-media-provenance.json"), "utf8")
) as ListingMediaRegistry;
const source = registry.sources["historical-listing-snapshot"];
assert.ok(source, "historical media source should be registered");
const sourceHash = historicalCsvSnapshotSha256(fs.readFileSync(path.join(process.cwd(), "data", source.sourceName)));
assert.equal(sourceHash, source.sourceSnapshotSha256);

const listingBySlug = new Map(listings.map((listing) => [listing.slug, listing]));
const urls = registry.assets.map((asset) => asset.url);
assert.equal(new Set(urls).size, urls.length, "media registry URLs should be unique");
for (const asset of registry.assets) {
  assert.ok(registry.sources[asset.sourceRef], `asset source should exist: ${asset.url}`);
  if (asset.publicationStatus === "published") assert.ok(isApprovedListingMediaAsset(asset), `published asset needs rights evidence: ${asset.url}`);
  for (const usage of asset.usages) {
    const listing = listingBySlug.get(usage.listingSlug);
    assert.ok(listing, `media usage should reference a canonical listing: ${usage.listingSlug}`);
  }
}

const report = auditListingMediaQuality(listings, registry, "2026-07-16T00:00:00.000Z");
assert.equal(report.totals.unregisteredUrls, 0);
assert.equal(report.totals.orphanRegistryUrls, 0);
assert.equal(report.totals.registryUrls, registry.assets.length);
for (const listing of listings) {
  for (const usage of listingMediaUsages(listing)) {
    const asset = registry.assets.find((item) => item.url === usage.url);
    assert.ok(asset?.publicationStatus === "published" && isApprovedListingMediaAsset(asset));
  }
}

console.log("listing media registry tests passed");
