import assert from "node:assert/strict";
import { buildListingImageAlt } from "../src/lib/listing-image-alt";

function completeListingDataBuildsSearchFriendlyAltText() {
  assert.equal(
    buildListingImageAlt({
      name: "The Curry Club",
      categories: ["Indian", "Punjabi"],
      neighborhood: "Barkingside",
      area: "Ilford",
      city: "London"
    }),
    "The Curry Club Indian restaurant in Barkingside, London"
  );
}

function missingNeighborhoodFallsBackToArea() {
  assert.equal(
    buildListingImageAlt({
      name: "Hyderabad Darbar",
      categories: ["South Indian"],
      area: "Ilford",
      city: "London"
    }),
    "Hyderabad Darbar South Indian restaurant in Ilford, London"
  );
}

function missingCategoryKeepsUsefulRestaurantAltText() {
  assert.equal(
    buildListingImageAlt({
      name: "Masala King",
      categories: [],
      neighborhood: "Euston",
      city: "London"
    }),
    "Masala King restaurant in Euston, London"
  );
}

function listingNameWithLondonDoesNotRepeatLondon() {
  assert.equal(
    buildListingImageAlt({
      name: "The Curry Club London",
      categories: ["Indian"],
      neighborhood: "Barkingside",
      city: "London"
    }),
    "The Curry Club London Indian restaurant in Barkingside"
  );
}

function galleryVariantAddsReadableImageNumber() {
  assert.equal(
    buildListingImageAlt(
      {
        name: "Saravanaa Bhavan",
        categories: ["South Indian"],
        neighborhood: "Cranbrook",
        city: "London"
      },
      { variant: "gallery", index: 2 }
    ),
    "Saravanaa Bhavan South Indian restaurant in Cranbrook, London photo 3"
  );
}

completeListingDataBuildsSearchFriendlyAltText();
missingNeighborhoodFallsBackToArea();
missingCategoryKeepsUsefulRestaurantAltText();
listingNameWithLondonDoesNotRepeatLondon();
galleryVariantAddsReadableImageNumber();

console.log("listing image alt tests passed");
