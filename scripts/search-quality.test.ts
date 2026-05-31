import assert from "node:assert/strict";
import { filterListings } from "../src/lib/directory";
import { listings } from "../src/data/listings";

function resultSlugs(query: string) {
  return filterListings({ q: query }).map((listing) => listing.slug);
}

const biryaniRedbridge = resultSlugs("biryani redbridge");
assert.ok(
  biryaniRedbridge.includes("the-curry-club-london"),
  "multi-token search should match listings across food terms and area"
);

const halalDeliveryIlford = resultSlugs("halal delivery ilford");
assert.ok(
  halalDeliveryIlford.length > 0,
  "multi-token search should match category/service/neighborhood intent"
);
assert.ok(
  halalDeliveryIlford.every((slug) => listings.some((listing) => listing.slug === slug)),
  "query should return valid listing slugs"
);

const veganTakeawayCamden = resultSlugs("vegan takeaway camden");
assert.ok(
  veganTakeawayCamden.some((slug) => slug.includes("camden") || slug.includes("dishoom")),
  "search should handle dietary, service, and local terms together"
);

assert.deepEqual(resultSlugs("zzzzzzzzzzzz no real restaurant"), [], "no-result searches should return no listings");

const takeout = resultSlugs("takeout");
const takeaway = resultSlugs("takeaway");
assert.ok(takeout.length > 0, "synonym search should return matching listings");
assert.deepEqual(takeout.slice(0, 10), takeaway.slice(0, 10), "takeout should normalize to takeaway");

console.log("search quality tests passed");
