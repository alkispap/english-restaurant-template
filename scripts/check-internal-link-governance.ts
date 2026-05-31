import { listings } from "../src/data/listings";
import { getListingExploreLinks } from "../src/lib/directory-growth";
import { buildInternalLinkAuditReport, renderInternalLinkAuditReport } from "../src/lib/internal-link-audit";

async function runAudit() {
  const sources = listings.map((listing) => ({
    sourcePageType: "listing_detail" as const,
    sourceLabel: listing.slug,
    groups: getListingExploreLinks(listing)
  }));

  const report = buildInternalLinkAuditReport(sources);
  console.log(renderInternalLinkAuditReport(report));

  if (report.totals.blockers > 0) {
    process.exit(1);
  }
}

runAudit().catch((error) => {
  console.error(error);
  process.exit(1);
});
