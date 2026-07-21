import {
  unpackListingSearchRecords,
  type PackedListingSearchIndex
} from "@/lib/listing-search-index";
import {
  prefetchDirectorySearchData,
  resetDirectorySearchDataRequest
} from "@/lib/directory-search-data-request";
import { initializeListingSearchRuntime } from "@/lib/listing-search-runtime";

if (typeof window !== "undefined") performance.mark("directory-search-runtime-module-evaluated");

let runtimePromise: Promise<void> | null = null;

export function loadBrowserDirectorySearchRuntime() {
  runtimePromise ??= initializeBrowserDirectorySearchRuntime().catch((error) => {
    runtimePromise = null;
    resetDirectorySearchDataRequest();
    throw error;
  });
  return runtimePromise;
}

export function resetBrowserDirectorySearchRuntime() {
  runtimePromise = null;
  resetDirectorySearchDataRequest();
}

async function initializeBrowserDirectorySearchRuntime() {
  const text = await prefetchDirectorySearchData();

  const parseStarted = performance.now();
  const packed = JSON.parse(text) as PackedListingSearchIndex;
  const parseReady = performance.now();
  performance.measure("directory-search-data-parse", { start: parseStarted, end: parseReady });

  const unpackStarted = performance.now();
  const records = unpackListingSearchRecords(packed);
  const unpackReady = performance.now();
  performance.measure("directory-search-data-unpack", { start: unpackStarted, end: unpackReady });

  const runtimeStarted = performance.now();
  initializeListingSearchRuntime(records);
  const runtimeReady = performance.now();
  performance.measure("directory-search-runtime-init", { start: runtimeStarted, end: runtimeReady });
  performance.mark("directory-search-runtime-ready");
}
