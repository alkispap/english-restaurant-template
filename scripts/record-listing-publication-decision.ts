import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import {
  applyPublicationDecision,
  type ListingPublicationDecisionProposal,
  type ListingPublicationLedger,
  type ListingPublicationRegistry
} from "../src/lib/listing-publication";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";
import { jsonFile, optionValue, writeTextFilesAtomically } from "./publication-script-utils";
import { absoluteDataOutputs, buildListingDataOutputs } from "./listing-data-output-utils";
import type { ImportedListing } from "../src/lib/directory-import";
import { confirmedListingEntityResolutions } from "../src/data/listing-entity-resolutions";

const args = process.argv.slice(2);
const write = args.includes("--write");
const proposalArg = args.find((arg) => !arg.startsWith("--"));
if (!proposalArg) throw new Error("Usage: npm run decide:listing-publication -- <proposal.json> [--write --expected-published-count=N]");

const dataDirectory = path.join(process.cwd(), "data");
const registryPath = path.join(dataDirectory, "listing-publication-states.json");
const ledgerPath = path.join(dataDirectory, "listing-publication-events.json");
const proposalPath = path.resolve(process.cwd(), proposalArg);
const registry = readJson<ListingPublicationRegistry>(registryPath);
const ledger = readJson<ListingPublicationLedger>(ledgerPath);
const verificationLedger = readJson<ListingVerificationLedger>(path.join(dataDirectory, "listing-verification-events.json"));
const retainedListings = readJson<ImportedListing[]>(path.join(dataDirectory, "listings.json"));
const proposal = readJson<ListingPublicationDecisionProposal>(proposalPath);
const listing = listings.find((item) => item.slug === proposal.listingSlug);
if (!listing) throw new Error(`Unknown listing slug: ${proposal.listingSlug}`);
const stateIndex = registry.entries.findIndex((state) => state.listingSlug === listing.slug);
if (stateIndex < 0) throw new Error(`Missing publication state: ${listing.slug}`);
if (proposal.next.successorSlug) {
  const successor = registry.entries.find((state) => state.listingSlug === proposal.next.successorSlug);
  if (!successor || successor.status !== "published") throw new Error(`Publication successor must exist and be published: ${proposal.next.successorSlug}`);
  if (successor.listingSlug === listing.slug) throw new Error("Publication successor cannot target the same listing.");
}

validateEvidenceReferences(proposal, verificationLedger);
const result = applyPublicationDecision({ slug: listing.slug, sourceId: listing.provenance?.sourceId }, registry.entries[stateIndex], proposal);
const existing = ledger.events.find((event) => event.id === result.event.id);
const nextPublishedCount = registry.entries.filter((state, index) => (index === stateIndex ? result.state : state).status === "published").length;

console.log(`Listing: ${listing.slug}`);
console.log(`Current: ${registry.entries[stateIndex].status} (${registry.entries[stateIndex].reason})`);
console.log(`Next: ${result.state.status} (${result.state.reason})`);
console.log(`Event: ${result.event.id}`);
console.log(`Published records after decision: ${nextPublishedCount.toLocaleString()}`);
if (existing) {
  if (registry.entries[stateIndex].lastDecisionEventId !== existing.id) throw new Error("Event already exists but the current state does not reference it.");
  console.log("Publication event already recorded. No files changed.");
  process.exit(0);
}
if (!write) {
  console.log("Dry run only. Pass --write with --expected-published-count=N to persist the state and event.");
  process.exit(0);
}
const expectedPublishedCount = Number(optionValue(args, "--expected-published-count"));
if (!Number.isInteger(expectedPublishedCount) || expectedPublishedCount !== nextPublishedCount) {
  throw new Error(`--expected-published-count must equal ${nextPublishedCount}`);
}

registry.entries[stateIndex] = result.state;
registry.entries.sort((left, right) => left.listingSlug.localeCompare(right.listingSlug));
ledger.events.push(result.event);
ledger.events.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt) || left.id.localeCompare(right.id));
const outputs = absoluteDataOutputs(dataDirectory, buildListingDataOutputs(retainedListings, registry));
outputs.set(registryPath, jsonFile(registry));
outputs.set(ledgerPath, jsonFile(ledger));
writeTextFilesAtomically(outputs);
console.log("Updated publication state and appended the publication decision ledger.");

function validateEvidenceReferences(proposal: ListingPublicationDecisionProposal, verification: ListingVerificationLedger) {
  for (const evidence of proposal.evidence) {
    if (evidence.type === "verification-event") {
      const event = verification.events.find((item) => item.id === evidence.eventId);
      if (!event) throw new Error(`Unknown verification event: ${evidence.eventId}`);
      if (event.listingSlug !== proposal.listingSlug) throw new Error(`Verification event belongs to ${event.listingSlug}, not ${proposal.listingSlug}`);
    }
    if (evidence.type === "entity-resolution") {
      const resolution = confirmedListingEntityResolutions.find((item) => item.id === evidence.resolutionId);
      if (!resolution) throw new Error(`Unknown entity resolution: ${evidence.resolutionId}`);
      if (!(resolution.aliasSlugs as readonly string[]).includes(proposal.listingSlug)) throw new Error(`Entity resolution does not retire ${proposal.listingSlug}`);
      if (proposal.next.successorSlug !== resolution.canonicalSlug) throw new Error(`Entity resolution successor must be ${resolution.canonicalSlug}`);
    }
  }
}

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
