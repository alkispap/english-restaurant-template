import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src", "components", "DirectoryListingsQueryEnhancer.tsx"),
  "utf8"
);

assert.match(source, /pendingUpdateTimer/, "query enhancer should coalesce rapid URL-change events into one scheduled update");
assert.match(source, /clearTimeout/, "query enhancer should cancel superseded scheduled updates");
assert.match(source, /lastHandledUrl/, "query enhancer should skip rebuilding the same URL twice");
assert.match(source, /loadDirectoryListingsClientModules/, "query enhancer should cache client module imports across filter changes");
assert.match(source, /setTimeout/, "query enhancer should let checkbox state paint before running the expensive model rebuild");

console.log("directory query enhancer performance tests passed");
