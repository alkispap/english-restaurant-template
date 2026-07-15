import { listings } from "../src/data/listings";
import {
  auditListingOperationalQuality,
  renderListingOperationalQualityReport
} from "../src/lib/listing-operational-quality";

const report = auditListingOperationalQuality(listings);
console.log(renderListingOperationalQualityReport(report));

if (report.verdict === "not_ready") {
  process.exitCode = 1;
}
