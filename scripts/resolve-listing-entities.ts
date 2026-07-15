import fs from "node:fs";
import path from "node:path";
import { confirmedListingEntityResolutions } from "../src/data/listing-entity-resolutions";
import {
  mergeDuplicateListing,
  renderListingFilterCountsJsonFile,
  renderListingSearchIndexJsonFile,
  renderListingSearchRecordsJsonFile,
  renderListingsJsonFile,
  renderShortlistIndexJsonFile,
  renderShortlistSummariesJsonFile,
  type ImportedListing
} from "../src/lib/directory-import";

const write = process.argv.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const listingsPath = path.join(dataDirectory, "listings.json");
const listings = JSON.parse(fs.readFileSync(listingsPath, "utf8")) as ImportedListing[];
const retiredSlugs = new Set<string>();
let mergedCount = 0;

for (const resolution of confirmedListingEntityResolutions) {
  const canonical = listings.find((listing) => listing.slug === resolution.canonicalSlug);
  if (!canonical) throw new Error(`Missing canonical listing: ${resolution.canonicalSlug}`);

  const canonicalSourceId = typeof canonical.details?.placeId === "string" ? canonical.details.placeId : "";
  if (canonicalSourceId !== resolution.canonicalSourceId) {
    throw new Error(
      `Canonical source ID mismatch for ${resolution.canonicalSlug}: expected ${resolution.canonicalSourceId}, found ${canonicalSourceId || "none"}`
    );
  }

  for (const [index, aliasSlug] of resolution.aliasSlugs.entries()) {
    const alias = listings.find((listing) => listing.slug === aliasSlug);
    if (!alias) continue;

    const expectedAliasSourceId = resolution.aliasSourceIds[index];
    const aliasSourceId = typeof alias.details?.placeId === "string" ? alias.details.placeId : "";
    if (aliasSourceId !== expectedAliasSourceId) {
      throw new Error(
        `Alias source ID mismatch for ${aliasSlug}: expected ${expectedAliasSourceId}, found ${aliasSourceId || "none"}`
      );
    }

    mergeDuplicateListing(canonical, alias);
    retiredSlugs.add(aliasSlug);
    mergedCount += 1;
  }
}

const resolvedListings = listings.filter((listing) => !retiredSlugs.has(listing.slug));
console.log(`Confirmed entity aliases found: ${mergedCount}`);
console.log(`Listings before: ${listings.length}`);
console.log(`Listings after: ${resolvedListings.length}`);

if (!write) {
  console.log("Dry run only. Pass --write to update the canonical dataset and derived indexes.");
  process.exit(0);
}

const outputs = new Map<string, string>([
  ["listings.json", renderListingsJsonFile(resolvedListings)],
  ["listing-search-records.json", renderListingSearchRecordsJsonFile(resolvedListings)],
  ["listing-search-index.json", renderListingSearchIndexJsonFile(resolvedListings)],
  ["listing-filter-counts.json", renderListingFilterCountsJsonFile(resolvedListings)],
  ["shortlist-summaries.json", renderShortlistSummariesJsonFile(resolvedListings)],
  ["shortlist-index.json", renderShortlistIndexJsonFile(resolvedListings)]
]);

for (const [filename, contents] of outputs) {
  fs.writeFileSync(path.join(dataDirectory, filename), contents, "utf8");
}

console.log(`Updated ${outputs.size} canonical and derived data files.`);
