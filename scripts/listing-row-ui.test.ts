import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/ListingRowSection.tsx"), "utf8");

assert.ok(source.includes("scrollbar-hide"), "horizontal listing rows should hide the native scrollbar");
assert.ok(source.includes("aria-label={`Scroll ${row.title} listings left`"), "horizontal listing rows should expose a left arrow scroll control");
assert.ok(source.includes("aria-label={`Scroll ${row.title} listings right`"), "horizontal listing rows should expose a right arrow scroll control");
assert.ok(source.includes("canScrollLeft"), "left arrow visibility should track scroll position");
assert.ok(source.includes("canScrollRight"), "right arrow visibility should track scroll position");
assert.ok(!source.includes("className=\"grid h-[230px] w-20"), "horizontal listing rows should not use the old end-card arrow");

console.log("listing row UI tests passed");
