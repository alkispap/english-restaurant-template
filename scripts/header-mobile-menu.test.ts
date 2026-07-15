import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "../src/config/site";

const headerControlsPath = path.join(process.cwd(), "src", "components", "HeaderControls.tsx");
const headerPath = path.join(process.cwd(), "src", "components", "Header.tsx");
const headerSource = fs.readFileSync(headerControlsPath, "utf8");
const siteHeaderSource = fs.readFileSync(headerPath, "utf8");

assert.match(headerSource, /"use client"/, "mobile header menu controls should be controlled by client state");
assert.doesNotMatch(headerSource, /<details/, "mobile header menu should not use native details state");
assert.match(headerSource, /setIsMenuOpen\(false\)/, "navigation links should close the mobile menu");
assert.match(headerSource, /z-\[\d+\]/, "mobile menu should define an explicit layer above sticky detail nav");
assert.match(headerSource, /relative\s+shrink-0/, "mobile header controls should reserve only their own width");
assert.match(headerSource, /absolute\s+right-0\s+top-\[calc\(100%\+0\.75rem\)\]/, "mobile menu should be positioned out of the header flex layout");
assert.match(headerSource, /w-\[min\(calc\(100vw-2rem\),20rem\)\]/, "mobile menu should fit inside narrow phone viewports with header search");
assert.match(siteHeaderSource, /className="hidden sm:inline"/, "mobile header should keep logo initials visible but hide long site name on narrow screens");
assert.deepEqual(
  siteConfig.navigation.map((item) => item.label),
  ["Restaurants", "Areas", "Categories"],
  "mobile navigation should render the three primary site links"
);

const listingNavPath = path.join(process.cwd(), "src", "components", "ListingNav.tsx");
const listingNavSource = fs.readFileSync(listingNavPath, "utf8");

assert.match(listingNavSource, /z-40|z-\[40\]/, "detail sticky nav should sit below mobile header menu");

console.log("header mobile menu tests passed");
