import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { siteConfig } from "../src/config/site";

const urls = sitemap().map((entry) => entry.url);

assert.ok(urls.includes(siteConfig.url), "homepage should be the canonical directory URL");
assert.ok(!urls.includes(`${siteConfig.url}/listings`), "/listings should not be listed as a duplicate canonical URL");

console.log("sitemap behavior tests passed");
