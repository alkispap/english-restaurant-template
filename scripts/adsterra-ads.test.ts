import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const adConfigPath = path.join(root, "src", "config", "adsterra.ts");
const adComponentPath = path.join(root, "src", "components", "AdsterraAd.tsx");
const directoryViewSource = read("src/components/DirectoryListingsView.tsx");
const listingResultsListSource = read("src/components/ListingResultsList.tsx");
const responsiveFiltersSource = read("src/components/ResponsiveDirectoryFilters.tsx");
const guideArticleSource = read("src/components/GuideArticleContent.tsx");
const listingDetailSource = read("src/app/restaurants/[slug]/page.tsx");
const trustPagesSource = read("src/lib/trust-pages.ts");

assert.ok(fs.existsSync(adConfigPath), "Adsterra ad config should exist");
assert.ok(fs.existsSync(adComponentPath), "Adsterra ad component should exist");

const adConfigSource = fs.readFileSync(adConfigPath, "utf8");
const adComponentSource = fs.readFileSync(adComponentPath, "utf8");

[
  "728x90",
  "468x60",
  "320x50",
  "300x250",
  "160x300",
  "160x600",
  "NativeBanner"
].forEach((placement) => {
  assert.ok(adConfigSource.includes(placement), `ad config should include ${placement}`);
});

[
  "5baa2f0948d0e7b27745d8cd8c147ffb",
  "494f4fb5f74f04f443dd0ba8568bec9c",
  "d40e799bae619ac49cdc28a7c353ffb5",
  "64613f6dfca37108b55f494dd4ea8546",
  "8d8681504e24d5d920a8cad537f7d3c4"
].forEach((key) => {
  assert.ok(adConfigSource.includes(key), `ad config should include Adsterra key ${key}`);
});

assert.ok(!adConfigSource.includes("a3a2493ac8519efd48f4a2a364f4897e"), "popunder script should not be enabled in v1");
assert.match(adComponentSource, /"use client"/, "ad component should be client-side");
assert.match(adComponentSource, /Advertisement/, "ad component should label ad areas");
assert.match(adComponentSource, /no-print/, "ad component should be hidden from print");
assert.match(adComponentSource, /localhost|127\.0\.0\.1/, "ad component should support local preview placeholders");

assert.match(directoryViewSource, /AdsterraAd/, "directory view should render top display ads");
assert.match(directoryViewSource, /placement="728x90"/, "directory view should include desktop leaderboard ad");
assert.match(directoryViewSource, /placement="468x60"/, "homepage should include a mid-page desktop banner ad");
assert.match(directoryViewSource, /placement="320x50"/, "directory view should include mobile banner ad");
assert.match(listingResultsListSource, /placement="300x250"/, "listing results should include one in-content ad");
assert.match(listingResultsListSource, /index === 2 \|\| index === 7/, "listing results should include two spaced in-content ads on longer pages");
assert.match(responsiveFiltersSource, /placement="160x600"/, "desktop filters/sidebar should include a skyscraper ad");
assert.match(responsiveFiltersSource, /placement="320x50"/, "mobile filters should include a small lower mobile ad");
assert.match(guideArticleSource, /placement="300x250"/, "guide articles should include in-article ad");
assert.match(guideArticleSource, /placement="NativeBanner"/, "guide articles should include native banner ad");
assert.match(listingDetailSource, /placement="300x250"/, "listing detail sidebar should include a display ad");
assert.ok(
  countOccurrences(listingDetailSource, 'placement="300x250"') >= 2,
  "listing detail pages should include a lower display ad before similar restaurants"
);

assert.match(trustPagesSource, /Advertising and Cookies/, "privacy policy should disclose advertising and cookies");
assert.match(trustPagesSource, /third-party ad partners/i, "privacy policy should mention third-party ad partners");
assert.match(trustPagesSource, /cookies or similar technologies/i, "privacy policy should mention cookies or similar technologies");

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, ...relativePath.split("/")), "utf8");
}

function countOccurrences(value: string, pattern: string) {
  return value.split(pattern).length - 1;
}
