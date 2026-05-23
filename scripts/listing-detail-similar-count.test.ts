import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/app/listings/[slug]/page.tsx"), "utf8");

assert.ok(
  source.includes("getRelatedListings(listing, 8)"),
  "listing detail pages should show 8 similar listings so desktop rows stay balanced"
);

assert.ok(
  !source.includes("getRelatedListings(listing, 9)"),
  "listing detail pages should not request 9 similar listings because that leaves a single card on the third desktop row"
);
