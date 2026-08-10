import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { securityHeaders } from "../src/config/security-headers.mjs";
import { activeDirectoryPack } from "../src/config/directory-packs";

const outDir = path.join(process.cwd(), "out");
const maxFiles = 100_000;
const maxFileBytes = 25 * 1024 * 1024;

assert.ok(fs.existsSync(outDir), "out folder is missing. Run npm run build first.");

const files = listFiles(outDir);
assert.ok(files.length > 0, "out folder is empty. Run npm run build first.");
assert.ok(
  files.length <= maxFiles,
  `Cloudflare Pages paid plans support up to ${maxFiles} files when PAGES_WRANGLER_MAJOR_VERSION=4 is configured; found ${files.length}.`
);

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
const redirectsPath = path.join(outDir, "_redirects");
const faviconPath = path.join(outDir, "favicon.ico");
assert.ok(fs.existsSync(sitemapPath), "out/sitemap.xml is missing.");
assert.ok(fs.existsSync(robotsPath), "out/robots.txt is missing.");
assert.ok(fs.existsSync(headersPath), "out/_headers is missing. Cloudflare cache header rules will not be uploaded.");
assert.ok(fs.existsSync(redirectsPath), "out/_redirects is missing. Legacy listing redirects will not be uploaded.");
assert.ok(fs.existsSync(faviconPath), "out/favicon.ico is missing. Browser favicon requests would return 404.");
const favicon = fs.readFileSync(faviconPath);
assert.equal(favicon.readUInt16LE(0), 0, "out/favicon.ico has an invalid ICO reserved field.");
assert.equal(favicon.readUInt16LE(2), 1, "out/favicon.ico is not a valid ICO image.");
assert.ok(favicon.readUInt16LE(4) > 0, "out/favicon.ico contains no images.");

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const robots = fs.readFileSync(robotsPath, "utf8");
const headers = fs.readFileSync(headersPath, "utf8");
const redirects = fs.readFileSync(redirectsPath, "utf8");
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || activeDirectoryPack.productionUrl;

assert.ok(publicSiteUrl.startsWith("https://"), "NEXT_PUBLIC_SITE_URL must use https before publishing.");
assert.ok(!publicSiteUrl.includes("localhost"), "NEXT_PUBLIC_SITE_URL must not point to localhost before publishing.");
assert.ok(sitemap.includes(publicSiteUrl), "sitemap.xml does not include NEXT_PUBLIC_SITE_URL.");
assert.ok(robots.includes(`${publicSiteUrl.replace(/\/$/, "")}/sitemap.xml`), "robots.txt does not point to the production sitemap.");
assert.ok(headers.includes("/_next/static/*"), "out/_headers must include long-cache rules for hashed Next assets.");
assert.ok(headers.includes("/vendor/leaflet/*"), "out/_headers must include long-cache rules for map vendor assets.");
for (const { key, value } of securityHeaders) {
  assert.ok(headers.includes(`  ${key}: ${value}`), `out/_headers must include the shared ${key} policy.`);
}
assert.ok(
  !headers.includes(`${publicSiteUrl.replace(/\/$/, "")}/robots.txt`) &&
    !headers.includes(`${publicSiteUrl.replace(/\/$/, "")}/sitemap.xml`),
  "out/_headers must not duplicate robots or sitemap rules with production-domain entries."
);
assert.ok(
  headers.includes("Cache-Control: public, max-age=31536000, immutable"),
  "out/_headers must set immutable one-year caching for safe static assets."
);
assert.ok(
  headers.includes("/sitemap.xml") && headers.includes("/robots.txt") && headers.includes("max-age=0, must-revalidate"),
  "out/_headers must keep sitemap and robots revalidated."
);
assert.ok(
  redirects.includes("/listings/:slug/ /restaurants/:slug/ 301"),
  "out/_redirects must permanently redirect trailing-slash legacy listing URLs."
);
assert.ok(
  redirects.includes("/listings/ /restaurants/ 301"),
  "out/_redirects must permanently redirect the legacy listing index to /restaurants."
);
assert.ok(
  redirects.includes("/restaurants/hyderabad-darbar-2/ /restaurants/hyderabad-darbar-redbridge/ 301"),
  "out/_redirects must send renamed restaurant slugs directly to their canonical URL."
);

console.log(`Cloudflare export checks passed: ${files.length.toLocaleString()} files, no asset over 25 MiB.`);

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}
