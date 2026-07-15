import fs from "node:fs";
import path from "node:path";
import {
  renderListingFilterCountsJsonFile,
  renderListingSearchIndexJsonFile,
  renderListingSearchRecordsJsonFile,
  renderListingsJsonFile,
  renderShortlistIndexJsonFile,
  renderShortlistSummariesJsonFile,
  type ImportedListing
} from "../src/lib/directory-import";
import {
  applyListingVerification,
  validateListingVerificationProposal,
  type ListingVerificationLedger,
  type ListingVerificationProposal
} from "../src/lib/listing-verification";

const write = process.argv.includes("--write");
const proposalArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
if (!proposalArgument) {
  throw new Error("Usage: npm run verify:listing -- <proposal.json> [--write]");
}

const root = process.cwd();
const dataDirectory = path.join(root, "data");
const listingsPath = path.join(dataDirectory, "listings.json");
const ledgerPath = path.join(dataDirectory, "listing-verification-events.json");
const proposalPath = path.resolve(root, proposalArgument);
const listings = JSON.parse(fs.readFileSync(listingsPath, "utf8")) as ImportedListing[];
const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8")) as ListingVerificationLedger;
const proposal = JSON.parse(fs.readFileSync(proposalPath, "utf8")) as ListingVerificationProposal;
const listingIndex = listings.findIndex((listing) => listing.slug === proposal.listingSlug);
const listing = listingIndex >= 0 ? listings[listingIndex] : undefined;
const errors = validateListingVerificationProposal(listing, proposal);
if (errors.length) throw new Error(`Verification proposal refused:\n- ${errors.join("\n- ")}`);

const result = applyListingVerification(listing!, proposal);
const existingEvent = ledger.events.find((event) => event.id === result.event.id);
if (existingEvent) {
  console.log(`Verification event already recorded: ${result.event.id}`);
  console.log("No files changed.");
  process.exit(0);
}

console.log(`Listing: ${listing!.slug}`);
console.log(`Outcome: ${result.event.outcome}`);
console.log(`Checked fields: ${result.event.fieldsChecked.length}`);
console.log(`Proposed changes: ${result.event.changes.length}`);
console.log(`Applied changes: ${result.event.changes.filter((change) => change.applied).length}`);
console.log(`Event ID: ${result.event.id}`);

if (!write) {
  console.log("Dry run only. Pass --write to update canonical/derived listing data and append the event ledger.");
  process.exit(0);
}

listings[listingIndex] = result.listing as ImportedListing;
ledger.events.push(result.event);
ledger.events.sort((left, right) => left.recordedAt.localeCompare(right.recordedAt) || left.id.localeCompare(right.id));

const outputs = new Map<string, string>([
  ["listings.json", renderListingsJsonFile(listings)],
  ["listing-search-records.json", renderListingSearchRecordsJsonFile(listings)],
  ["listing-search-index.json", renderListingSearchIndexJsonFile(listings)],
  ["listing-filter-counts.json", renderListingFilterCountsJsonFile(listings)],
  ["shortlist-summaries.json", renderShortlistSummariesJsonFile(listings)],
  ["shortlist-index.json", renderShortlistIndexJsonFile(listings)]
]);
for (const [filename, contents] of outputs) fs.writeFileSync(path.join(dataDirectory, filename), contents, "utf8");
fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
console.log(`Updated ${outputs.size} canonical/derived data files and appended the verification ledger.`);
