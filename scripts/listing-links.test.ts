import assert from "node:assert/strict";
import type { Listing } from "../src/data/listings";
import { cleanListingUrl, getListingMapsUrl } from "../src/lib/listing-links";

function googleRedirectsAreUnwrapped() {
  assert.equal(
    cleanListingUrl(
      "/url?q=https://www.example.com/book%3Fparty%3D2&opi=79508299&sa=U&ved=test&usg=test"
    ),
    "https://www.example.com/book?party=2"
  );
}

function commaSeparatedUrlListsUseFirstValidUrl() {
  assert.equal(
    cleanListingUrl("not-a-url, https://www.example.com/menu, https://www.example.com/booking"),
    "https://www.example.com/menu"
  );
}

function unsafeProtocolsAreRejected() {
  assert.equal(cleanListingUrl("javascript:alert(1), data:text/html,test"), undefined);
}

function mapsUrlUsesExplicitGoogleMapsUrl() {
  assert.equal(
    getListingMapsUrl({
      name: "Asha",
      slug: "asha",
      images: [],
      categories: [],
      listingTypes: [],
      dietaryOptions: [],
      tags: [],
      location: {
        googleMapsUrl: "https://maps.google.com/?cid=123"
      }
    } as Listing),
    "https://maps.google.com/?cid=123"
  );
}

function mapsUrlFallsBackToSearchFromNameAndAddress() {
  assert.equal(
    getListingMapsUrl({
      name: "Asha",
      slug: "asha",
      images: [],
      categories: [],
      listingTypes: [],
      dietaryOptions: [],
      tags: [],
      fullAddress: "1 High Street, London"
    } as Listing),
    "https://www.google.com/maps/search/?api=1&query=Asha%201%20High%20Street%2C%20London"
  );
}

googleRedirectsAreUnwrapped();
commaSeparatedUrlListsUseFirstValidUrl();
unsafeProtocolsAreRejected();
mapsUrlUsesExplicitGoogleMapsUrl();
mapsUrlFallsBackToSearchFromNameAndAddress();

console.log("listing link cleanup tests passed");
