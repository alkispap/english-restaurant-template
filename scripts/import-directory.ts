import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  analyzeDirectoryFile,
  renderListingsFile,
  renderReport,
  renderReportForListings,
  selectCuratedRestaurantSample
} from "../src/lib/directory-import";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sampleArg = args.find((arg) => arg.startsWith("--sample"));
const sampleSize = sampleArg ? parseSampleSize(sampleArg) : undefined;
const inputArg = args.find((arg) => !arg.startsWith("--"));
const inputPath = path.resolve(root, inputArg ?? "data/directory.csv");
const outputPath = path.resolve(root, "src/data/listings.ts");
const reportPath = path.resolve(root, "data/import-report.md");

if (!fs.existsSync(inputPath)) {
  console.error(`CSV file not found: ${inputPath}`);
  console.error("Place your file at data/directory.csv or run: npm run import:directory -- data/your-file.csv");
  process.exit(1);
}

const result = analyzeDirectoryFile(inputPath, dryRun ? "dry run" : "normal import");
const importedListings = sampleSize ? selectCuratedRestaurantSample(result.listings, { size: sampleSize }) : result.listings;
const reportData = sampleSize ? renderReportForListings(result.reportData, importedListings, "curated sample") : result.reportData;
const report = sampleSize
  ? `${renderReport(reportData)}\n## Curated Sample\n\n- Requested sample size: ${sampleSize}\n- Sample listings selected: ${importedListings.length}\n- Selection strategy: broad coverage across areas, cuisines, types, prices, dietary options, services, images, ratings, and review counts.\n`
  : result.report;

if (dryRun) {
  console.log(report);
  console.log("Dry run complete. No files were changed.");
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sampleSize ? renderListingsFile(importedListings) : result.listingsFile, "utf8");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");
  console.log(`Imported ${importedListings.length} listings from ${path.relative(root, inputPath)}`);
  console.log(`Updated ${path.relative(root, outputPath)}`);
  console.log(`Wrote ${path.relative(root, reportPath)}`);
}

function parseSampleSize(value: string) {
  const explicit = value.includes("=") ? value.split("=").at(-1) : undefined;
  const parsed = Number(explicit || 120);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 120;
}
