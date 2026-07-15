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
assert.doesNotMatch(scriptSource, /C:\\\\Users\\\\user/, "reusable script must not contain machine-specific input paths");
assert.match(scriptSource, /--write/);
assert.match(scriptSource, /--source-listings/, "script should support regenerating from a clean source listings file");
assert.match(scriptSource, /--rights-status/);
assert.match(scriptSource, /--rights-evidence/);
assert.match(scriptSource, /validateListingMediaRightsDeclaration/);
assert.match(scriptSource, /listing-media-provenance\.json/, "writes should keep the rights registry in sync");
assert.match(scriptSource, /listing-search-records\.json/, "script should keep listing card search records in sync");
assert.match(scriptSource, /listing-search-index\.json/, "script should keep the packed browser index in sync");
assert.match(scriptSource, /syncListingSearchIndexes/, "script should sync cleaned images into both listing card indexes");
assert.match(scriptSource, /cleanUnusableListingMediaWithValidation/, "script should validate media URLs before writing listings");
assert.match(scriptSource, /Remote image URL validation complete/, "script should report remote image URL validation");
assert.match(scriptSource, /Removed unusable normal image URLs/, "script should report removed normal image URLs");
assert.match(scriptSource, /Removed unusable menu image URLs/, "script should report removed menu image URLs");

console.log("outscraper media script tests passed");
