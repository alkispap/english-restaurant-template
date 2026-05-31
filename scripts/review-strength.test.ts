import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { compareByReviewStrength, getReviewStrengthScore } from "../src/lib/review-strength";

const baseListing: Listing = {
  name: "Fixture",
  slug: "fixture",
  images: [],
  categories: ["Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: []
};

const thinFiveStar: Listing = {
  ...baseListing,
  name: "Tiny Five Star",
  slug: "tiny-five-star",
  rating: 5,
  reviewCount: 2
};

const provenFourSeven: Listing = {
  ...baseListing,
  name: "Proven Four Seven",
  slug: "proven-four-seven",
  rating: 4.7,
  reviewCount: 800
};

assert.ok(
  getReviewStrengthScore(provenFourSeven) > getReviewStrengthScore(thinFiveStar),
  "review strength should prefer strong review volume over a tiny 5-star sample"
);

const sorted = [thinFiveStar, provenFourSeven].sort(compareByReviewStrength);
assert.equal(sorted[0].slug, "proven-four-seven", "review-strength comparator should sort strongest first");

console.log("review strength tests passed");
