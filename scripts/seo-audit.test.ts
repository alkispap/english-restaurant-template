import assert from "node:assert/strict";
import { buildSeoAuditReport } from "./check-seo-policy";

const report = buildSeoAuditReport();

assert.match(report, /SEO policy audit/i);
assert.match(report, /Listing detail pages/i);
assert.match(report, /Area hubs/i);
assert.match(report, /Noindex listing details/i);
assert.match(report, /Indexable URLs/i);

console.log("SEO audit tests passed");
