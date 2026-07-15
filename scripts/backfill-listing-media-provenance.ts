import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { analyzeDirectoryFile } from "../src/lib/directory-import";
import type { Listing } from "../src/data/listings";
import {
  listingMediaUsages,
  type ListingMediaAsset,
  type ListingMediaRegistry,
  type ListingMediaUsage
} from "../src/lib/listing-media-provenance";

const SOURCE_FILENAME = "Indian Restaurants - Outscraper - Test.csv";
const SOURCE_REF = "historical-listing-snapshot";
const SOURCE_SHA256 = "3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d";
const FIRST_RECORDED_AT = "2026-07-01T04:40:55.000Z";
const SOURCE_COMMIT = "80eb6b4f2ac8db490423757cc1eb3edafc5f66e3";

const write = process.argv.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const sourcePath = path.join(dataDirectory, SOURCE_FILENAME);
const listings = JSON.parse(fs.readFileSync(path.join(dataDirectory, "listings.json"), "utf8")) as Listing[];
const registryPath = path.join(dataDirectory, "listing-media-provenance.json");
const sourceHash = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
if (sourceHash !== SOURCE_SHA256) throw new Error(`Source snapshot hash mismatch: ${sourceHash}`);

const preview = analyzeDirectoryFile(sourcePath, "dry run").listings;
const sourceUrls = new Set(preview.flatMap((listing) => listingMediaUsages(listing).map((usage) => usage.url)));
const existing = fs.existsSync(registryPath)
  ? JSON.parse(fs.readFileSync(registryPath, "utf8")) as ListingMediaRegistry
  : { version: 1 as const, sources: {}, assets: [] };
const assetsByUrl = new Map(existing.assets.map((asset) => [asset.url, asset]));
const usagesByUrl = new Map<string, ListingMediaUsage[]>();

for (const listing of listings) {
  for (const usage of listingMediaUsages(listing)) {
    if (!sourceUrls.has(usage.url)) throw new Error(`Media URL is absent from the immutable source snapshot: ${usage.url}`);
    const usages = usagesByUrl.get(usage.url) ?? [];
    usages.push({ listingSlug: listing.slug, kind: usage.kind, sourceId: listing.provenance?.sourceId });
    usagesByUrl.set(usage.url, usages);
  }
}

let added = 0;
for (const [url, usages] of usagesByUrl) {
  const current = assetsByUrl.get(url);
  if (current) {
    current.usages = usages;
    current.publicationStatus ??= current.rightsStatus === "unknown" ? "quarantined" : "published";
    continue;
  }
  const asset: ListingMediaAsset = { url, sourceRef: SOURCE_REF, usages, publicationStatus: "quarantined", rightsStatus: "unknown" };
  assetsByUrl.set(url, asset);
  added += 1;
}

const registry: ListingMediaRegistry = {
  version: 1,
  sources: {
    ...existing.sources,
    [SOURCE_REF]: {
      sourceName: SOURCE_FILENAME,
      sourceSnapshotSha256: SOURCE_SHA256,
      firstRecordedAt: FIRST_RECORDED_AT,
      sourceCommit: SOURCE_COMMIT
    }
  },
  assets: [...assetsByUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
};

console.log(`Current display URLs: ${usagesByUrl.size}`);
console.log(`Existing registry URLs: ${existing.assets.length}`);
console.log(`New source-traced URLs: ${added}`);
console.log(`Rights status unknown: ${registry.assets.filter((asset) => asset.rightsStatus === "unknown").length}`);

if (!write) {
  console.log("Dry run only. Pass --write to update data/listing-media-provenance.json.");
  process.exit(0);
}

fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(`Updated ${path.relative(process.cwd(), registryPath)}`);
