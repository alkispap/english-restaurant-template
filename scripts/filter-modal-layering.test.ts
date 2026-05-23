import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const componentPath = path.join(process.cwd(), "src", "components", "FilterCheckboxGroup.tsx");
const source = fs.readFileSync(componentPath, "utf8");

assert.match(source, /createPortal\(/, "filter pop-up should render through a portal");
assert.match(source, /document\.body/, "filter pop-up portal should mount at page level");
assert.match(source, /z-\[100\]/, "filter pop-up overlay should sit above sticky navs and listing cards");

console.log("filter modal layering tests passed");
