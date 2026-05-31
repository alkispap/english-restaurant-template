import type { Listing } from "@/data/listings";

const PRIOR_RATING = 4.2;
const PRIOR_REVIEW_COUNT = 50;

export function getReviewStrengthScore(listing: Pick<Listing, "rating" | "reviewCount">) {
  const rating = Number(listing.rating ?? 0);
  const reviewCount = Math.max(0, Number(listing.reviewCount ?? 0));

  if (!rating || !reviewCount) return 0;

  const weightedRating = (rating * reviewCount + PRIOR_RATING * PRIOR_REVIEW_COUNT) / (reviewCount + PRIOR_REVIEW_COUNT);
  const confidenceBoost = Math.log10(reviewCount + 1) / 10;
  return weightedRating + confidenceBoost;
}

export function compareByReviewStrength(a: Listing, b: Listing) {
  return (
    getReviewStrengthScore(b) - getReviewStrengthScore(a) ||
    Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
    Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
  );
}
