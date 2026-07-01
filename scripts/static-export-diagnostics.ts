import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { listings } from "../src/data/listings";
import {
  getStaticAreaCategoryParams,
  getStaticAreaParams,
  getStaticCategoryParams,
  getStaticFacetParams,
  getStaticNeighborhoodParams,
  getStaticPopularSearchParams
} from "../src/lib/static-route-params";
import { getPublicGuideArticles } from "../src/lib/articles";

process.env.NEXT_STATIC_EXPORT = "1";

const outDir = path.join(process.cwd(), "out");
const expectedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

console.log("Static export diagnostics");
console.log(`NEXT_PUBLIC_SITE_URL: ${expectedSiteUrl || "not set"}`);
console.log("");

reportRouteFamilies();
console.log("");
reportOutFolder();
console.log("");
reportStaticSeoFiles();

function reportRouteFamilies() {
  console.log("route families");
  const families: Record<string, () => unknown[]> = {
    areas: getStaticAreaParams,
    "area categories": getStaticAreaCategoryParams,
    "popular searches": getStaticPopularSearchParams,
    categories: getStaticCategoryParams,
    dietary: () => getStaticFacetParams("dietary", "dietary"),
    listings: () => listings.map((listing) => ({ slug: listing.slug })),
    neighborhoods: getStaticNeighborhoodParams,
    offerings: () => getStaticFacetParams("offering", "offering"),
    services: () => getStaticFacetParams("service", "service"),
    types: () => getStaticFacetParams("type", "type"),
    guides: () => getPublicGuideArticles().map((article) => ({ slug: article.slug }))
  };

  let total = 0;
  for (const [name, fn] of Object.entries(families)) {
    const start = performance.now();
    const params = fn();
    const elapsed = Math.round(performance.now() - start);
    total += params.length;
    console.log(`- ${name}: ${params.length.toLocaleString()} params in ${elapsed.toLocaleString()}ms`);
  }
  console.log(`- total dynamic params: ${total.toLocaleString()}`);
}

function reportOutFolder() {
  console.log("out folder");
  if (!fs.existsSync(outDir)) {
    console.log("- out folder missing");
    return;
  }

  const files = listFiles(outDir);
  const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  console.log(`- files: ${files.length.toLocaleString()}`);
  console.log(`- size: ${formatBytes(totalBytes)}`);

  console.log("- size by top folder:");
  for (const group of groupByTopFolder(files).slice(0, 20)) {
    console.log(`  - ${group.name}: ${group.count.toLocaleString()} files, ${formatBytes(group.bytes)}`);
  }

  console.log("- largest files:");
  for (const file of files
    .map((filePath) => ({ filePath, bytes: fs.statSync(filePath).size }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20)) {
    console.log(`  - ${path.relative(process.cwd(), file.filePath)}: ${formatBytes(file.bytes)}`);
  }
}

function reportStaticSeoFiles() {
  console.log("sitemap.xml and robots.txt");
  const sitemapPath = path.join(outDir, "sitemap.xml");
  const robotsPath = path.join(outDir, "robots.txt");

  for (const filePath of [sitemapPath, robotsPath]) {
    const label = path.basename(filePath);
    if (!fs.existsSync(filePath)) {
      console.log(`- ${label}: missing`);
      continue;
    }

    const source = fs.readFileSync(filePath, "utf8");
    const containsExpectedSiteUrl = Boolean(expectedSiteUrl && source.includes(expectedSiteUrl));
    console.log(`- ${label}: ${formatBytes(fs.statSync(filePath).size)}, production URL ${containsExpectedSiteUrl ? "present" : "missing"}`);
  }
}

function listFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function groupByTopFolder(files: string[]) {
  const groups = new Map<string, { name: string; count: number; bytes: number }>();
  const root = path.resolve(outDir);

  for (const file of files) {
    const relative = path.relative(root, file);
    const name = relative.split(path.sep)[0] || relative;
    const group = groups.get(name) ?? { name, count: 0, bytes: 0 };
    group.count += 1;
    group.bytes += fs.statSync(file).size;
    groups.set(name, group);
  }

  return Array.from(groups.values()).sort((a, b) => b.bytes - a.bytes);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
