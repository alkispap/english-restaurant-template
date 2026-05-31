import { listings } from "../src/data/listings";
import { buildFreshnessAuditReport, renderFreshnessAuditReport } from "../src/lib/freshness-audit";

if (require.main === module) {
  console.log(renderFreshnessAuditReport(buildFreshnessAuditReport(listings)));
}
