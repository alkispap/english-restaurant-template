import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};

assert.equal(packageJson.scripts?.["check:cloudflare"], "tsx scripts/check-cloudflare-export.ts");
assert.equal(
  packageJson.scripts?.["build:static"],
  "npm run generate:redirects && powershell -NoProfile -ExecutionPolicy Bypass -Command \"$env:NEXT_PUBLIC_SITE_URL='https://indianrestaurantlondon.co.uk'; $env:NEXT_STATIC_EXPORT='1'; next build\""
);
assert.equal(packageJson.scripts?.["generate:redirects"], "tsx scripts/generate-cloudflare-redirects.ts");
assert.equal(packageJson.scripts?.["diagnose:static"], "tsx scripts/static-export-diagnostics.ts");
assert.equal(
  packageJson.scripts?.["prepare:cloudflare"],
  "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-cloudflare-upload.ps1"
);
assert.equal(packageJson.scripts?.["publish:cloudflare"], "tsx scripts/publish-cloudflare.ts");

const prepareScriptPath = path.join(process.cwd(), "scripts", "prepare-cloudflare-upload.ps1");
assert.ok(fs.existsSync(prepareScriptPath), "prepare:cloudflare should have a PowerShell workflow script");

const prepareScript = fs.readFileSync(prepareScriptPath, "utf8");
assert.ok(prepareScript.includes("Stop-ProjectDevServers"), "prepare script should stop this project's dev server before export");
assert.ok(
  prepareScript.includes("$env:NEXT_PUBLIC_SITE_URL = \"https://indianrestaurantlondon.co.uk\""),
  "prepare script should set the production site URL for all publish checks"
);
assert.ok(prepareScript.includes("npm.cmd") && prepareScript.includes("run") && prepareScript.includes("build:static"), "prepare script should run the static export build");
assert.ok(prepareScript.includes("check:cloudflare"), "prepare script should run Cloudflare export checks");
assert.ok(prepareScript.includes("Upload-ready folder:"), "prepare script should report the upload-ready out folder");

const publishScript = fs.readFileSync(path.join(process.cwd(), "scripts", "publish-cloudflare.ts"), "utf8");
const exportCheckScript = fs.readFileSync(path.join(process.cwd(), "scripts", "check-cloudflare-export.ts"), "utf8");

assert.ok(publishScript.includes("CLOUDFLARE_PROJECT_NAME"), "publish script should require a Cloudflare project name");
assert.ok(
  publishScript.includes('"wrangler", "pages", "deploy"'),
  "publish script should deploy with Wrangler Direct Upload"
);
assert.ok(
  publishScript.includes('"npm", ["run", "prepare:cloudflare"]'),
  "publish script should run the full Cloudflare preparation workflow before deployment"
);
assert.ok(
  exportCheckScript.includes("_redirects"),
  "Cloudflare export checks should verify redirect rules are present in out/_redirects"
);

const headersPath = path.join(process.cwd(), "public", "_headers");
const headers = fs.readFileSync(headersPath, "utf8");
assert.ok(headers.includes("/robots.txt"), "public/_headers should set robots cache policy by path");
assert.ok(headers.includes("/sitemap.xml"), "public/_headers should set sitemap cache policy by path");
assert.ok(
  !headers.includes("https://indianrestaurantlondon.co.uk/robots.txt") &&
    !headers.includes("https://www.indianrestaurantlondon.co.uk/robots.txt") &&
    !headers.includes("https://indianrestaurantlondon.co.uk/sitemap.xml") &&
    !headers.includes("https://www.indianrestaurantlondon.co.uk/sitemap.xml"),
  "public/_headers should not duplicate robots or sitemap rules with hostname-specific entries"
);
assert.ok(
  !fs.existsSync(path.join(process.cwd(), "public", "_worker.js")),
  "robots cache policy should not require a Pages advanced-mode worker"
);

const redirectsPath = path.join(process.cwd(), "public", "_redirects");
assert.ok(fs.existsSync(redirectsPath), "public/_redirects should define static-hosting redirects");
const redirects = fs.readFileSync(redirectsPath, "utf8");
assert.ok(
  redirects.includes("/listings/:slug/ /restaurants/:slug/ 301"),
  "trailing-slash legacy listing detail URLs should permanently redirect to canonical restaurant URLs"
);
assert.ok(
  redirects.includes("/listings/ /restaurants/ 301"),
  "legacy listing index URL should permanently redirect to canonical restaurant index"
);
assert.ok(
  redirects.includes("/restaurants/hyderabad-darbar-2/ /restaurants/hyderabad-darbar-redbridge/ 301"),
  "renamed restaurant URLs should use one-hop permanent redirects"
);

console.log("Cloudflare publish tests passed");
