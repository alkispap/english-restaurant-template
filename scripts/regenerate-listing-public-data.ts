import fs from "node:fs";
import path from "node:path";
import type { ListingPublicationRegistry } from "../src/lib/listing-publication";
import { renderPublishedDirectoryDataFiles, type ImportedListing } from "../src/lib/directory-import";
import { writeTextFilesAtomically } from "./publication-script-utils";

const write = process.argv.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const listings = readJson<ImportedListing[]>(path.join(dataDirectory, "listings.json"));
const registry = readJson<ListingPublicationRegistry>(path.join(dataDirectory, "listing-publication-states.json"));
const rendered = renderPublishedDirectoryDataFiles(listings, registry);
const outputs = new Map<string, string>([
  [path.join(dataDirectory, "listing-search-records.json"), rendered.listingSearchRecordsJsonFile],
  [path.join(dataDirectory, "listing-search-index.json"), rendered.listingSearchIndexJsonFile],
  [path.join(dataDirectory, "listing-filter-counts.json"), rendered.listingFilterCountsJsonFile],
  [path.join(dataDirectory, "shortlist-summaries.json"), rendered.shortlistSummariesJsonFile],
  [path.join(dataDirectory, "shortlist-index.json"), rendered.shortlistIndexJsonFile]
]);

console.log(`Retained listings: ${listings.length.toLocaleString()}`);
console.log(`Published listings: ${rendered.publishedListings.length.toLocaleString()}`);
for (const [filePath, contents] of outputs) {
  const current = fs.readFileSync(filePath, "utf8");
  console.log(`${path.relative(process.cwd(), filePath)}: ${current === contents ? "unchanged" : "update required"}`);
}
if (!write) {
  console.log("Dry run only. Pass --write to regenerate public listing data.");
  process.exit(0);
}
writeTextFilesAtomically(outputs);
console.log("Regenerated publication-filtered public listing data.");

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
