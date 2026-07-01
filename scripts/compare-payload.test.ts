import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const comparePage = fs.readFileSync(path.join(root, "src/app/compare/page.tsx"), "utf8");
const compareComponent = fs.readFileSync(path.join(root, "src/components/CompareSavedListings.tsx"), "utf8");
const apiRoutePath = path.join(root, "src/app/api/shortlist/route.ts");

assert.ok(!comparePage.includes("getAllShortlistListingSummaries"), "compare page should not pass all listings to the client");
assert.ok(!comparePage.includes("<CompareSavedListings listings="), "compare page should keep the component self-contained");
assert.ok(!fs.existsSync(apiRoutePath), "shortlist API route should not exist for static export hosting");
assert.ok(!compareComponent.includes("/api/shortlist"), "compare component should not fetch from a server API");
assert.ok(compareComponent.includes("getClientShortlistListingSummaries"), "compare component should resolve saved summaries on the client");

console.log("compare payload tests passed");
