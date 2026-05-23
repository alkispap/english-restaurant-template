import assert from "node:assert/strict";
import { normalizeSiteUrl } from "../src/lib/site-url";

assert.equal(normalizeSiteUrl("https://example.com/"), "https://example.com");
assert.equal(normalizeSiteUrl(" https://example.com/directory/ "), "https://example.com/directory");
assert.equal(normalizeSiteUrl("not a url"), "http://localhost:3001");
assert.equal(normalizeSiteUrl(undefined), "http://localhost:3001");

console.log("site url tests passed");
