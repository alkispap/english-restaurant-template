import fs from "node:fs";
import path from "node:path";
import {
  analyzeDirectoryFile,
  type ImportedListing
} from "../src/lib/directory-import";
import { absoluteDataOutputs, buildListingDataOutputs, readListingPublicationRegistry } from "./listing-data-output-utils";
import { writeTextFilesAtomically } from "./publication-script-utils";
import { historicalCsvSnapshotSha256 } from "./source-snapshot-hash";

const SOURCE_FILENAME = "Indian Restaurants - Outscraper - Test.csv";
const SOURCE_SHA256 = "3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d";
const FIRST_RECORDED_AT = "2026-07-01T04:40:55.000Z";
const SOURCE_COMMIT = "80eb6b4f2ac8db490423757cc1eb3edafc5f66e3";

const write = process.argv.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const sourcePath = path.join(dataDirectory, SOURCE_FILENAME);
const listingsPath = path.join(dataDirectory, "listings.json");
const sourceHash = historicalCsvSnapshotSha256(fs.readFileSync(sourcePath));
if (sourceHash !== SOURCE_SHA256) {
  throw new Error(`Source snapshot hash mismatch: expected ${SOURCE_SHA256}, found ${sourceHash}`);
}

const sourceListings = analyzeDirectoryFile(sourcePath, "dry run").listings;
const listings = JSON.parse(fs.readFileSync(listingsPath, "utf8")) as ImportedListing[];
const publicationRegistry = readListingPublicationRegistry(dataDirectory);
const sourceByPlaceId = new Map<string, ImportedListing>();
const sourceBySlug = new Map<string, ImportedListing>();

for (const listing of sourceListings) {
  const placeId = typeof listing.details?.placeId === "string" ? listing.details.placeId : "";
  if (placeId) sourceByPlaceId.set(placeId, listing);
  sourceBySlug.set(listing.slug, listing);
}

let backfilledCount = 0;
let alreadyBackfilledCount = 0;
for (const listing of listings) {
  const placeId = typeof listing.details?.placeId === "string" ? listing.details.placeId : "";
  const sourceListing = (placeId ? sourceByPlaceId.get(placeId) : undefined) ?? sourceBySlug.get(listing.slug);
  if (!sourceListing) throw new Error(`No source record matched canonical listing: ${listing.slug}`);

  const provenance = {
    sourceName: SOURCE_FILENAME,
    sourceId: sourceListing.provenance.sourceId,
    firstRecordedAt: FIRST_RECORDED_AT,
    recordDateBasis: "first-committed" as const,
    sourceCommit: SOURCE_COMMIT,
    sourceSnapshotSha256: SOURCE_SHA256,
    verificationStatus: "unverified" as const
  };

  if (JSON.stringify(listing.provenance) === JSON.stringify(provenance)) {
    alreadyBackfilledCount += 1;
    continue;
  }
  if (listing.provenance) throw new Error(`Refusing to overwrite existing provenance for ${listing.slug}`);
  listing.provenance = provenance;
  backfilledCount += 1;
}

console.log(`Source snapshot SHA-256: ${sourceHash}`);
console.log(`Canonical listings matched: ${listings.length}/${listings.length}`);
console.log(`Eligible provenance backfills: ${backfilledCount}`);
console.log(`Already backfilled: ${alreadyBackfilledCount}`);

if (!write) {
  console.log("Dry run only. Pass --write to update the canonical dataset and derived indexes.");
  process.exit(0);
}

const outputs = absoluteDataOutputs(dataDirectory, buildListingDataOutputs(listings, publicationRegistry));
writeTextFilesAtomically(outputs);

console.log(`Updated ${outputs.size} canonical and derived data files.`);
