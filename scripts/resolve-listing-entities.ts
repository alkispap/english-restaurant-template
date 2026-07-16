import fs from "node:fs";
import path from "node:path";
import { confirmedListingEntityResolutions } from "../src/data/listing-entity-resolutions";
import { applyPublicationDecision, snapshotFromState, type ListingPublicationLedger, type ListingPublicationRegistry } from "../src/lib/listing-publication";
import { mergeDuplicateListing, type ImportedListing } from "../src/lib/directory-import";
import { absoluteDataOutputs, buildListingDataOutputs } from "./listing-data-output-utils";
import { jsonFile, optionValue, writeTextFilesAtomically } from "./publication-script-utils";

const args = process.argv.slice(2);
const write = args.includes("--write");
const dataDirectory = path.join(process.cwd(), "data");
const listings = readJson<ImportedListing[]>(path.join(dataDirectory, "listings.json"));
const registryPath = path.join(dataDirectory, "listing-publication-states.json");
const ledgerPath = path.join(dataDirectory, "listing-publication-events.json");
const registry = readJson<ListingPublicationRegistry>(registryPath);
const ledger = readJson<ListingPublicationLedger>(ledgerPath);
let appliedCount = 0;

for (const resolution of confirmedListingEntityResolutions) {
  const canonical = listings.find((listing) => listing.slug === resolution.canonicalSlug);
  if (!canonical) throw new Error(`Missing canonical listing: ${resolution.canonicalSlug}`);
  const canonicalSourceId = canonical.provenance?.sourceId ?? canonical.details?.placeId;
  if (canonicalSourceId !== resolution.canonicalSourceId) throw new Error(`Canonical source ID mismatch for ${resolution.canonicalSlug}`);
  const canonicalState = registry.entries.find((state) => state.listingSlug === canonical.slug);
  if (!canonicalState || canonicalState.status !== "published") throw new Error(`Entity successor must be published: ${canonical.slug}`);

  for (const [index, aliasSlug] of resolution.aliasSlugs.entries()) {
    const alias = listings.find((listing) => listing.slug === aliasSlug);
    if (!alias) continue;
    const expectedAliasSourceId = resolution.aliasSourceIds[index];
    const aliasSourceId = alias.provenance?.sourceId ?? alias.details?.placeId;
    if (aliasSourceId !== expectedAliasSourceId) throw new Error(`Alias source ID mismatch for ${aliasSlug}`);
    const stateIndex = registry.entries.findIndex((state) => state.listingSlug === aliasSlug);
    if (stateIndex < 0) throw new Error(`Missing publication state for alias: ${aliasSlug}`);
    const current = registry.entries[stateIndex];
    if (current.status === "excluded" && current.successorSlug === canonical.slug) continue;

    mergeDuplicateListing(canonical, alias);
    const result = applyPublicationDecision(
      { slug: alias.slug, sourceId: alias.provenance?.sourceId },
      current,
      {
        listingSlug: alias.slug,
        expectedSourceId: alias.provenance?.sourceId,
        expectedCurrent: snapshotFromState(current),
        reviewedAt: resolution.reviewedAt,
        reviewedBy: resolution.reviewedBy,
        next: { status: "excluded", reason: "superseded-by-canonical", successorSlug: canonical.slug },
        evidence: [{ type: "entity-resolution", resolutionId: resolution.id }],
        notes: resolution.reason
      },
      resolution.reviewedAt
    );
    registry.entries[stateIndex] = result.state;
    if (!ledger.events.some((event) => event.id === result.event.id)) ledger.events.push(result.event);
    appliedCount += 1;
  }
}

const publishedCount = registry.entries.filter((state) => state.status === "published").length;
console.log(`Evidence-backed entity resolutions newly applicable: ${appliedCount}`);
console.log(`Retained listings after resolution: ${listings.length}`);
console.log(`Published listings after resolution: ${publishedCount}`);
if (!write) {
  console.log("Dry run only. Retired records remain retained; pass --write with expected counts to apply decisions and redirects.");
  process.exit(0);
}
if (Number(optionValue(args, "--expected-resolutions")) !== appliedCount) throw new Error(`--expected-resolutions must equal ${appliedCount}`);
if (Number(optionValue(args, "--expected-published-count")) !== publishedCount) throw new Error(`--expected-published-count must equal ${publishedCount}`);
if (appliedCount === 0) {
  console.log("No new entity resolutions to apply. No files changed.");
  process.exit(0);
}

registry.entries.sort((left, right) => left.listingSlug.localeCompare(right.listingSlug));
ledger.events.sort((left, right) => left.reviewedAt.localeCompare(right.reviewedAt) || left.id.localeCompare(right.id));
const outputs = absoluteDataOutputs(dataDirectory, buildListingDataOutputs(listings, registry));
outputs.set(registryPath, jsonFile(registry));
outputs.set(ledgerPath, jsonFile(ledger));
writeTextFilesAtomically(outputs);
console.log(`Applied ${appliedCount} non-destructive entity resolution decisions.`);

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
