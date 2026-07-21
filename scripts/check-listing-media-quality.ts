import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";
import { auditListingMediaQuality, renderListingMediaQualityReport } from "../src/lib/listing-media-quality";
import type { ListingMediaRegistry } from "../src/lib/listing-media-provenance";

const registryPath = path.join(process.cwd(), "data", "listing-media-provenance.json");
if (!fs.existsSync(registryPath)) throw new Error("Media provenance registry is missing. Run npm run backfill:listing-media first.");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as ListingMediaRegistry;
const report = auditListingMediaQuality(listings, registry);
console.log(renderListingMediaQualityReport(report));
if (report.verdict === "not_ready") process.exitCode = 1;
