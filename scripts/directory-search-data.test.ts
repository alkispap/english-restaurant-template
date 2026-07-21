import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GET, dynamic } from "../src/app/directory-search-index.json/route";
import {
  loadBrowserDirectorySearchRuntime,
  resetBrowserDirectorySearchRuntime
} from "../src/lib/directory-search-runtime-browser";

const root = process.cwd();
const packedText = fs.readFileSync(path.join(root, "data", "listing-search-index.json"), "utf8");
const packed = JSON.parse(packedText) as { version: number; records: unknown[] };

async function staticAssetMatchesCanonicalIndex() {
  assert.equal(dynamic, "force-static", "search data route must remain compatible with static export");
  const response = GET();
  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  const exported = await response.json() as { version: number; records: unknown[] };
  assert.equal(exported.version, packed.version);
  assert.equal(exported.records.length, packed.records.length);
  assert.deepEqual(exported, packed, "static search asset must preserve the canonical packed index exactly");
}

async function browserRuntimeLoadsOnceAndRetriesFailures() {
  resetBrowserDirectorySearchRuntime();
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return new Response(packedText, { headers: { "Content-Type": "application/json" } });
  };

  const first = loadBrowserDirectorySearchRuntime();
  const second = loadBrowserDirectorySearchRuntime();
  assert.equal(first, second, "concurrent callers should share one runtime promise");
  await Promise.all([first, second]);
  await loadBrowserDirectorySearchRuntime();
  assert.equal(requests, 1, "initialized runtime should not refetch or reparse the index");

  resetBrowserDirectorySearchRuntime();
  globalThis.fetch = async () => new Response("unavailable", { status: 503, headers: { "Content-Type": "text/plain" } });
  await assert.rejects(loadBrowserDirectorySearchRuntime(), /HTTP 503/);

  let retryRequests = 0;
  globalThis.fetch = async () => {
    retryRequests += 1;
    return new Response(packedText, { headers: { "Content-Type": "application/json" } });
  };
  await loadBrowserDirectorySearchRuntime();
  assert.equal(retryRequests, 1, "a rejected runtime request should be retryable");
}

function browserDependencyBoundaryExcludesCanonicalJsonImport() {
  const browserModule = fs.readFileSync(path.join(root, "src", "lib", "directory-listings-browser.ts"), "utf8");
  const runtimeModule = fs.readFileSync(path.join(root, "src", "lib", "listing-search-runtime.ts"), "utf8");
  assert.doesNotMatch(browserModule, /listing-search-records|listing-search-index\.json/);
  assert.doesNotMatch(runtimeModule, /listing-search-index\.json/);
  assert.match(runtimeModule, /initializeListingSearchRuntime/);
}

async function main() {
  await staticAssetMatchesCanonicalIndex();
  await browserRuntimeLoadsOnceAndRetriesFailures();
  browserDependencyBoundaryExcludesCanonicalJsonImport();
  console.log("directory search data tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
