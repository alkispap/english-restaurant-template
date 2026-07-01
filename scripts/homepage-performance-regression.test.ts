import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const homePagePath = path.join(root, "src", "app", "page.tsx");
const savedListingsLinkPath = path.join(root, "src", "components", "SavedListingsLink.tsx");
const outIndexPath = path.join(root, "out", "index.html");
const appBuildManifestPath = path.join(root, ".next", "app-build-manifest.json");

const homePage = fs.readFileSync(homePagePath, "utf8");
assert.ok(!homePage.includes("Suspense"), "homepage should not wrap main directory content in a null Suspense fallback");

const savedListingsLink = fs.readFileSync(savedListingsLinkPath, "utf8");
assert.ok(
  savedListingsLink.includes("prefetch={false}"),
  "Saved listings link should disable prefetch so the compare page dataset chunk is not pulled into the homepage"
);

if (fs.existsSync(outIndexPath)) {
  const html = fs.readFileSync(outIndexPath, "utf8");
  const mainIndex = html.indexOf("<main");
  const footerIndex = html.indexOf("<footer");

  assert.ok(mainIndex >= 0, "exported homepage should include server-rendered <main> content");
  assert.ok(footerIndex >= 0, "exported homepage should include footer content");
  assert.ok(mainIndex < footerIndex, "server-rendered homepage main content should appear before the footer");
  assert.ok(
    !html.includes("BAILOUT_TO_CLIENT_SIDE_RENDERING"),
    "exported homepage should not bail out to client-side rendering"
  );
}

if (fs.existsSync(appBuildManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(appBuildManifestPath, "utf8")) as {
    pages?: Record<string, string[]>;
  };
  const homepageChunks = manifest.pages?.["/page"] ?? [];
  assert.ok(
    homepageChunks.every((chunk) => !chunk.includes("/153-") && !chunk.includes("\\153-")),
    "homepage build manifest should not include the large listing dataset chunk"
  );
}

console.log("homepage performance regression tests passed");
