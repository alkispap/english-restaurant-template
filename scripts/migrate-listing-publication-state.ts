import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import {
  applyPublicationDecision,
  type ListingPublicationDecisionProposal,
  type ListingPublicationLedger,
  type ListingPublicationRegistry,
  type ListingPublicationState
} from "../src/lib/listing-publication";
import { auditListingPublicationQuality, renderListingPublicationQualityReport } from "../src/lib/listing-publication-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";
import { jsonFile, optionValue, writeTextFilesAtomically } from "./publication-script-utils";

const EXPECTED_LISTING_COUNT = 3186;
const EXPECTED_SOURCE_SHA256 = "2fb739ae941936c598d8e9d88058e4df840da52ccb7ebc3f899f362c7e4b23d9";
const MIGRATION_AT = "2026-07-16T07:00:00.000Z";
const conflictReasons = new Map<string, "identity-uncertain" | "material-data-conflict">([
  ["biriyani-junction", "identity-uncertain"],
  ["spikky-pepperdem-food", "identity-uncertain"],
  ["chotiwala", "material-data-conflict"],
  ["golis-south-norwood", "material-data-conflict"]
]);

const args = process.argv.slice(2);
const write = args.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const listingsPath = path.join(dataDirectory, "listings.json");
const registryPath = path.join(dataDirectory, "listing-publication-states.json");
const ledgerPath = path.join(dataDirectory, "listing-publication-events.json");
const verificationLedger = readJson<ListingVerificationLedger>(path.join(dataDirectory, "listing-verification-events.json"));
const sourceSha256 = crypto.createHash("sha256").update(fs.readFileSync(listingsPath)).digest("hex");

if (listings.length !== EXPECTED_LISTING_COUNT) throw new Error(`Expected ${EXPECTED_LISTING_COUNT} listings, found ${listings.length}`);
if (sourceSha256 !== EXPECTED_SOURCE_SHA256) throw new Error(`Canonical listings hash changed: ${sourceSha256}`);
if (new Set(listings.map((listing) => listing.slug)).size !== listings.length) throw new Error("Canonical listing slugs are not unique.");

const entries: ListingPublicationState[] = listings.map((listing) => ({
  listingSlug: listing.slug,
  listingSourceId: listing.provenance?.sourceId,
  status: "published",
  reason: "legacy-public-baseline",
  origin: "migration-baseline",
  effectiveAt: MIGRATION_AT,
  changedBy: "system:migration"
} satisfies ListingPublicationState)).sort((left, right) => left.listingSlug.localeCompare(right.listingSlug));
const registry: ListingPublicationRegistry = {
  version: 1,
  baseline: {
    id: `publication-baseline-${MIGRATION_AT.slice(0, 10)}-${sourceSha256.slice(0, 12)}`,
    createdAt: MIGRATION_AT,
    sourceSha256,
    listingCount: listings.length,
    actor: "system:migration",
    reason: "legacy-public-baseline"
  },
  entries
};
const ledger: ListingPublicationLedger = { version: 1, events: [] };

let offset = 1;
for (const [slug, reason] of conflictReasons) {
  const listing = listings.find((item) => item.slug === slug);
  const stateIndex = registry.entries.findIndex((state) => state.listingSlug === slug);
  const verificationEvent = latestNeedsReviewEvent(verificationLedger, slug);
  if (!listing || stateIndex < 0 || !verificationEvent) throw new Error(`Missing migration evidence for ${slug}`);
  const reviewedAt = new Date(new Date(MIGRATION_AT).getTime() + offset * 1000).toISOString();
  offset += 1;
  const proposal: ListingPublicationDecisionProposal = {
    listingSlug: slug,
    expectedSourceId: listing.provenance?.sourceId,
    expectedCurrent: { status: "published", reason: "legacy-public-baseline" },
    reviewedAt,
    reviewedBy: "directory-editor",
    next: { status: "pending-review", reason },
    evidence: [{ type: "verification-event", eventId: verificationEvent.id }],
    notes: "The existing verification event records unresolved current identity or premises evidence. Keep the historical listing, make no closure claim, and withhold operational details from public discovery until direct evidence resolves the conflict."
  };
  const result = applyPublicationDecision(
    { slug, sourceId: listing.provenance?.sourceId },
    registry.entries[stateIndex],
    proposal,
    reviewedAt
  );
  registry.entries[stateIndex] = result.state;
  ledger.events.push(result.event);
}
registry.entries.sort((left, right) => left.listingSlug.localeCompare(right.listingSlug));
ledger.events.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt) || left.id.localeCompare(right.id));

const report = auditListingPublicationQuality(listings, registry, ledger, {
  sourceSha256,
  verificationLedger,
  now: new Date("2026-07-16T12:00:00.000Z")
});
console.log(renderListingPublicationQualityReport(report));
if (report.status !== "ready") throw new Error("Generated publication migration failed its integrity audit.");
if (report.counts.published !== 3182 || report.counts.pendingReview !== 4 || report.counts.excluded !== 0) {
  throw new Error("Generated publication counts do not match the approved migration.");
}

if (!write) {
  console.log("Dry run complete. No files changed.");
  process.exit(0);
}
if (Number(optionValue(args, "--expected-listings")) !== EXPECTED_LISTING_COUNT) throw new Error(`--expected-listings must equal ${EXPECTED_LISTING_COUNT}`);
if (Number(optionValue(args, "--expected-published")) !== 3182) throw new Error("--expected-published must equal 3182");
if (fs.existsSync(registryPath) || fs.existsSync(ledgerPath)) throw new Error("Publication migration files already exist; refuse to overwrite history.");
writeTextFilesAtomically(new Map([[registryPath, jsonFile(registry)], [ledgerPath, jsonFile(ledger)]]));
console.log("Created the publication baseline and four pending-review decisions.");

function latestNeedsReviewEvent(verification: ListingVerificationLedger, slug: string) {
  return verification.events
    .filter((event) => event.listingSlug === slug && event.outcome === "needs-review")
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt) || right.id.localeCompare(left.id))[0];
}

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
