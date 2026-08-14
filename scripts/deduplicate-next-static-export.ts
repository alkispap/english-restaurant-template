import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const outDir = path.join(process.cwd(), "out");
const duplicateName = "__next._full.txt";

assert.ok(fs.existsSync(outDir), "out folder is missing. Run the static export before deduplicating it.");

const duplicates = listFiles(outDir).filter((file) => path.basename(file) === duplicateName);

for (const duplicatePath of duplicates) {
  const canonicalPath = path.join(path.dirname(duplicatePath), "index.txt");
  assert.ok(fs.existsSync(canonicalPath), `${path.relative(outDir, duplicatePath)} has no matching index.txt payload.`);
  assert.equal(
    sha256(fs.readFileSync(duplicatePath)),
    sha256(fs.readFileSync(canonicalPath)),
    `${path.relative(outDir, duplicatePath)} is not identical to its index.txt payload.`
  );
  fs.unlinkSync(duplicatePath);
}

console.log(`Removed ${duplicates.length.toLocaleString()} duplicate Next.js full-route payloads.`);

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : [filePath];
  });
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
