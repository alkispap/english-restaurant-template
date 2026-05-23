import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/app/listings/[slug]/page.tsx"), "utf8");

assert.ok(
  source.includes('import { ListingEngagementStats } from "@/components/ListingEngagementStats";'),
  "listing detail page should import the engagement stats component"
);

assert.ok(
  source.includes("<ListingEngagementStats slug={listing.slug} />"),
  "listing detail page should render engagement stats for the current listing"
);

const titleIndex = source.indexOf("<h1");
const statsIndex = source.indexOf("<ListingEngagementStats slug={listing.slug} />");
const privateNoteIndex = source.indexOf("<ListingPrivateNote slug={listing.slug} />");

assert.ok(titleIndex !== -1 && statsIndex > titleIndex, "engagement stats should appear after the listing title");
assert.ok(
  privateNoteIndex !== -1 && statsIndex < privateNoteIndex,
  "engagement stats should appear near the title before lower overview content"
);

console.log("listing detail engagement tests passed");
