import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const headerControlsPath = path.join(process.cwd(), "src", "components", "HeaderControls.tsx");
const headerSource = fs.readFileSync(headerControlsPath, "utf8");

assert.match(headerSource, /"use client"/, "mobile header menu controls should be controlled by client state");
assert.doesNotMatch(headerSource, /<details/, "mobile header menu should not use native details state");
assert.match(headerSource, /setIsMenuOpen\(false\)/, "navigation links should close the mobile menu");
assert.match(headerSource, /z-\[\d+\]/, "mobile menu should define an explicit layer above sticky detail nav");

const listingNavPath = path.join(process.cwd(), "src", "components", "ListingNav.tsx");
const listingNavSource = fs.readFileSync(listingNavPath, "utf8");

assert.match(listingNavSource, /z-40|z-\[40\]/, "detail sticky nav should sit below mobile header menu");

console.log("header mobile menu tests passed");
