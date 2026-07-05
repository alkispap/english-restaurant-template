import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
const expectedScriptPath = path.join(process.cwd(), "scripts/enrich-outscraper-media.ts");

assert.equal(packageJson.scripts?.["enrich:outscraper-media"], "tsx scripts/enrich-outscraper-media.ts");
assert.equal(fs.existsSync(expectedScriptPath), true, "reusable Outscraper media enrichment script should exist");

const scriptSource = fs.readFileSync(expectedScriptPath, "utf8");
assert.match(scriptSource, /Outscraper-20260604054319m10\.csv/);
assert.match(scriptSource, /Outscraper-20260604054426m03\.csv/);
assert.match(scriptSource, /--dry-run/);
assert.match(scriptSource, /--source-listings=/, "script should support regenerating from a clean source listings file");
assert.match(scriptSource, /cleanUnusableListingMediaWithValidation/, "script should validate media URLs before writing listings");
assert.match(scriptSource, /Remote image URL validation complete/, "script should report remote image URL validation");
assert.match(scriptSource, /Removed unusable normal image URLs/, "script should report removed normal image URLs");
assert.match(scriptSource, /Removed unusable menu image URLs/, "script should report removed menu image URLs");

console.log("outscraper media script tests passed");
