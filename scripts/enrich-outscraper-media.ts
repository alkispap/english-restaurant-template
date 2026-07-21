import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type { Listing } from "../src/data/listings";
import type { ImportedListing } from "../src/lib/directory-import";
import {
  listingMediaUsages,
  validateListingMediaRightsDeclaration,
  type ListingMediaRegistry,
  type ListingMediaRightsDeclaration
} from "../src/lib/listing-media-provenance";
import {
  cleanUnusableListingMediaWithValidation,
  enrichListingsWithOutscraperMedia,
  parseOutscraperPhotoCsv,
  preferredPhotoUrl,
  type ListingMediaCleanupReport,
  type OutscraperMediaEnrichmentReport,
  type OutscraperPhotoRow
} from "../src/lib/outscraper-media-enrichment";
import { absoluteDataOutputs, buildListingDataOutputs, readListingPublicationRegistry } from "./listing-data-output-utils";
import { jsonFile, writeTextFilesAtomically } from "./publication-script-utils";

const root = process.cwd();
const args = process.argv.slice(2);
const write = args.includes("--write");
const sourceListingsArg = optionValue("--source-listings");
const listingsPath = path.join(root, "data/listings.json");
const mediaRegistryPath = path.join(root, "data/listing-media-provenance.json");
const sourceListingsPath = sourceListingsArg ? path.resolve(root, sourceListingsArg) : listingsPath;
const inputPaths = args.filter((arg) => !arg.startsWith("--")).map((csvPath) => path.resolve(root, csvPath));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!inputPaths.length) {
    throw new Error("Provide one or more Outscraper photo CSV files. The script has no machine-specific default paths.");
  }
  for (const inputPath of inputPaths) {
    if (!fs.existsSync(inputPath)) throw new Error(`CSV file not found: ${inputPath}`);
  }
  if (!fs.existsSync(sourceListingsPath)) throw new Error(`Listings file not found: ${sourceListingsPath}`);
  if (write && !fs.existsSync(mediaRegistryPath)) throw new Error("Media provenance registry is required before a write.");

  const rights = write ? rightsDeclaration() : undefined;
  const listings = JSON.parse(fs.readFileSync(sourceListingsPath, "utf8").replace(/^\uFEFF/, "")) as Listing[];
  const photoRows = inputPaths.flatMap(readOutscraperRows);
  const enrichmentUrls = new Set(photoRows.map(preferredPhotoUrl).filter(Boolean));
  const result = enrichListingsWithOutscraperMedia(listings, photoRows);
  const cleaned = await cleanUnusableListingMediaWithValidation(result.listings);

  printReport(result.report, inputPaths);
  printCleanupReport(cleaned.report);

  if (!write) {
    console.log("Dry run complete. No files were changed. Pass --write plus explicit source/rights evidence to update data.");
    return;
  }

  const mediaRegistry = updateMediaRegistry(cleaned.listings, enrichmentUrls, rights!);
  const publicationRegistry = readListingPublicationRegistry(path.join(root, "data"));
  const outputs = absoluteDataOutputs(path.join(root, "data"), buildListingDataOutputs(cleaned.listings as ImportedListing[], publicationRegistry));
  outputs.set(mediaRegistryPath, jsonFile(mediaRegistry));
  writeTextFilesAtomically(outputs);
  console.log(`Updated ${path.relative(root, listingsPath)}`);
  console.log("Regenerated publication-filtered search, filter, and shortlist data.");
  console.log(`Updated ${path.relative(root, mediaRegistryPath)}`);
}

function readOutscraperRows(inputPath: string): OutscraperPhotoRow[] {
  return parseOutscraperPhotoCsv(fs.readFileSync(inputPath, "utf8"));
}

