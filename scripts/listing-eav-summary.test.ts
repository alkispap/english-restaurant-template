import { buildListingEavSummary } from "../src/lib/listing-eav-summary";
import type { Listing } from "../src/data/listings";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Rich fixture: all fields populated (based on The Curry Club London shape) */
const richListing: Listing = {
  name: "Test Spice House",
  slug: "test-spice-house",
  images: [],
  categories: ["Indian", "Punjabi"],
  listingTypes: ["Fine Dining"],
  dietaryOptions: ["Vegan", "Vegetarian"],
  tags: [],
  rating: 4,
  reviewCount: 312,
  fullAddress: "10 High St, Ilford, IG6 2AD, London",
  area: "Redbridge",
  neighborhood: "Ilford",
  city: "London",
  postcode: "IG6 2AD",
  address: "10 High St",
  priceLevel: "££",
  contact: {
    website: "https://example.com",
    phone: "+44 20 1234 5678",
    reserveUrl: "https://example.com/reserve",
  },
  location: {
    latitude: 51.59,
    longitude: 0.081,
    tubeStation: "Barkingside Underground Station",
    tubeLines: ["Central"],
    tubeDistanceMeters: 641,
    tubeWalkMinutes: 9,
    nightTubeAvailable: true,
    busStop: "High Street Stop",
    busRoutes: ["128", "150", "N8"],
    busDistanceMeters: 20,
    busWalkMinutes: 1,
    nightBusAvailable: true,
  },
  details: {
    serviceOptions: ["Takeaway", "Dine-in", "Delivery"],
    diningOptions: ["Lunch", "Dinner"],
  },
};

/** Sparse fixture: minimum fields only — no transport, no services, no dietary, no reviews */
const sparseListing: Listing = {
  name: "Bare Bones Cafe",
  slug: "bare-bones-cafe",
  images: [],
  categories: ["South Indian"],
  listingTypes: [],
  dietaryOptions: [],
  tags: [],
  fullAddress: "5 Station Rd, Stepney, E1 0AA, London",
};

// ---------------------------------------------------------------------------
// Structural checks (both fixtures)
// ---------------------------------------------------------------------------

const richSummary = buildListingEavSummary(richListing);
const sparseSummary = buildListingEavSummary(sparseListing);

assert(richSummary.listingName === "Test Spice House", "richSummary.listingName should equal the listing name");
assert(sparseSummary.listingName === "Bare Bones Cafe", "sparseSummary.listingName should equal the listing name");

assert(Array.isArray(richSummary.blocks), "richSummary.blocks should be an array");
assert(richSummary.blocks.length === 7, "richSummary.blocks should always contain exactly 7 blocks");
assert(sparseSummary.blocks.length === 7, "sparseSummary.blocks should always contain exactly 7 blocks (with fallbacks)");

// Blocks must appear in the correct fixed order
const expectedOrder = ["location", "category", "services", "dietary", "transport", "reviews", "contactActions"];
for (let i = 0; i < expectedOrder.length; i++) {
  assert(
    richSummary.blocks[i].group === expectedOrder[i],
    `richSummary.blocks[${i}].group should be "${expectedOrder[i]}", got "${richSummary.blocks[i].group}"`
  );
  assert(
    sparseSummary.blocks[i].group === expectedOrder[i],
    `sparseSummary.blocks[${i}].group should be "${expectedOrder[i]}", got "${sparseSummary.blocks[i].group}"`
  );
}

// Every block must have non-empty question and answer strings
for (const block of [...richSummary.blocks, ...sparseSummary.blocks]) {
  assert(typeof block.question === "string" && block.question.length > 0, `block "${block.group}" question must be a non-empty string`);
  assert(typeof block.answer === "string" && block.answer.length > 0, `block "${block.group}" answer must be a non-empty string`);
  assert(typeof block.available === "boolean", `block "${block.group}" available must be a boolean`);
}

console.log("listing-eav-summary: structural checks passed ✓");

// ---------------------------------------------------------------------------
// Rich fixture: content checks
// ---------------------------------------------------------------------------

const richBlocks = Object.fromEntries(richSummary.blocks.map((b) => [b.group, b]));

// Location block
assert(richBlocks.location.available === true, "location block should be available when fullAddress is present");
assert(richBlocks.location.question.includes("Test Spice House"), "location question should include the listing name");
assert(richBlocks.location.answer.includes("10 High St"), "location answer should include the street address");
assert(richBlocks.location.answer.includes("Ilford"), "location answer should include the neighborhood");
assert(richBlocks.location.answer.includes("London"), "location answer should include the city");

