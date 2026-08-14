import assert from "node:assert/strict";
import { listingSlugRedirects } from "../src/data/listing-slug-redirects";
import { buildCloudflareRedirects } from "../src/lib/cloudflare-redirects";

const source = buildCloudflareRedirects();
const lines = new Set(source.trimEnd().split("\n"));

assert.ok(lines.has("/__next._full.txt /index.txt 200"));
assert.ok(lines.has("/*/__next._full.txt /:splat/index.txt 200"));

for (const [oldSlug, currentSlug] of Object.entries(listingSlugRedirects)) {
  const destination = `/restaurants/${currentSlug}/`;
  assert.ok(lines.has(`/listings/${oldSlug} ${destination} 301`));
  assert.ok(lines.has(`/listings/${oldSlug}/ ${destination} 301`));
  assert.ok(lines.has(`/restaurants/${oldSlug} ${destination} 301`));
  assert.ok(lines.has(`/restaurants/${oldSlug}/ ${destination} 301`));
}

assert.ok(lines.has("/listings/:slug /restaurants/:slug/ 301"));
assert.ok(lines.has("/listings/:slug/ /restaurants/:slug/ 301"));
assert.ok(lines.has("/listings /restaurants/ 301"));
assert.ok(lines.has("/listings/ /restaurants/ 301"));

console.log("Cloudflare redirect generation tests passed");
