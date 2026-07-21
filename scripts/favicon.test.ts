import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const faviconPath = path.join(root, "src", "app", "favicon.ico");
const layoutPath = path.join(root, "src", "app", "layout.tsx");

assert.ok(fs.existsSync(faviconPath), "the App Router favicon convention should provide src/app/favicon.ico");

const favicon = fs.readFileSync(faviconPath);
assert.ok(favicon.length > 0 && favicon.length < 20_000, "the favicon should be non-empty and remain lightweight");
assert.equal(favicon.readUInt16LE(0), 0, "the favicon should have a valid ICO reserved field");
assert.equal(favicon.readUInt16LE(2), 1, "the favicon should identify itself as an ICO image");

const imageCount = favicon.readUInt16LE(4);
assert.equal(imageCount, 4, "the favicon should contain four browser-appropriate sizes");

const dimensions = Array.from({ length: imageCount }, (_, index) => {
  const entryOffset = 6 + index * 16;
  const width = favicon[entryOffset] || 256;
  const height = favicon[entryOffset + 1] || 256;
  const imageBytes = favicon.readUInt32LE(entryOffset + 8);
  const imageOffset = favicon.readUInt32LE(entryOffset + 12);

  assert.equal(width, height, `favicon image ${index + 1} should be square`);
  assert.ok(imageBytes > 0, `favicon image ${index + 1} should not be empty`);
  assert.ok(imageOffset + imageBytes <= favicon.length, `favicon image ${index + 1} should stay within the ICO file`);
  return width;
});

assert.deepEqual(dimensions, [16, 32, 48, 64], "the favicon should cover common browser sizes");

const conflictingFiles = [
  path.join(root, "src", "app", "icon.ico"),
  path.join(root, "src", "app", "icon.png"),
  path.join(root, "src", "app", "icon.svg"),
  path.join(root, "public", "favicon.ico")
].filter(fs.existsSync);
assert.deepEqual(conflictingFiles, [], "the App Router should expose one unambiguous favicon source");

const layoutSource = fs.readFileSync(layoutPath, "utf8");
assert.doesNotMatch(layoutSource, /icons\s*:/, "layout metadata should not duplicate the file-convention favicon");
assert.doesNotMatch(layoutSource, /https?:\/\/[^"']+(?:favicon|icon)/i, "favicon metadata must not use an external service");

console.log("favicon tests passed");
