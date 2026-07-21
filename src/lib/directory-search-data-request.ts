const DIRECTORY_SEARCH_DATA_URL = "/directory-search-index.json";

let responseTextPromise: Promise<string> | null = null;

export function prefetchDirectorySearchData() {
  responseTextPromise ??= requestDirectorySearchData().catch((error) => {
    responseTextPromise = null;
    throw error;
  });
  return responseTextPromise;
}

export function resetDirectorySearchDataRequest() {
  responseTextPromise = null;
}

async function requestDirectorySearchData() {
  const requestStarted = performance.now();
  performance.mark("directory-search-data-request-started");
  const response = await fetch(DIRECTORY_SEARCH_DATA_URL, {
    headers: { Accept: "application/json" }
  });
  const responseReceived = performance.now();
  performance.measure("directory-search-data-fetch", { start: requestStarted, end: responseReceived });

  if (!response.ok) {
    throw new Error(`Directory search data request failed with HTTP ${response.status}.`);
  }
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("Directory search data response was not JSON.");
  }

  const textStarted = performance.now();
  const text = await response.text();
  const textReady = performance.now();
  performance.measure("directory-search-data-text", { start: textStarted, end: textReady });
  performance.mark("directory-search-data-response-ready");
  return text;
}
