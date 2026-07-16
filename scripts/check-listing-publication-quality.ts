import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import type { ListingPublicationLedger, ListingPublicationRegistry } from "../src/lib/listing-publication";
import { auditListingPublicationQuality, renderListingPublicationQualityReport } from "../src/lib/listing-publication-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";

const dataDirectory = path.join(process.cwd(), "data");
const registry = readJson<ListingPublicationRegistry>(path.join(dataDirectory, "listing-publication-states.json"));
const ledger = readJson<ListingPublicationLedger>(path.join(dataDirectory, "listing-publication-events.json"));
const verificationLedger = readJson<ListingVerificationLedger>(path.join(dataDirectory, "listing-verification-events.json"));
const report = auditListingPublicationQuality(listings, registry, ledger, { verificationLedger });
console.log(renderListingPublicationQualityReport(report));
if (report.status !== "ready") process.exitCode = 1;

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
