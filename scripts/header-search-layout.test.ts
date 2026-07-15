import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const headerPath = path.join(process.cwd(), "src", "components", "Header.tsx");
const headerControlsPath = path.join(process.cwd(), "src", "components", "HeaderControls.tsx");
const headerSearchPath = path.join(process.cwd(), "src", "components", "HeaderSearch.tsx");
const directoryListingsViewPath = path.join(process.cwd(), "src", "components", "DirectoryListingsView.tsx");

const headerSource = fs.readFileSync(headerPath, "utf8");
const headerControlsSource = fs.readFileSync(headerControlsPath, "utf8");
const directoryListingsViewSource = fs.readFileSync(directoryListingsViewPath, "utf8");

assert.ok(fs.existsSync(headerSearchPath), "header should use a reusable compact search component");

const headerSearchSource = fs.readFileSync(headerSearchPath, "utf8");

assert.match(headerSource, /<HeaderSearch/, "desktop header should render the global search");
assert.match(headerControlsSource, /<HeaderSearch/, "mobile menu should render the global search");
assert.match(headerSearchSource, /directoryConfig\.listingLabel/, "header search placeholder should use directory config");
assert.match(headerSearchSource, /directorySearchPath\(\)/, "header search should submit to the directory search route");
assert.doesNotMatch(headerSearchSource, /name="area"/, "header search should not include the area selector");
assert.doesNotMatch(headerSearchSource, /LocateFixed|near you/, "header search should not include geolocation search");
assert.doesNotMatch(
  directoryListingsViewSource,
  /:\s*\(\s*<div className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">/,
  "non-homepage directory heading should not use the old large search card"
);

console.log("header search layout tests passed");
