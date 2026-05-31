import assert from "node:assert/strict";
import { listings, type Listing } from "../src/data/listings";
import {
  SEO_POLICY,
  getListingRobots,
  isApprovedHighIntentFacet,
  isListingIndexable,
  resolveCanonicalForSearchParams,
  scoreListingQuality,
  shouldNoindexSearchParams
} from "../src/lib/seo-policy";

const highQualityListing = listings.find((listing) => listing.businessStatus !== "CLOSED_PERMANENTLY");
assert.ok(highQualityListing, "expected at least one active listing fixture");

const thinListing: Listing = {
  name: "Thin Listing",
  slug: "thin-listing",
  images: [],
  categories: [],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
};

const closedListing: Listing = {
  ...highQualityListing,
  name: "Closed Listing",
  slug: "closed-listing",
  businessStatus: "CLOSED_PERMANENTLY"
};
const permanentClosedStatuses = [
  "CLOSED_PERMANENTLY",
  "Closed permanently",
  "Permanently closed",
  "closed-permanently",
  "closed permanently"
];
const temporarilyClosedListing: Listing = {
  ...highQualityListing,
  name: "Temporarily Closed Listing",
  slug: "temporarily-closed-listing",
  businessStatus: "CLOSED_TEMPORARILY"
};

assert.equal(SEO_POLICY.listingQualityThreshold, 70);
assert.equal(SEO_POLICY.routeThresholds.area, 5);
assert.equal(SEO_POLICY.routeThresholds.category, 10);
assert.equal(SEO_POLICY.routeThresholds.areaCategory, 5);
assert.equal(SEO_POLICY.routeThresholds.facet, 10);

assert.equal(isApprovedHighIntentFacet("service", "takeaway"), true);
assert.equal(isApprovedHighIntentFacet("service", "kerbside-pickup"), false);

assert.ok(scoreListingQuality(highQualityListing) >= SEO_POLICY.listingQualityThreshold);
assert.ok(scoreListingQuality(thinListing) < SEO_POLICY.listingQualityThreshold);
assert.equal(isListingIndexable(highQualityListing), true);
assert.equal(isListingIndexable(thinListing), false);
assert.equal(isListingIndexable(closedListing), false);
permanentClosedStatuses.forEach((businessStatus) => {
  const listing = { ...highQualityListing, businessStatus };

  assert.equal(isListingIndexable(listing), false, `${businessStatus} should not be indexable`);
  assert.deepEqual(
    getListingRobots(listing),
    { index: false, follow: true },
    `${businessStatus} should emit noindex robots`
  );
});
assert.equal(
  isListingIndexable(temporarilyClosedListing),
  true,
  "temporary closure status alone should not force noindex"
);
assert.deepEqual(getListingRobots(thinListing), { index: false, follow: true });
assert.deepEqual(getListingRobots(closedListing), { index: false, follow: true });
assert.equal(getListingRobots(highQualityListing), undefined);

assert.equal(shouldNoindexSearchParams({}), false);
assert.equal(shouldNoindexSearchParams({ area: "redbridge", service: "takeaway", open: "1" }), true);
assert.equal(resolveCanonicalForSearchParams({ area: "redbridge", service: "takeaway", open: "1" }), "/areas/redbridge");
assert.equal(resolveCanonicalForSearchParams({ category: "indian", sort: "rating" }), "/categories/indian");
assert.equal(resolveCanonicalForSearchParams({ service: "takeaway" }), "/services/takeaway");
assert.equal(resolveCanonicalForSearchParams({ service: "kerbside-pickup" }), "/");

console.log("SEO policy tests passed");
