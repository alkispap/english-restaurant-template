import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import {
  auditListingVerificationQuality,
  renderListingVerificationQualityReport
} from "../src/lib/listing-verification-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";

const ledger = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "listing-verification-events.json"), "utf8")
) as ListingVerificationLedger;
const report = auditListingVerificationQuality(listings, ledger);
console.log(renderListingVerificationQualityReport(report));
if (report.verdict === "not_ready") process.exitCode = 1;
