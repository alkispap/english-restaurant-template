import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import { listingPublicationStateBySlug } from "../src/data/listing-publication";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";
import {
  prioritizeListingVerification,
  renderListingVerificationPriorityReport
} from "../src/lib/listing-verification-priority";

const ledger = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "listing-verification-events.json"), "utf8")
) as ListingVerificationLedger;
const requestedLimit = Number.parseInt(process.argv[2] ?? "50", 10);
const limit = Number.isInteger(requestedLimit) && requestedLimit >= 0 ? requestedLimit : 50;
const report = prioritizeListingVerification(listings, ledger, new Date(), listingPublicationStateBySlug);
console.log(renderListingVerificationPriorityReport(report, limit));
