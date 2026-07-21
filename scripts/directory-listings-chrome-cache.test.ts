import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src", "lib", "directory-listings-model-core.ts"), "utf8");

assert.match(source, /cachedSearchAreaOptions/, "directory listings chrome should cache search area options");
assert.match(source, /cachedSearchMapPoints/, "directory listings chrome should cache search map points");
assert.match(source, /cachedSidebarBlocksByContext/, "directory listings chrome should cache sidebar blocks by context");
assert.match(source, /getCachedSearchAreaOptions/, "directory listings chrome should use cached search area helper");

console.log("directory listings chrome cache tests passed");
