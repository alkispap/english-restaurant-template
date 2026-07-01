import assert from "node:assert/strict";
import fs from "node:fs";

const homepageSource = fs.readFileSync("src/app/page.tsx", "utf8");

assert.ok(
  homepageSource.includes("organizationJsonLd") && homepageSource.includes("websiteJsonLd"),
  "homepage should render Organization and WebSite structured data"
);

assert.ok(
  homepageSource.match(/type="application\/ld\+json"/g)?.length,
  "homepage should render JSON-LD script tags"
);

console.log("homepage structured data tests passed");
