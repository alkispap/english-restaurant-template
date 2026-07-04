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

console.log("outscraper media script tests passed");
