import assert from "node:assert/strict";
import { cleanListingUrl } from "../src/lib/listing-links";

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

googleRedirectsAreUnwrapped();
commaSeparatedUrlListsUseFirstValidUrl();
unsafeProtocolsAreRejected();

console.log("listing link cleanup tests passed");
