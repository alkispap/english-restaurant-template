import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const listingPage = fs.readFileSync(path.join(process.cwd(), "src/app/restaurants/[slug]/page.tsx"), "utf8");

assert.match(listingPage, /listing\.menuImages/, "restaurant detail page should read menuImages");
assert.match(listingPage, /Menu photos/, "restaurant detail page should label the separate menu photo section");
assert.match(listingPage, /variant: "menu"/, "menu photos should use menu-specific image alt text");
assert.match(listingPage, /hasGallery/, "restaurant detail page should distinguish real gallery images from fallback state");
assert.match(listingPage, /hasSecondaryGalleryImages/, "restaurant detail page should only render secondary gallery tiles when real images exist");

console.log("listing menu images UI tests passed");
