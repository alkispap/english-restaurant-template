import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { enrichListingsWithOutscraperMedia, parseOutscraperPhotoCsv, type OutscraperPhotoRow } from "../src/lib/outscraper-media-enrichment";

function listing(overrides: Partial<Listing>): Listing {
  return {
    name: "Sample Restaurant",
    slug: "sample-restaurant",
    images: [],
    categories: ["Indian"],
    listingTypes: [],
    dietaryOptions: [],
    tags: [],
    ...overrides
  };
}

function row(overrides: Partial<OutscraperPhotoRow>): OutscraperPhotoRow {
  return {
    name: "Sample Restaurant",
    place_id: "matched-place",
    photo_url: "",
    photo_url_big: "",
    original_photo_url: "",
    photo_tags: "",
    ...overrides
  };
}

function matchedListingsReplaceExistingImagesAndSeparateMenus() {
  const sourceListings = [
    listing({
      name: "Matched Restaurant",
      slug: "matched-restaurant",
      images: ["https://old.example.com/photo.jpg"],
      details: { placeId: "matched-place" }
    })
  ];
  const photoRows = [
    row({ photo_url_big: "https://lh3.googleusercontent.com/photo-1" }),
    row({ photo_url_big: "https://lh3.googleusercontent.com/menu-1", photo_tags: "menu, other" }),
    row({ original_photo_url: "https://lh3.googleusercontent.com/photo-2-original", photo_url: "https://small.example.com/photo-2" }),
    row({ photo_url_big: "https://lh3.googleusercontent.com/photo-1" }),
    row({ photo_url: "https://lh3.googleusercontent.com/photo-3" }),
    row({ photo_url_big: "https://lh3.googleusercontent.com/photo-4" }),
    row({ photo_url_big: "https://lh3.googleusercontent.com/photo-5" }),
    row({ photo_url_big: "https://lh3.googleusercontent.com/photo-6" })
  ];

  const result = enrichListingsWithOutscraperMedia(sourceListings, photoRows);

  assert.deepEqual(result.listings[0].images, [
    "https://lh3.googleusercontent.com/photo-1",
    "https://lh3.googleusercontent.com/photo-2-original",
    "https://lh3.googleusercontent.com/photo-3",
    "https://lh3.googleusercontent.com/photo-4",
    "https://lh3.googleusercontent.com/photo-5"
  ]);
  assert.deepEqual(result.listings[0].menuImages, ["https://lh3.googleusercontent.com/menu-1"]);
  assert.equal(result.report.matchedRestaurants, 1);
  assert.equal(result.report.restaurantsWithFivePhotos, 1);
  assert.equal(result.report.restaurantsWithMenuImages, 1);
}

function unmatchedListingsAreLeftUnchanged() {
  const sourceListings = [
    listing({
      name: "Unmatched Restaurant",
      slug: "unmatched-restaurant",
      images: ["https://old.example.com/photo.jpg"],
      details: { placeId: "unmatched-place" }
    })
  ];

  const result = enrichListingsWithOutscraperMedia(sourceListings, [
    row({ place_id: "different-place", photo_url_big: "https://lh3.googleusercontent.com/photo" })
  ]);

  assert.deepEqual(result.listings[0].images, ["https://old.example.com/photo.jpg"]);
  assert.equal(result.listings[0].menuImages, undefined);
  assert.equal(result.report.matchedRestaurants, 0);
}

function menuImagesCanReplaceStaleMenuImagesWhenMatched() {
  const sourceListings = [
    listing({
      name: "Menu Restaurant",
      slug: "menu-restaurant",
      images: ["https://old.example.com/photo.jpg"],
      menuImages: ["https://old.example.com/menu.jpg"],
      details: { placeId: "matched-place" }
    })
  ];

  const result = enrichListingsWithOutscraperMedia(sourceListings, [
    row({ photo_url_big: "https://lh3.googleusercontent.com/menu-new", photo_tags: "MENU" })
  ]);

  assert.deepEqual(result.listings[0].images, []);
  assert.deepEqual(result.listings[0].menuImages, ["https://lh3.googleusercontent.com/menu-new"]);
}

function csvParserReadsOutscraperPhotoRows() {
  const csv = [
    "query,name,place_id,photo_url,photo_url_big,original_photo_url,photo_tags",
    "\"Sample, query\",Sample Restaurant,matched-place,https://small.example.com/photo,https://big.example.com/photo,,\"menu, other\""
  ].join("\n");

  const rows = parseOutscraperPhotoCsv(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].place_id, "matched-place");
  assert.equal(rows[0].photo_url_big, "https://big.example.com/photo");
  assert.equal(rows[0].photo_tags, "menu, other");
}

matchedListingsReplaceExistingImagesAndSeparateMenus();
unmatchedListingsAreLeftUnchanged();
menuImagesCanReplaceStaleMenuImagesWhenMatched();
csvParserReadsOutscraperPhotoRows();

console.log("outscraper media enrichment tests passed");
