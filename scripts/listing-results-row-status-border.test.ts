import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/ListingResultsRow.tsx"), "utf8");

assert.ok(source.includes("openStatus"), "listing result rows should calculate live open status");
assert.ok(source.includes("statusBorderClass"), "listing result rows should use a status border class");
assert.ok(source.includes("border-emerald-500"), "open listing result rows should use a green border");
assert.ok(source.includes("border-red-500"), "closed listing result rows should use a red border");
assert.ok(source.includes("border-line"), "unknown listing result rows should keep the neutral border");
assert.ok(source.includes("border-2"), "listing result rows should use a stronger border");
assert.ok(source.includes("hover:-translate-y-0.5"), "listing result rows should move slightly on hover");

console.log("listing results row status border tests passed");
