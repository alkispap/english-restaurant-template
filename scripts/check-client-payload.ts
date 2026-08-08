import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type AppBuildManifest = {
  pages: Record<string, string[]>;
};

const root = process.cwd();
const nextDir = path.join(root, ".next");
const manifestPath = path.join(nextDir, "app-build-manifest.json");
const MAX_INITIAL_ROUTE_JS_BYTES = 650_000;
const MAX_INITIAL_CHUNK_BYTES = 250_000;
const MAX_ASYNC_CHUNK_BYTES = 900_000;
const MAX_SEARCH_EXECUTABLE_CHUNK_BYTES = 250_000;
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
].map((route) => ({
  route,
  maxTotalBytes: MAX_INITIAL_ROUTE_JS_BYTES,
  maxChunkBytes: MAX_INITIAL_CHUNK_BYTES
}));

routeBudgets.push({
  route: "/compare/page",
  maxTotalBytes: 1_300_000,
  maxChunkBytes: 900_000
});

assert.ok(
  fs.existsSync(manifestPath) || fs.existsSync(path.join(nextDir, "build-manifest.json")),
  "Run a production build before checking client payload budgets."
);

const results = fs.existsSync(manifestPath) ? routeBudgets.map(({ route, maxTotalBytes, maxChunkBytes }) => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as AppBuildManifest;
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
    totalBytes <= maxTotalBytes,
    `${route} initial JavaScript is ${formatBytes(totalBytes)}; budget is ${formatBytes(maxTotalBytes)}.`
  );
  assert.ok(
    largest.bytes <= maxChunkBytes,
    `${route} includes ${largest.asset} at ${formatBytes(largest.bytes)}; per-chunk budget is ${formatBytes(maxChunkBytes)}.`
  );

  return { route, totalBytes, largestChunkBytes: largest.bytes };
}) : [];

if (!fs.existsSync(manifestPath)) {
  console.warn("Route-level payload budgets are unavailable in Next.js 16; checking global client chunks instead.");
}

for (const result of results) {
  console.log(
    `${result.route}: ${formatBytes(result.totalBytes)} initial raw JS; largest chunk ${formatBytes(result.largestChunkBytes)}`
  );
}

const clientChunks = collectFiles(path.join(nextDir, "static", "chunks")).filter((file) => file.endsWith(".js"));
const largestClientChunk = clientChunks
  .map((file) => ({
    asset: path.relative(nextDir, file).replaceAll("\\", "/"),
    bytes: fs.statSync(file).size
  }))
  .reduce((current, item) => (item.bytes > current.bytes ? item : current), { asset: "", bytes: 0 });

assert.ok(
  largestClientChunk.bytes <= MAX_ASYNC_CHUNK_BYTES,
  `${largestClientChunk.asset} is ${formatBytes(largestClientChunk.bytes)}; async chunk budget is ${formatBytes(MAX_ASYNC_CHUNK_BYTES)}.`
);
console.log(
  `Largest initial or async client chunk: ${largestClientChunk.asset} at ${formatBytes(largestClientChunk.bytes)}`
);

const clientSource = clientChunks.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const searchExecutableChunks = clientChunks
  .map((file) => ({ file, source: fs.readFileSync(file, "utf8") }))
  .filter(({ source }) =>
    source.includes("Unsupported listing search index") ||
    source.includes("Directory search data request failed") ||
    source.includes("directory-search-data-parse")
  );
assert.ok(searchExecutableChunks.length > 0, "Could not identify the asynchronous directory search executable chunk.");
searchExecutableChunks.forEach(({ file }) => {
  const bytes = fs.statSync(file).size;
  assert.ok(
    bytes <= MAX_SEARCH_EXECUTABLE_CHUNK_BYTES,
    `${path.relative(nextDir, file)} is ${formatBytes(bytes)}; search executable budget is ${formatBytes(MAX_SEARCH_EXECUTABLE_CHUNK_BYTES)}.`
  );
});
assert.ok(
  !clientSource.includes("listing-search-index.json"),
  "The canonical packed search index must not be imported into client JavaScript."
);
for (const forbiddenEditorialValue of [
  "directory-editor",
  "legacy-public-baseline",
  "identity-uncertain",
  "material-data-conflict",
  "publication-2026-"
]) {
  assert.ok(
    !clientSource.includes(forbiddenEditorialValue),
    `Editorial publication history leaked into a client JavaScript chunk: ${forbiddenEditorialValue}`
  );
}

console.log("Client payload budgets passed.");

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
  });
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