// Category block
assert(richBlocks.category.available === true, "category block should be available when categories are present");
assert(richBlocks.category.question.includes("Test Spice House"), "category question should include the listing name");
assert(richBlocks.category.answer.includes("Indian"), "category answer should include primary category");
assert(richBlocks.category.answer.includes("Punjabi"), "category answer should include all categories");

// Services block
assert(richBlocks.services.available === true, "services block should be available when serviceOptions are present");
assert(richBlocks.services.answer.includes("Takeaway"), "services answer should include Takeaway");
assert(richBlocks.services.answer.includes("Dine-in"), "services answer should include Dine-in");
assert(richBlocks.services.answer.includes("Delivery"), "services answer should include Delivery");

// Dietary block
assert(richBlocks.dietary.available === true, "dietary block should be available when dietaryOptions are present");
assert(richBlocks.dietary.answer.includes("Vegan"), "dietary answer should include Vegan");
assert(richBlocks.dietary.answer.includes("Vegetarian"), "dietary answer should include Vegetarian");

// Transport block
assert(richBlocks.transport.available === true, "transport block should be available when tube/bus data is present");
assert(richBlocks.transport.answer.includes("Barkingside Underground Station"), "transport answer should include tube station name");
assert(richBlocks.transport.answer.includes("641"), "transport answer should include tube distance in metres");
assert(richBlocks.transport.answer.includes("9"), "transport answer should include tube walk time in minutes");
assert(richBlocks.transport.answer.includes("Central"), "transport answer should include tube line name");
assert(richBlocks.transport.answer.includes("High Street Stop"), "transport answer should include bus stop name");
assert(richBlocks.transport.answer.includes("128"), "transport answer should include bus route numbers");

// Reviews block
assert(richBlocks.reviews.available === true, "reviews block should be available when rating and reviewCount are present");
assert(richBlocks.reviews.answer.includes("listed rating"), "reviews answer should clearly identify a listed rating");
assert(richBlocks.reviews.answer.includes("4"), "reviews answer should include the numeric rating");
assert(richBlocks.reviews.answer.includes("312"), "reviews answer should include the review count");

// Contact actions block
assert(richBlocks.contactActions.available === true, "contactActions block should be available when contact actions are present");
assert(richBlocks.contactActions.answer.includes("phone"), "contactActions answer should include phone when listed");
assert(richBlocks.contactActions.answer.includes("website"), "contactActions answer should include website when listed");

console.log("listing-eav-summary: rich fixture content checks passed ✓");

// ---------------------------------------------------------------------------
// Sparse fixture: fallback / factual certainty checks
// ---------------------------------------------------------------------------

const sparseBlocks = Object.fromEntries(sparseSummary.blocks.map((b) => [b.group, b]));

// Location: fullAddress is present in sparse listing, should still be available
assert(sparseBlocks.location.available === true, "location block should be available when fullAddress is present in sparse listing");
assert(sparseBlocks.location.answer.includes("5 Station Rd"), "location answer should include address from sparse listing");

// Services: no serviceOptions in sparse listing
assert(sparseBlocks.services.available === false, "services block should be unavailable when no serviceOptions are listed");
assert(sparseBlocks.services.answer.length > 0, "services answer should still have a non-empty fallback message");

// Dietary: empty array in sparse listing
assert(sparseBlocks.dietary.available === false, "dietary block should be unavailable when dietaryOptions is empty");
assert(sparseBlocks.dietary.answer.length > 0, "dietary answer should still have a non-empty fallback message");

// Transport: no location object in sparse listing
assert(sparseBlocks.transport.available === false, "transport block should be unavailable when no location data is present");
assert(sparseBlocks.transport.answer.length > 0, "transport answer should still have a non-empty fallback message");

// Reviews: no rating in sparse listing
assert(sparseBlocks.reviews.available === false, "reviews block should be unavailable when no rating data is present");
assert(sparseBlocks.reviews.answer.length > 0, "reviews answer should still have a non-empty fallback message");
assert(sparseBlocks.contactActions.available === true, "contactActions block should allow map search from sparse listing address");

// No block should throw for any missing field
let threwOnSparse = false;
try {
  buildListingEavSummary(sparseListing);
} catch {
  threwOnSparse = true;
}
assert(!threwOnSparse, "buildListingEavSummary must not throw for a sparse listing with missing fields");

console.log("listing-eav-summary: sparse fixture fallback checks passed ✓");
