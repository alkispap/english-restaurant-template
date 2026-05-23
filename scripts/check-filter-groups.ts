import { strict as assert } from "node:assert";
import {
  filterListings,
  getHighlightOptions,
  getPopularForOptions,
  slugify
} from "../src/lib/directory";

const highlights = getHighlightOptions();
const popularFor = getPopularForOptions();

assert(highlights.includes("Great dessert"), "Highlights filter options should include Great dessert");
assert(highlights.includes("Fireplace"), "Highlights filter options should include Fireplace");
assert(popularFor.includes("Solo dining"), "Popular for filter options should include Solo dining");

const dessertResults = filterListings({ highlight: slugify("Great dessert") });
assert(dessertResults.length > 0, "Filtering by Great dessert should return listings");
assert(
  dessertResults.every((listing) => listing.details?.highlights?.some((item) => slugify(item) === slugify("Great dessert"))),
  "Filtering by Great dessert should only return matching listings"
);

const soloDiningResults = filterListings({ popularFor: slugify("Solo dining") });
assert(soloDiningResults.length > 0, "Filtering by Solo dining should return listings");
assert(
  soloDiningResults.every((listing) => listing.details?.popularFor?.some((item) => slugify(item) === slugify("Solo dining"))),
  "Filtering by Solo dining should only return matching listings"
);

console.log("Filter group checks passed");
