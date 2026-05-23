import assert from "node:assert/strict";
import { getLowestPricedListings, getMostReviewedListings } from "../src/lib/directory";

function mostReviewedListingsSortByReviewCountThenRating() {
  const listings = getMostReviewedListings(4);

  assert.equal(listings.length, 4);

  for (let index = 1; index < listings.length; index += 1) {
    const previous = listings[index - 1];
    const current = listings[index];
    const previousReviews = Number(previous.reviewCount ?? 0);
    const currentReviews = Number(current.reviewCount ?? 0);

    assert.ok(
      previousReviews > currentReviews ||
        (previousReviews === currentReviews && Number(previous.rating ?? 0) >= Number(current.rating ?? 0))
    );
  }
}

function lowestPricedListingsOnlyIncludeKnownPricesAndSortByPrice() {
  const listings = getLowestPricedListings(4);

  assert.equal(listings.length, 4);
  assert.ok(listings.every((listing) => listing.priceLevel));

  for (let index = 1; index < listings.length; index += 1) {
    const previousPrice = listings[index - 1].priceLevel?.length ?? 9;
    const currentPrice = listings[index].priceLevel?.length ?? 9;

    assert.ok(previousPrice <= currentPrice);
  }
}

mostReviewedListingsSortByReviewCountThenRating();
lowestPricedListingsOnlyIncludeKnownPricesAndSortByPrice();

console.log("directory ranking behavior tests passed");
