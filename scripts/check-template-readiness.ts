import fs from "node:fs";
import path from "node:path";
import { directoryConfig } from "../src/config/directory";
import { siteConfig } from "../src/config/site";
import { listings } from "../src/data/listings";
import { publishedListings, listingPublicationRegistry } from "../src/data/listing-publication";
import { confirmedListingEntityResolutions } from "../src/data/listing-entity-resolutions";
import type { ListingPublicationLedger } from "../src/lib/listing-publication";
import { auditListingPublicationQuality } from "../src/lib/listing-publication-quality";
import type { ListingVerificationLedger } from "../src/lib/listing-verification";
import { buildTemplateReadinessReport, renderTemplateReadinessReport } from "../src/lib/template-readiness-audit";

const importReportPath = path.join(process.cwd(), "data", "import-report.md");
const importReportText = fs.existsSync(importReportPath) ? fs.readFileSync(importReportPath, "utf8") : undefined;
const publicationLedger = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "listing-publication-events.json"), "utf8")) as ListingPublicationLedger;
const verificationLedger = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "listing-verification-events.json"), "utf8")) as ListingVerificationLedger;
const publicationReport = auditListingPublicationQuality(listings, listingPublicationRegistry, publicationLedger, {
  verificationLedger,
  entityResolutionIds: new Set(confirmedListingEntityResolutions.map((resolution) => resolution.id))
});

if (require.main === module) {
  console.log(
    renderTemplateReadinessReport(
      buildTemplateReadinessReport({
        site: siteConfig,
        directory: directoryConfig,
        listings: publishedListings,
        importReportText,
        publicationReport
      })
    )
  );
}
