import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const listingsResultsSource = fs.readFileSync(path.join(root, "src", "components", "ListingsResults.tsx"), "utf8");
const openNowControlPath = path.join(root, "src", "components", "OpenNowResultsLink.tsx");

assert.match(
  listingsResultsSource,
  /OpenNowResultsLink/,
  "listings toolbar Open now control should use the scroll-preserving client control"
);

assert.ok(fs.existsSync(openNowControlPath), "Open now scroll-preserving client control should exist");

const openNowControlSource = fs.readFileSync(openNowControlPath, "utf8");

assert.match(openNowControlSource, /"use client"/, "Open now control should be a client component");
assert.match(openNowControlSource, /event\.preventDefault\(\)/, "normal Open now clicks should not use full Next link navigation");
assert.match(openNowControlSource, /window\.scrollY/, "Open now clicks should capture the current scroll position");
assert.match(openNowControlSource, /window\.history\.pushState/, "Open now clicks should update the URL through history state");
assert.doesNotMatch(openNowControlSource, /directory-url-change/, "Open now clicks should not manually dispatch duplicate directory-url-change events");
assert.match(openNowControlSource, /scrollTo/, "Open now clicks should restore the user's scroll position");
assert.match(
  openNowControlSource,
  /event\.metaKey[\s\S]*event\.ctrlKey[\s\S]*event\.shiftKey[\s\S]*event\.altKey[\s\S]*event\.button !== 0/,
  "modified clicks and non-left clicks should keep normal browser link behavior"
);

console.log("open now scroll behavior tests passed");
