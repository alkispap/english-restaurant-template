import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const comparePage = fs.readFileSync(path.join(root, "src/app/compare/page.tsx"), "utf8");
const compareComponent = fs.readFileSync(path.join(root, "src/components/CompareSavedListings.tsx"), "utf8");
const apiRoutePath = path.join(root, "src/app/api/shortlist/route.ts");

assert.ok(!comparePage.includes("getAllShortlistListingSummaries"), "compare page should not pass all listings to the client");
assert.ok(!comparePage.includes("<CompareSavedListings listings="), "compare component should fetch saved summaries on demand");
assert.ok(fs.existsSync(apiRoutePath), "shortlist API route should exist");
assert.ok(compareComponent.includes("/api/shortlist"), "compare component should fetch saved summaries from the shortlist API");

console.log("compare payload tests passed");
