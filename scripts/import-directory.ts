import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  analyzeDirectoryFile,
  renderListingsFile,
  renderMissingCategoryReview,
  renderReport,
  renderReportForListings,
  selectCuratedRestaurantSample,
  type ImportedListing
} from "../src/lib/directory-import";
import type { ListingPublicationRegistry } from "../src/lib/listing-publication";
import { reconcileListingImport } from "../src/lib/listing-import-publication";
import { listingSlugRedirects } from "../src/data/listing-slug-redirects";
import { absoluteDataOutputs, buildListingDataOutputs } from "./listing-data-output-utils";
import { jsonFile, writeTextFilesAtomically } from "./publication-script-utils";

const root = process.cwd();
const args = process.argv.slice(2);
const write = args.includes("--write");
const dryRun = !write;
const sampleArg = args.find((arg) => arg.startsWith("--sample"));
const sampleSize = sampleArg ? parseSampleSize(sampleArg) : undefined;
const inputArg = args.find((arg) => !arg.startsWith("--"));
const provenanceOptions = {
  sourceName: optionValue("--source-name"),
  sourceUrl: optionValue("--source-url"),
  importedAt: optionValue("--imported-at")
};
const inputPath = path.resolve(root, inputArg ?? "data/directory.csv");
const listingsSourcePath = path.resolve(root, "src/data/listings.ts");
const listingsJsonPath = path.resolve(root, "data/listings.json");
const publicationRegistryPath = path.resolve(root, "data/listing-publication-states.json");
const reportPath = path.resolve(root, "data/import-report.md");
const categoryReviewPath = path.resolve(root, "data/category-inference-review.md");

if (!fs.existsSync(inputPath)) {
  console.error(`CSV file not found: ${inputPath}`);
  console.error("Place your file at data/directory.csv or run: npm run import:directory -- data/your-file.csv");
  process.exit(1);
}

const result = analyzeDirectoryFile(inputPath, dryRun ? "dry run" : "normal import", undefined, provenanceOptions);
const importedListings = sampleSize ? selectCuratedRestaurantSample(result.listings, { size: sampleSize }) : result.listings;
const reportData = sampleSize ? renderReportForListings(result.reportData, importedListings, "curated sample") : result.reportData;
const report = sampleSize
  ? `${renderReport(reportData)}\n## Curated Sample\n\n- Requested sample size: ${sampleSize}\n- Sample listings selected: ${importedListings.length}\n- Selection strategy: broad coverage across areas, cuisines, types, prices, dietary options, services, images, ratings, and review counts.\n`
  : result.report;
const existingListings = readJson<ImportedListing[]>(listingsJsonPath);
const publicationRegistry = readJson<ListingPublicationRegistry>(publicationRegistryPath);
const reconciliation = reconcileListingImport(
  existingListings,
  importedListings,
  publicationRegistry,
  provenanceOptions.importedAt ?? new Date().toISOString()
);
for (const slug of reconciliation.newSlugs) {
  if (slug in listingSlugRedirects) throw new Error(`New import reuses a retired redirect slug: ${slug}`);
}
const reconciliationReport = [
  "",
  "## Publication-safe reconciliation",
  "",
  `- Retained canonical records: ${existingListings.length.toLocaleString()}`,
  `- Matched incoming records retained without overwriting verified facts: ${reconciliation.matchedCount.toLocaleString()}`,
  `- New records initialized as pending review: ${reconciliation.newCount.toLocaleString()}`,
  `- Existing records absent from this source but preserved unchanged: ${reconciliation.sourceAbsentCount.toLocaleString()}`,
  "- Source absence did not infer closure, exclusion, or deletion.",
  ""
].join("\n");
const finalReport = `${report.trimEnd()}\n${reconciliationReport}`;

console.log(finalReport);
console.log(`Reconciled retained listings: ${reconciliation.listings.length.toLocaleString()}`);
console.log(`Published after reconciliation: ${reconciliation.registry.entries.filter((state) => state.status === "published").length.toLocaleString()}`);
console.log(`Pending after reconciliation: ${reconciliation.registry.entries.filter((state) => state.status === "pending-review").length.toLocaleString()}`);

if (dryRun) {
  console.log("Dry run complete. No files were changed. Pass --write with the expected reconciliation counts to persist.");
} else {
  requireExpectedCount("--expected-new", reconciliation.newCount);
  requireExpectedCount("--expected-matched", reconciliation.matchedCount);
  requireExpectedCount("--expected-source-absent", reconciliation.sourceAbsentCount);
  const outputs = absoluteDataOutputs(path.dirname(listingsJsonPath), buildListingDataOutputs(reconciliation.listings, reconciliation.registry));
  outputs.set(listingsSourcePath, renderListingsFile());
  outputs.set(publicationRegistryPath, jsonFile(reconciliation.registry));
  outputs.set(reportPath, finalReport);
  outputs.set(categoryReviewPath, renderMissingCategoryReview(result.categoryReview));
  writeTextFilesAtomically(outputs);
  console.log(`Imported ${reconciliation.newCount} new pending-review listings from ${path.relative(root, inputPath)}; retained ${existingListings.length} existing records.`);
  console.log(`Updated ${outputs.size} canonical, editorial, report, and publication-filtered derived files.`);
}

function parseSampleSize(value: string) {
  const explicit = value.includes("=") ? value.split("=").at(-1) : undefined;
  const parsed = Number(explicit || 120);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 120;
}

function optionValue(name: string) {
  const argument = args.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1).trim() || undefined;
}

function requireExpectedCount(name: string, expected: number) {
  if (Number(optionValue(name)) !== expected) throw new Error(`${name} must equal ${expected}`);
}

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
