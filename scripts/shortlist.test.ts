import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import {
  addShortlistSlug,
  getCompareFields,
  getShortlistListingSummaries,
  removeShortlistSlug,
  toggleShortlistSlug
} from "../src/lib/shortlist";

const sampleListings = [
  {
    name: "Asha",
    slug: "asha",
    images: [],
    categories: ["Indian"],
    listingTypes: ["Casual Dining"],
    dietaryOptions: ["Vegan"],
    tags: [],
    area: "Camden",
    neighborhood: "Kings Cross",
    priceLevel: "\u00a3\u00a3",
    rating: 4.7,
    reviewCount: 250,
    contact: {
      website: "https://example.com",
      menuUrl: "https://example.com/menu",
      reserveUrl: "https://example.com/book"
    },
    details: {
      serviceOptions: ["Delivery", "Dine-in"],
      parking: ["Paid street parking"]
    }
  },
  {
    name: "Biryani House",
    slug: "biryani-house",
    images: [],
    categories: ["Pakistani"],
    listingTypes: [],
    dietaryOptions: [],
    tags: []
  }
] as Listing[];

function shortlistHelpersAddRemoveToggleDedupeAndEnforceLimit() {
  assert.deepEqual(addShortlistSlug([], "asha", 3), ["asha"]);
  assert.deepEqual(addShortlistSlug(["asha"], "asha", 3), ["asha"]);
  assert.deepEqual(addShortlistSlug(["a", "b", "c"], "d", 3), ["d", "a", "b"]);
  assert.deepEqual(removeShortlistSlug(["a", "b"], "a"), ["b"]);
  assert.deepEqual(toggleShortlistSlug(["a"], "a", 3), []);
  assert.deepEqual(toggleShortlistSlug(["a"], "b", 3), ["b", "a"]);
}

function compareSummariesHandleMissingOptionalFields() {
  const summaries = getShortlistListingSummaries(["missing", "biryani-house", "asha"], sampleListings);

  assert.deepEqual(summaries.map((summary) => summary.slug), ["biryani-house", "asha"]);
  assert.equal(summaries[0].ratingLabel, "Not listed");
  assert.equal(summaries[0].areaLabel, "Not listed");
  assert.equal(summaries[1].ratingLabel, "4.7");
  assert.equal(summaries[1].websiteUrl, "https://example.com/");
}

function compareFieldsExposeExpectedColumns() {
  const fields = getCompareFields();
  const fieldIds = fields.map((field) => field.id);

  assert.deepEqual(fieldIds, [
    "rating",
    "reviews",
    "price",
    "area",
    "openStatus",
    "categories",
    "dietary",
    "services",
    "parking",
    "notes",
    "links"
  ]);
}

shortlistHelpersAddRemoveToggleDedupeAndEnforceLimit();
compareSummariesHandleMissingOptionalFields();
compareFieldsExposeExpectedColumns();

console.log("shortlist behavior tests passed");
