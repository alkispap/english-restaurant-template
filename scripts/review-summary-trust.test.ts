import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listings } from "../src/data/listings";

const reviewSummarySource = fs.readFileSync(path.join(process.cwd(), "src/components/ReviewSummary.tsx"), "utf8");

function currentDatasetDoesNotStoreStarDistribution() {
  const listingsWithReviews = listings.filter((listing) => Number(listing.reviewCount ?? 0) > 0);
  const listingsWithDistribution = listingsWithReviews.filter(
    (listing) => listing.reviewDistribution && Object.keys(listing.reviewDistribution).length > 0
  );

  assert.equal(listingsWithReviews.length, 3119, "expected current directory dataset to include Google review counts");
  assert.equal(
    listingsWithDistribution.length,
    0,
    "current directory dataset should not be treated as having star-by-star review distribution"
  );
}

function reviewSummaryDoesNotInventStarDistribution() {
  assert.ok(
    !reviewSummarySource.includes("Math.round(reviewCount *"),
    "ReviewSummary should not calculate a fake star distribution from total review count"
  );
  assert.ok(
    !reviewSummarySource.includes("distribution ||"),
    "ReviewSummary should not fall back to estimated star distribution data"
  );
}

function reviewSummaryExplainsGoogleReviewSourceWhenDistributionMissing() {
  assert.ok(
    reviewSummarySource.includes("Google Business/Profile"),
    "ReviewSummary should explain that rating and review count come from Google Business/Profile data"
  );
  assert.ok(
    reviewSummarySource.includes("Star-by-star distribution is not currently stored"),
    "ReviewSummary should clearly say when star-by-star distribution is unavailable"
  );
}

currentDatasetDoesNotStoreStarDistribution();
reviewSummaryDoesNotInventStarDistribution();
reviewSummaryExplainsGoogleReviewSourceWhenDistributionMissing();

console.log("review summary trust tests passed");
