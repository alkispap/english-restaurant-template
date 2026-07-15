import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const listingPageSource = fs.readFileSync(path.join(process.cwd(), "src/app/restaurants/[slug]/page.tsx"), "utf8");

assert.ok(
  listingPageSource.includes("getListingTagHref"),
  "restaurant detail tag pills should use a helper that prefers clean SEO URLs"
);
assert.ok(
  listingPageSource.includes("href={areaPath(slugify(listing.area))}"),
  "restaurant detail area info card should link to the clean area page"
);
assert.ok(
  !listingPageSource.includes('href={directorySearchPath(`?area=${slugify(listing.area)}`)}'),
  "restaurant detail area info card should not link to query-filter URLs"
);
assert.ok(
  listingPageSource.includes('directoryRouteLink("category", tagSlug)'),
  "category tags should use a generated-route-aware link"
);
assert.ok(
  listingPageSource.includes('directoryRouteLink("dietary", tagSlug)'),
  "dietary tags should use a generated-route-aware link"
);
assert.ok(
  listingPageSource.includes('directoryRouteLink("type", tagSlug)'),
  "listing type tags should use a generated-route-aware link"
);

console.log("listing detail internal link tests passed");
