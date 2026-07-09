import assert from "node:assert/strict";

process.env.NEXT_STATIC_EXPORT = "1";

import { generateStaticParams as areaStaticParams } from "../src/app/areas/[area]/page";
import { generateStaticParams as areaCategoryStaticParams } from "../src/app/areas/[area]/categories/[category]/page";
import { generateStaticParams as popularSearchStaticParams } from "../src/app/best/[slug]/page";
import { generateStaticParams as categoryStaticParams } from "../src/app/categories/[category]/page";
import { generateStaticParams as dietaryStaticParams } from "../src/app/dietary/[dietary]/page";
import { generateStaticParams as guidePreviewStaticParams } from "../src/app/guides/preview/[slug]/page";
import { generateStaticParams as legacyListingStaticParams } from "../src/app/listings/[slug]/page";
import { generateStaticParams as listingStaticParams } from "../src/app/restaurants/[slug]/page";
import { generateStaticParams as neighborhoodStaticParams } from "../src/app/neighborhoods/[neighborhood]/page";
import { generateStaticParams as offeringStaticParams } from "../src/app/offerings/[offering]/page";
import { generateStaticParams as serviceStaticParams } from "../src/app/services/[service]/page";
import { generateStaticParams as typeStaticParams } from "../src/app/types/[type]/page";
import { listingSlugRedirects } from "../src/data/listing-slug-redirects";
import { filterListings } from "../src/lib/directory";
import fs from "node:fs";
import path from "node:path";

const areaParams = areaStaticParams();
const areaCategoryParams = areaCategoryStaticParams();
const popularSearchParams = popularSearchStaticParams();
const categoryParams = categoryStaticParams();
const dietaryParams = dietaryStaticParams();
const guidePreviewParams = guidePreviewStaticParams();
const legacyListingParams = legacyListingStaticParams();
const listingParams = listingStaticParams();
const neighborhoodParams = neighborhoodStaticParams();
const offeringParams = offeringStaticParams();
const serviceParams = serviceStaticParams();
const typeParams = typeStaticParams();

assert.ok(areaParams.length > 0, "area pages should expose static params");
assert.ok(areaCategoryParams.length > 0, "area/category pages should expose static params");
assert.ok(popularSearchParams.length > 0, "popular search pages should expose static params");
assert.ok(categoryParams.length > 0, "category pages should expose static params");
assert.ok(dietaryParams.length > 0, "dietary pages should expose static params");
assert.ok(Array.isArray(guidePreviewParams), "guide preview pages should expose static params for static export");
assert.deepEqual(
  legacyListingParams,
  [{ slug: "__legacy-listing-redirect-placeholder" }],
  "legacy listing redirect pages should emit only a placeholder static page; public/_redirects handles real compatibility"
);
assert.ok(listingParams.length > 0, "listing detail pages should expose static params");
assert.ok(neighborhoodParams.length > 0, "neighborhood pages should expose static params");
assert.ok(offeringParams.length > 0, "offering pages should expose static params");
assert.ok(serviceParams.length > 0, "service pages should expose static params");
assert.ok(typeParams.length > 0, "type pages should expose static params");

assert.ok(areaParams.every((params) => typeof params.area === "string" && params.area.length > 0), "area params should include area");
assert.ok(listingParams.every((params) => typeof params.slug === "string" && params.slug.length > 0), "listing params should include slug");
assert.ok(
  listingParams.some((params) => params.slug === "hyderabad-darbar-2"),
  "listing params should include old restaurant slugs so static export can emit redirects"
);
assert.equal(listingSlugRedirects["hyderabad-darbar-2"], "hyderabad-darbar-redbridge");
const redirects = fs.readFileSync(path.join(process.cwd(), "public", "_redirects"), "utf8");
const legacyListingRouteSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "listings", "[slug]", "page.tsx"), "utf8");
assert.ok(
  redirects.includes("/listings/:slug /restaurants/:slug 301"),
  "legacy listing detail URLs should be handled by static hosting redirects"
);
assert.ok(
  legacyListingRouteSource.includes("dynamicParams = false"),
  "legacy listing dynamic route should opt out of ungenerated params for static export"
);
assert.ok(
  areaCategoryParams.every((params) => typeof params.area === "string" && typeof params.category === "string" && params.area.length > 0 && params.category.length > 0),
  "area/category params should include area and category"
);
assert.ok(filterListings({ price: "£" }).length > 0, "price filter should match budget-friendly listings");
assert.ok(filterListings({ price: ["£"] }).length > 0, "array price filter should match budget-friendly listings");
assert.ok(
  popularSearchParams.some((params) => params.slug === "budget-friendly"),
  "budget-friendly popular search should be statically generated"
);

console.log("dynamic route config tests passed");
