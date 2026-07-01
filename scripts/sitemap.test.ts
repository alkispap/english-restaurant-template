import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import { siteConfig } from "../src/config/site";

const urls = sitemap().map((entry) => entry.url);

assert.ok(urls.includes(siteConfig.url), "homepage should be the canonical directory URL");
assert.ok(urls.includes(`${siteConfig.url}/restaurants`), "/restaurants should be listed as the canonical directory search URL");
assert.ok(!urls.includes(`${siteConfig.url}/listings`), "/listings should not be listed as a duplicate canonical URL");
assert.ok(!urls.some((url) => url.includes("?")), "query URLs should not be listed in the sitemap");
assert.ok(!urls.includes(`${siteConfig.url}/guides/template-draft-guide`), "draft guides should not be listed in the sitemap");

console.log("sitemap behavior tests passed");
