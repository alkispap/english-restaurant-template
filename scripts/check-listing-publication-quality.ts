import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import type { ListingPublicationLedger, ListingPublicationRegistry } from "../src/lib/listing-publication";
import { auditListingPublicationQuality, renderListingPublicationQualityReport } from "../src/lib/listing-publication-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";
import { renderPublishedDirectoryDataFiles, type ImportedListing } from "../src/lib/directory-import";
import { unpackListingSearchRecords, type PackedListingSearchIndex } from "../src/lib/listing-search-index";
import { unpackShortlistSummaries, type PackedShortlistIndex } from "../src/lib/shortlist-index";
import { confirmedListingEntityResolutions } from "../src/data/listing-entity-resolutions";

const dataDirectory = path.join(process.cwd(), "data");
const registry = readJson<ListingPublicationRegistry>(path.join(dataDirectory, "listing-publication-states.json"));
const ledger = readJson<ListingPublicationLedger>(path.join(dataDirectory, "listing-publication-events.json"));
const verificationLedger = readJson<ListingVerificationLedger>(path.join(dataDirectory, "listing-verification-events.json"));
const importedListings = readJson<ImportedListing[]>(path.join(dataDirectory, "listings.json"));
const verboseSearch = readJson<Array<{ slug: string }>>(path.join(dataDirectory, "listing-search-records.json"));
const packedSearch = unpackListingSearchRecords(readJson<PackedListingSearchIndex>(path.join(dataDirectory, "listing-search-index.json")));
const verboseShortlist = readJson<Array<{ slug: string }>>(path.join(dataDirectory, "shortlist-summaries.json"));
const packedShortlist = unpackShortlistSummaries(readJson<PackedShortlistIndex>(path.join(dataDirectory, "shortlist-index.json")));
const rendered = renderPublishedDirectoryDataFiles(importedListings, registry);
const expectedFiles = new Map([
  ["listing-search-records.json", rendered.listingSearchRecordsJsonFile],
  ["listing-search-index.json", rendered.listingSearchIndexJsonFile],
  ["listing-filter-counts.json", rendered.listingFilterCountsJsonFile],
  ["shortlist-summaries.json", rendered.shortlistSummariesJsonFile],
  ["shortlist-index.json", rendered.shortlistIndexJsonFile]
]);
const derivativeIntegrityIssues = [...expectedFiles].filter(([filename, contents]) => fs.readFileSync(path.join(dataDirectory, filename), "utf8") !== contents).map(([filename]) => filename);
const report = auditListingPublicationQuality(listings, registry, ledger, {
  verificationLedger,
  entityResolutionIds: new Set(confirmedListingEntityResolutions.map((resolution) => resolution.id)),
  publicDerivativeSlugs: {
    verbose_search: verboseSearch.map((item) => item.slug),
    packed_search: packedSearch.map((item) => item.slug),
    verbose_shortlist: verboseShortlist.map((item) => item.slug),
    packed_shortlist: packedShortlist.map((item) => item.slug)
  },
  derivativeIntegrityIssues
});
console.log(renderListingPublicationQualityReport(report));
if (report.status !== "ready") process.exitCode = 1;

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
