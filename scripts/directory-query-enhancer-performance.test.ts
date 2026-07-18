import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "DirectoryListingsQueryEnhancer.tsx"),
  "utf8"
);
const pageSource = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "DirectoryListingsPage.tsx"),
  "utf8"
);
const responsiveFiltersSource = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "ResponsiveDirectoryFilters.tsx"),
  "utf8"
);
const searchBarSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "SearchBar.tsx"), "utf8");
const browserModelSource = fs.readFileSync(
  path.join(process.cwd(), "src", "lib", "directory-listings-browser.ts"),
  "utf8"
);
const interactiveShellSource = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "DirectoryListingsInteractiveShell.tsx"),
  "utf8"
);

assert.match(source, /pendingUpdateTimer/, "query enhancer should coalesce rapid URL-change events into one scheduled update");
assert.match(source, /clearTimeout/, "query enhancer should cancel superseded scheduled updates");
assert.match(source, /lastHandledUrl/, "query enhancer should skip rebuilding the same URL twice");
assert.match(source, /loadDirectoryListingsClientModules/, "query enhancer should cache client module imports across filter changes");
assert.match(source, /setTimeout/, "query enhancer should let checkbox state paint before running the expensive model rebuild");
assert.match(
  source,
  /prepareDirectoryListingsClientModules/,
  "query enhancer should reuse one prepared client-model promise across interactions"
);
assert.match(
  source,
  /window\.location\.search\.length > 1[\s\S]*prepareDirectoryListingsClientModules\(\)/,
  "an existing query should prepare required client modules while React hydration continues"
);
assert.match(
  source,
  /useState\(\(\) => prepareInitialDirectoryQuery\(initialPage\)\)/,
  "the first query render should reuse one guarded initial-model preparation"
);
assert.match(
  source,
  /initialQueryPreparation\?\.href === currentUrl[\s\S]*initialQueryPreparation\.promise/,
  "the hydration effect should apply only a preparation for the unchanged initial URL"
);
assert.match(
  source,
  /useLayoutEffect\(\(\) => \{[\s\S]*directory-query-effect-started/,
  "the prepared initial query should be applied before the first browser paint"
);
assert.match(source, /pointerover/, "pointer intent should prepare the asynchronous directory model before a filter click");
assert.match(source, /focusin/, "keyboard intent should prepare the asynchronous directory model before a filter change");
assert.match(
  responsiveFiltersSource,
  /data-directory-query-intent="true"/,
  "responsive filters should expose an explicit reusable preload-intent boundary"
);
assert.match(
  searchBarSource,
  /data-directory-query-intent="true"/,
  "directory search should expose an explicit reusable preload-intent boundary"
);
assert.match(
  browserModelSource,
  /prepareBrowserDirectoryListingsModel/,
  "the browser model should expose guarded static-cache preparation"
);
assert.match(
  interactiveShellSource,
  /includeSecondaryContent=\{secondaryModel === initialModel\}/,
  "query results should commit primary listings before secondary related content"
);
assert.match(
  interactiveShellSource,
  /directory-primary-results-painted[\s\S]*setSecondaryModel\(initialModel\)/,
  "secondary query content should be enabled only after the primary result paint"
);
assert.match(
  pageSource,
  /<DirectoryListingsQueryEnhancer[\s\S]*initialPage=\{\{[\s\S]*basePath: model\.basePath[\s\S]*title: model\.title[\s\S]*description: model\.description[\s\S]*\}\}/,
  "directory pages should always mount the lightweight query enhancer so static exports can read the browser query string"
);
assert.ok(
  pageSource.indexOf("<DirectoryListingsQueryEnhancer") < pageSource.indexOf("<DirectoryListingsView"),
  "the lightweight query enhancer should hydrate before the large server directory tree"
);
assert.doesNotMatch(
  pageSource,
  /initialModel=\{model\}|model\.searchQuery\s*\?\s*<DirectoryListingsQueryEnhancer/,
  "the full server model and its build-time query state should not control the lightweight browser enhancer"
);

console.log("directory query enhancer performance tests passed");
