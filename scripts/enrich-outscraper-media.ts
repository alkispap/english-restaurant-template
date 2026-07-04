import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type { Listing } from "../src/data/listings";
import { enrichListingsWithOutscraperMedia, parseOutscraperPhotoCsv, type OutscraperPhotoRow } from "../src/lib/outscraper-media-enrichment";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const listingsPath = path.join(root, "data/listings.json");
const defaultCsvPaths = [
  "C:\\Users\\user\\Desktop\\Outscraper-20260604054319m10.csv",
  "C:\\Users\\user\\Desktop\\Outscraper-20260604054426m03.csv"
];
const csvPaths = args.filter((arg) => !arg.startsWith("--"));
const inputPaths = csvPaths.length ? csvPaths.map((csvPath) => path.resolve(root, csvPath)) : defaultCsvPaths;

for (const inputPath of inputPaths) {
  if (!fs.existsSync(inputPath)) {
    console.error(`CSV file not found: ${inputPath}`);
    process.exit(1);
  }
}

if (!fs.existsSync(listingsPath)) {
  console.error(`Listings file not found: ${listingsPath}`);
  process.exit(1);
}

const listings = JSON.parse(fs.readFileSync(listingsPath, "utf8")) as Listing[];
const photoRows = inputPaths.flatMap(readOutscraperRows);
const result = enrichListingsWithOutscraperMedia(listings, photoRows);

printReport(result.report, inputPaths);

if (dryRun) {
  console.log("Dry run complete. No files were changed.");
} else {
  fs.writeFileSync(listingsPath, `${JSON.stringify(result.listings, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(root, listingsPath)}`);
}

function readOutscraperRows(inputPath: string): OutscraperPhotoRow[] {
  return parseOutscraperPhotoCsv(fs.readFileSync(inputPath, "utf8"));
}

function printReport(report: typeof result.report, inputPaths: string[]) {
  console.log("Outscraper media enrichment report");
  console.log(`CSV files: ${inputPaths.length}`);
  inputPaths.forEach((inputPath) => console.log(`- ${inputPath}`));
  console.log(`Source rows: ${report.sourceRows}`);
  console.log(`Usable photo rows: ${report.usablePhotoRows}`);
  console.log(`Matched photo rows: ${report.matchedPhotoRows}`);
  console.log(`Matched restaurants: ${report.matchedRestaurants}`);
  console.log(`Restaurants with images: ${report.restaurantsWithImages}`);
  console.log(`Restaurants with five photos: ${report.restaurantsWithFivePhotos}`);
  console.log(`Restaurants with menu photos: ${report.restaurantsWithMenuImages}`);
}
