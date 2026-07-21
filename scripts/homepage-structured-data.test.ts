import assert from "node:assert/strict";
import fs from "node:fs";

const homepageSource = fs.readFileSync("src/app/page.tsx", "utf8");

assert.ok(
  homepageSource.includes("organizationJsonLd") && homepageSource.includes("websiteJsonLd"),
  "homepage should render Organization and WebSite structured data"
);

assert.equal(
  homepageSource.match(/<JsonLd\b/g)?.length,
  2,
  "homepage should emit Organization and WebSite data through the safe JSON-LD component"
);

console.log("homepage structured data tests passed");
