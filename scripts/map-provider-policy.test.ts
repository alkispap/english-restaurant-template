import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mapProviderConfig } from "../src/config/map-provider";
import { getTrustPage } from "../src/lib/trust-pages";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, ...relativePath.split("/")), "utf8");
const listingMap = read("src/components/ListingMap.tsx");
const trustPage = read("src/components/TrustPage.tsx");
const privacyPage = getTrustPage("privacy");
const embeddedMapSection = privacyPage.sections.find((section) => section.heading === "Embedded OpenStreetMap");
const applicationSource = collectSourceFiles(path.join(root, "src"))
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

assert.equal(
  mapProviderConfig.tileUrl,
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "map tiles should use OpenStreetMap's current single-host URL"
);
assert.doesNotMatch(applicationSource, /unpkg\.com/, "application source should not depend on unpkg at runtime");
assert.doesNotMatch(listingMap, /\{s\}\.tile\.openstreetmap\.org/, "map tiles should not use retired lettered subdomains");
assert.match(listingMap, /mapProviderConfig\.tileUrl/, "ListingMap should use the shared provider tile URL");
assert.match(listingMap, /mapProviderConfig\.attributionHtml/, "ListingMap should use the shared provider attribution");
assert.match(mapProviderConfig.attributionHtml, /openstreetmap\.org\/copyright/, "map attribution should link to OpenStreetMap licensing");

for (const assetUrl of [
  mapProviderConfig.markerIconUrl,
  mapProviderConfig.markerIconRetinaUrl,
  mapProviderConfig.markerShadowUrl
]) {
  assert.match(assetUrl, /^\/vendor\/leaflet\/images\//, `${assetUrl} should be a first-party Leaflet asset`);
  const publicAsset = path.join(root, "public", ...assetUrl.slice(1).split("/"));
  const packageAsset = path.join(root, "node_modules", "leaflet", "dist", "images", path.basename(assetUrl));
  assert.ok(fs.existsSync(publicAsset), `${assetUrl} should exist in public assets`);
  assert.ok(fs.existsSync(packageAsset), `${path.basename(assetUrl)} should exist in Leaflet 1.9.4`);
  assert.deepEqual(
    fs.readFileSync(publicAsset),
    fs.readFileSync(packageAsset),
    `${assetUrl} should match the installed Leaflet 1.9.4 asset`
  );
}

assert.ok(embeddedMapSection, "privacy policy should include an embedded OpenStreetMap section");
assert.deepEqual(
  embeddedMapSection.links,
  [
    { label: "OpenStreetMap Foundation privacy policy", href: mapProviderConfig.privacyPolicyUrl },
    { label: "OpenStreetMap tile usage policy", href: mapProviderConfig.tileUsagePolicyUrl }
  ],
  "privacy policy should expose the reviewed OpenStreetMap provider links"
);
assert.match(trustPage, /section\.links\?\.length/, "TrustPage should render optional policy links");
assert.match(trustPage, /href=\{link\.href\}/, "TrustPage policy links should use their configured destinations");

console.log("map provider policy tests passed");

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}
