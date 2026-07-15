import fs from "node:fs";
import path from "node:path";
import type { Listing } from "../src/data/listings";
import {
  renderListingFilterCountsJsonFile,
  renderListingSearchIndexJsonFile,
  renderListingSearchRecordsJsonFile,
  renderListingsJsonFile,
  renderShortlistIndexJsonFile,
  renderShortlistSummariesJsonFile,
  type ImportedListing
} from "../src/lib/directory-import";
import { isApprovedListingMediaAsset, type ListingMediaRegistry } from "../src/lib/listing-media-provenance";

const write = process.argv.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const registryPath = path.join(dataDirectory, "listing-media-provenance.json");
const listings = JSON.parse(fs.readFileSync(path.join(dataDirectory, "listings.json"), "utf8")) as Listing[];
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as ListingMediaRegistry;
const assetByUrl = new Map(registry.assets.map((asset) => [asset.url, asset]));
let removedGalleryUrls = 0;
let removedMenuUrls = 0;
let removedLogos = 0;

const isPublishable = (url: string) => {
  const asset = assetByUrl.get(url);
  return Boolean(asset && asset.publicationStatus === "published" && isApprovedListingMediaAsset(asset));
};

const cleaned = listings.map((listing) => {
  const images = listing.images.filter(isPublishable);
  const menuImages = (listing.menuImages ?? []).filter(isPublishable);
  const logo = listing.logo && isPublishable(listing.logo) ? listing.logo : undefined;
  removedGalleryUrls += listing.images.length - images.length;
  removedMenuUrls += (listing.menuImages ?? []).length - menuImages.length;
  removedLogos += Number(Boolean(listing.logo && !logo));
  return {
    ...listing,
    images,
    ...(menuImages.length ? { menuImages } : { menuImages: undefined }),
    ...(logo ? { logo } : { logo: undefined })
  };
});

for (const asset of registry.assets) {
  if (!isApprovedListingMediaAsset(asset)) asset.publicationStatus = "quarantined";
}

console.log(`Removed unapproved gallery URLs: ${removedGalleryUrls}`);
console.log(`Removed unapproved menu URLs: ${removedMenuUrls}`);
console.log(`Removed unapproved logos: ${removedLogos}`);
console.log(`Quarantined registry URLs: ${registry.assets.filter((asset) => asset.publicationStatus === "quarantined").length}`);

if (!write) {
  console.log("Dry run only. Pass --write to update published listing data and derived indexes.");
  process.exit(0);
}

const imported = cleaned as ImportedListing[];
const outputs = new Map<string, string>([
  ["listings.json", renderListingsJsonFile(imported)],
  ["listing-search-records.json", renderListingSearchRecordsJsonFile(imported)],
  ["listing-search-index.json", renderListingSearchIndexJsonFile(imported)],
  ["listing-filter-counts.json", renderListingFilterCountsJsonFile(imported)],
  ["shortlist-summaries.json", renderShortlistSummariesJsonFile(imported)],
  ["shortlist-index.json", renderShortlistIndexJsonFile(imported)]
]);
for (const [filename, contents] of outputs) fs.writeFileSync(path.join(dataDirectory, filename), contents, "utf8");
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(`Updated ${outputs.size} canonical/derived data files plus the media registry.`);
