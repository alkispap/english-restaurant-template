import { listings } from "../src/data/listings";
import {
  assertDirectoryFreshForRelease,
  buildFreshnessAuditReport,
  renderFreshnessAuditReport
} from "../src/lib/freshness-audit";

if (require.main === module) {
  const report = buildFreshnessAuditReport(listings);
  console.log(renderFreshnessAuditReport(report));
  assertDirectoryFreshForRelease(report);
}
