import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type AppBuildManifest = {
  pages: Record<string, string[]>;
};

const root = process.cwd();
const nextDir = path.join(root, ".next");
const manifestPath = path.join(nextDir, "app-build-manifest.json");
const routeBudgets = [
  "/restaurants/page",
  "/areas/[area]/page",
  "/areas/[area]/categories/[category]/page",
  "/best/[slug]/page",
  "/categories/[category]/page",
  "/dietary/[dietary]/page",
  "/neighborhoods/[neighborhood]/page",
  "/offerings/[offering]/page",
  "/services/[service]/page",
  "/types/[type]/page"
];
const MAX_INITIAL_ROUTE_JS_BYTES = 650_000;
const MAX_INITIAL_CHUNK_BYTES = 250_000;

assert.ok(fs.existsSync(manifestPath), "Run a production build before checking client payload budgets.");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as AppBuildManifest;
const results = routeBudgets.map((route) => {
  const assets = manifest.pages[route];
  assert.ok(assets, `Missing ${route} from the app build manifest.`);

  const javascriptAssets = [...new Set(assets.filter((asset) => asset.endsWith(".js")))];
  const sizes = javascriptAssets.map((asset) => ({
    asset,
    bytes: fs.statSync(path.join(nextDir, asset)).size
  }));
  const totalBytes = sizes.reduce((total, item) => total + item.bytes, 0);
  const largest = sizes.reduce((current, item) => (item.bytes > current.bytes ? item : current), {
    asset: "",
    bytes: 0
  });

  assert.ok(
    totalBytes <= MAX_INITIAL_ROUTE_JS_BYTES,
    `${route} initial JavaScript is ${formatBytes(totalBytes)}; budget is ${formatBytes(MAX_INITIAL_ROUTE_JS_BYTES)}.`
  );
  assert.ok(
    largest.bytes <= MAX_INITIAL_CHUNK_BYTES,
    `${route} includes ${largest.asset} at ${formatBytes(largest.bytes)}; per-chunk budget is ${formatBytes(MAX_INITIAL_CHUNK_BYTES)}.`
  );

  return { route, totalBytes, largestChunkBytes: largest.bytes };
});

for (const result of results) {
  console.log(
    `${result.route}: ${formatBytes(result.totalBytes)} initial raw JS; largest chunk ${formatBytes(result.largestChunkBytes)}`
  );
}

console.log("Client payload budgets passed.");

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
