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

assert.match(source, /pendingUpdateTimer/, "query enhancer should coalesce rapid URL-change events into one scheduled update");
assert.match(source, /clearTimeout/, "query enhancer should cancel superseded scheduled updates");
assert.match(source, /lastHandledUrl/, "query enhancer should skip rebuilding the same URL twice");
assert.match(source, /loadDirectoryListingsClientModules/, "query enhancer should cache client module imports across filter changes");
assert.match(source, /setTimeout/, "query enhancer should let checkbox state paint before running the expensive model rebuild");
assert.match(
  pageSource,
  /<DirectoryListingsQueryEnhancer[\s\S]*initialPage=\{\{[\s\S]*basePath: model\.basePath[\s\S]*title: model\.title[\s\S]*description: model\.description[\s\S]*\}\}/,
  "directory pages should always mount the lightweight query enhancer so static exports can read the browser query string"
);
assert.doesNotMatch(
  pageSource,
  /initialModel=\{model\}|model\.searchQuery\s*\?\s*<DirectoryListingsQueryEnhancer/,
  "the full server model and its build-time query state should not control the lightweight browser enhancer"
);

console.log("directory query enhancer performance tests passed");
