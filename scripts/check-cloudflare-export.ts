import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");
const maxFiles = 20_000;
const maxFileBytes = 25 * 1024 * 1024;

assert.ok(fs.existsSync(outDir), "out folder is missing. Run npm run build first.");

const files = listFiles(outDir);
assert.ok(files.length > 0, "out folder is empty. Run npm run build first.");
assert.ok(files.length <= maxFiles, `Cloudflare Pages Free supports up to ${maxFiles} files; found ${files.length}.`);

const oversizedFiles = files
  .map((file) => ({ file, size: fs.statSync(file).size }))
  .filter((asset) => asset.size > maxFileBytes);

assert.equal(
  oversizedFiles.length,
  0,
  `Cloudflare Pages assets must be 25 MiB or smaller. Oversized files: ${oversizedFiles
    .map((asset) => path.relative(process.cwd(), asset.file))
    .join(", ")}`
);

const sitemapPath = path.join(outDir, "sitemap.xml");
const robotsPath = path.join(outDir, "robots.txt");
const headersPath = path.join(outDir, "_headers");
assert.ok(fs.existsSync(sitemapPath), "out/sitemap.xml is missing.");
assert.ok(fs.existsSync(robotsPath), "out/robots.txt is missing.");
assert.ok(fs.existsSync(headersPath), "out/_headers is missing. Cloudflare cache header rules will not be uploaded.");

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const robots = fs.readFileSync(robotsPath, "utf8");
const headers = fs.readFileSync(headersPath, "utf8");
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

assert.ok(publicSiteUrl, "NEXT_PUBLIC_SITE_URL must be set to the final https production domain before publishing.");
assert.ok(publicSiteUrl.startsWith("https://"), "NEXT_PUBLIC_SITE_URL must use https before publishing.");
assert.ok(!publicSiteUrl.includes("localhost"), "NEXT_PUBLIC_SITE_URL must not point to localhost before publishing.");
assert.ok(sitemap.includes(publicSiteUrl), "sitemap.xml does not include NEXT_PUBLIC_SITE_URL.");
assert.ok(robots.includes(`${publicSiteUrl.replace(/\/$/, "")}/sitemap.xml`), "robots.txt does not point to the production sitemap.");
assert.ok(headers.includes("/_next/static/*"), "out/_headers must include long-cache rules for hashed Next assets.");
assert.ok(headers.includes("/vendor/leaflet/*"), "out/_headers must include long-cache rules for map vendor assets.");
assert.ok(
  headers.includes("Cache-Control: public, max-age=31536000, immutable"),
  "out/_headers must set immutable one-year caching for safe static assets."
);
assert.ok(
  headers.includes("/sitemap.xml") && headers.includes("/robots.txt") && headers.includes("max-age=0, must-revalidate"),
  "out/_headers must keep sitemap and robots revalidated."
);

console.log(`Cloudflare export checks passed: ${files.length.toLocaleString()} files, no asset over 25 MiB.`);

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}
