import fs from "node:fs";
import path from "node:path";
import type { ListingPublicationRegistry } from "../src/lib/listing-publication";
import {
  renderListingsJsonFile,
  renderPublishedDirectoryDataFiles,
  type ImportedListing
} from "../src/lib/directory-import";

export function readListingPublicationRegistry(dataDirectory: string) {
  return JSON.parse(fs.readFileSync(path.join(dataDirectory, "listing-publication-states.json"), "utf8")) as ListingPublicationRegistry;
}

export function buildListingDataOutputs(listings: ImportedListing[], registry: ListingPublicationRegistry) {
  const rendered = renderPublishedDirectoryDataFiles(listings, registry);
  return new Map<string, string>([
    ["listings.json", renderListingsJsonFile(listings)],
    ["listing-search-records.json", rendered.listingSearchRecordsJsonFile],
    ["listing-search-index.json", rendered.listingSearchIndexJsonFile],
    ["listing-filter-counts.json", rendered.listingFilterCountsJsonFile],
    ["shortlist-summaries.json", rendered.shortlistSummariesJsonFile],
    ["shortlist-index.json", rendered.shortlistIndexJsonFile]
  ]);
}

export function absoluteDataOutputs(dataDirectory: string, outputs: ReadonlyMap<string, string>) {
  return new Map([...outputs].map(([filename, contents]) => [path.join(dataDirectory, filename), contents]));
}
