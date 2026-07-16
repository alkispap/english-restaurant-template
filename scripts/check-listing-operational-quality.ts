import { listings } from "../src/data/listings";
import { publishedListings } from "../src/data/listing-publication";
import {
  auditListingOperationalQuality,
  renderListingOperationalQualityReport
} from "../src/lib/listing-operational-quality";

const retainedReport = auditListingOperationalQuality(listings);
const publishedReport = auditListingOperationalQuality(publishedListings);
console.log(renderListingOperationalQualityReport(retainedReport, "Retained Listing Operational Quality Audit"));
console.log("");
console.log(renderListingOperationalQualityReport(publishedReport, "Published Listing Operational Quality Audit"));

if (retainedReport.verdict === "not_ready" || publishedReport.verdict === "not_ready") {
  process.exitCode = 1;
}
