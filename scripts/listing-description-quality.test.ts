import assert from "node:assert/strict";
import { listings } from "../src/data/listings";

const descriptions = listings.map((listing) => listing.description ?? "");
const metaDescriptions = listings.map((listing) => listing.metaDescription ?? "");
const allDescriptionCopy = [...descriptions, ...metaDescriptions].join("\n");

assert.equal(listings.filter((listing) => !listing.description).length, 0, "all listings should have visible descriptions");
assert.equal(listings.filter((listing) => !listing.metaDescription).length, 0, "all listings should have meta descriptions");

assert.doesNotMatch(allDescriptionCopy, /\ba Indian\b/i, "listing descriptions should use 'an Indian', not 'a Indian'");
assert.doesNotMatch(allDescriptionCopy, /Restaurant food/i, "listing descriptions should not use 'Restaurant food'");
assert.doesNotMatch(allDescriptionCopy, /restaurant covering/i, "listing descriptions should avoid mechanical 'restaurant covering' wording");
assert.doesNotMatch(allDescriptionCopy, /Restaurant restaurant/i, "listing descriptions should not say 'Restaurant restaurant'");
assert.doesNotMatch(allDescriptionCopy, /The listing includes/i, "listing descriptions should avoid mechanical 'The listing includes' wording");
assert.doesNotMatch(allDescriptionCopy, /\b1 Google reviews\b/i, "listing descriptions should use singular '1 Google review'");
assert.doesNotMatch(allDescriptionCopy, /\bGoogle reviews\b/i, "listing descriptions should not include exact review counts by default");
assert.doesNotMatch(allDescriptionCopy, /\bcompare\b/i, "restaurant descriptions should avoid unclear 'compare' wording");
assert.doesNotMatch(allDescriptionCopy, /\bin ([^,.]+), \1(?:[,.]| near|$)/i, "listing descriptions should not repeat the same location twice");
assert.doesNotMatch(allDescriptionCopy, /Restaurant \./, "listing descriptions should not contain broken 'Restaurant .' punctuation");
assert.doesNotMatch(allDescriptionCopy, /Indian and Indian\b/i, "listing descriptions should avoid duplicate broad Indian cuisine wording");

const indianDescriptions = listings
  .filter((listing) => listing.categories.some((category) => /\bIndian\b/i.test(category)))
  .map((listing) => listing.description ?? "");
assert.ok(
  indianDescriptions.every((description) => /\bis an? .+ restaurant in .+ serving .+ food\./i.test(description)),
  "Indian restaurant descriptions should answer what and where the place is in the first sentence"
);

const duplicateMetaDescriptions = new Map<string, number>();
metaDescriptions.forEach((description) => duplicateMetaDescriptions.set(description, (duplicateMetaDescriptions.get(description) ?? 0) + 1));
assert.equal(
  Array.from(duplicateMetaDescriptions.values()).filter((count) => count > 1).length,
  0,
  "restaurant meta descriptions should remain unique"
);

console.log("listing description quality tests passed");