function rightsDeclaration(): ListingMediaRightsDeclaration {
  const status = optionValue("--rights-status");
  const declaration: Partial<ListingMediaRightsDeclaration> = {
    sourceRef: optionValue("--source-ref"),
    sourceName: optionValue("--source-name"),
    sourceUrl: optionValue("--source-url"),
    rightsStatus: status === "permission-confirmed" || status === "licensed" || status === "public-domain" ? status : undefined,
    rightsEvidence: optionValue("--rights-evidence"),
    licenseName: optionValue("--license-name"),
    licenseUrl: optionValue("--license-url"),
    attributionRequired: args.includes("--attribution-required"),
    attributionText: optionValue("--attribution-text"),
    attributionUrl: optionValue("--attribution-url")
  };
  const errors = validateListingMediaRightsDeclaration(declaration);
  if (errors.length) throw new Error(`Media write refused:\n- ${errors.join("\n- ")}`);
  return declaration as ListingMediaRightsDeclaration;
}

function updateMediaRegistry(listings: Listing[], enrichmentUrls: Set<string>, declaration: ListingMediaRightsDeclaration) {
  const registry = JSON.parse(fs.readFileSync(mediaRegistryPath, "utf8")) as ListingMediaRegistry;
  const assetByUrl = new Map(registry.assets.map((asset) => [asset.url, asset]));
  const importedAt = new Date().toISOString();
  const aggregateHash = crypto.createHash("sha256");
  inputPaths.forEach((inputPath) => aggregateHash.update(fs.readFileSync(inputPath)));
  registry.sources[declaration.sourceRef] = {
    sourceName: declaration.sourceName,
    sourceUrl: declaration.sourceUrl,
    sourceSnapshotSha256: aggregateHash.digest("hex"),
    importedAt
  };

  for (const listing of listings) {
    for (const usage of listingMediaUsages(listing)) {
      if (!enrichmentUrls.has(usage.url)) continue;
      const existing = assetByUrl.get(usage.url);
      const mediaUsage = { listingSlug: listing.slug, kind: usage.kind, sourceId: listing.provenance?.sourceId };
      if (existing) {
        existing.usages = [...existing.usages.filter((item) => !(item.listingSlug === listing.slug && item.kind === usage.kind)), mediaUsage];
        if (existing.rightsStatus !== "unknown") continue;
      }
      assetByUrl.set(usage.url, {
        url: usage.url,
        sourceRef: declaration.sourceRef,
        usages: existing?.usages ?? [mediaUsage],
        publicationStatus: "published",
        rightsStatus: declaration.rightsStatus,
        rightsEvidence: declaration.rightsEvidence,
        licenseName: declaration.licenseName,
        licenseUrl: declaration.licenseUrl,
        attributionRequired: declaration.attributionRequired,
        attributionText: declaration.attributionText,
        attributionUrl: declaration.attributionUrl,
        lastValidatedAt: importedAt
      });
    }
  }
  registry.assets = [...assetByUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
  return registry;
}

function optionValue(name: string) {
  const argument = args.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1).trim() || undefined;
}

function printReport(report: OutscraperMediaEnrichmentReport, paths: string[]) {
  console.log("Outscraper media enrichment report");
  console.log(`CSV files: ${paths.length}`);
  paths.forEach((inputPath) => console.log(`- ${inputPath}`));
  console.log(`Source rows: ${report.sourceRows}`);
  console.log(`Usable photo rows: ${report.usablePhotoRows}`);
  console.log(`Matched photo rows: ${report.matchedPhotoRows}`);
  console.log(`Matched restaurants: ${report.matchedRestaurants}`);
  console.log(`Restaurants with images: ${report.restaurantsWithImages}`);
  console.log(`Restaurants with five photos: ${report.restaurantsWithFivePhotos}`);
  console.log(`Restaurants with menu photos: ${report.restaurantsWithMenuImages}`);
}

function printCleanupReport(report: ListingMediaCleanupReport) {
  console.log("Remote image URL validation complete.");
  console.log(`Removed unusable normal image URLs: ${report.removedImageUrls}`);
  console.log(`Removed unusable menu image URLs: ${report.removedMenuImageUrls}`);
  console.log(`Listings with removed media: ${report.listingsWithRemovedMedia}`);
}
