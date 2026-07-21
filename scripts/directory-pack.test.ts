import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { directoryPacks, getDirectoryPack } from "../src/config/directory-packs";
import { buildSiteConfig } from "../src/config/site";

const indian = getDirectoryPack("indian-london");
const mexican = getDirectoryPack("mexican-london");

assert.equal(indian.productionUrl, "https://indianrestaurantlondon.co.uk");
assert.equal(indian.templatePreset, "restaurant");
assert.equal(mexican.templatePreset, "restaurant");
assert.equal(mexican.niche, "Mexican restaurants in London");
assert.equal(mexican.cuisineLabel, "Mexican");
assert.ok(mexican.copySafety.blockedStaleTerms.includes("mexican"));

const mexicanSite = buildSiteConfig(mexican, {});
assert.equal(mexicanSite.name, "Mexican Restaurants London");
assert.equal(mexicanSite.url, "http://localhost:3001");
assert.equal(
  buildSiteConfig(mexican, { NEXT_PUBLIC_SITE_URL: mexican.productionUrl }).url,
  "https://mexicanrestaurantslondon.example"
);
assert.equal(mexicanSite.localNicheTitle, "Mexican Restaurants");
assert.equal(mexicanSite.localNicheSingularTitle, "Mexican Restaurant");
assert.ok(mexicanSite.homepageDiscoveryCards.every((card) => !/Indian/i.test(`${card.copy} ${card.imageAlt}`)));

assert.throws(() => getDirectoryPack("unknown-pack"), /Unknown directory pack/);
assert.deepEqual(Object.keys(directoryPacks).sort(), ["indian-london", "mexican-london"]);

for (const relativePath of [
  "src/components/DirectoryListingsView.tsx",
  "src/components/GuideArticleContent.tsx"
]) {
  const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
  assert.doesNotMatch(source, /\bIndian\b|\bLondon\b/, `${relativePath} should derive niche and city copy from the active directory pack`);
}

const staticBuild = fs.readFileSync(path.join(process.cwd(), "scripts", "run-static-build.ts"), "utf8");
assert.match(staticBuild, /activeDirectoryPack\.productionUrl/, "static export should derive its default domain from the active pack");
assert.doesNotMatch(staticBuild, /indianrestaurantlondon\.co\.uk/, "static export runner should not hard-code the first directory domain");

console.log("directory pack tests passed");
