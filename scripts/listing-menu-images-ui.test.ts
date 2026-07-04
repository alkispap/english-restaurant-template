import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const listingPage = fs.readFileSync(path.join(process.cwd(), "src/app/restaurants/[slug]/page.tsx"), "utf8");

assert.match(listingPage, /listing\.menuImages/, "restaurant detail page should read menuImages");
assert.match(listingPage, /Menu photos/, "restaurant detail page should label the separate menu photo section");
assert.match(listingPage, /variant: "menu"/, "menu photos should use menu-specific image alt text");

console.log("listing menu images UI tests passed");
