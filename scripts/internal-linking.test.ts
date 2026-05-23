import assert from "node:assert/strict";
import { getFooterGroups } from "../src/lib/directory-growth";
import {
  getDirectorySidebarBlocks,
  getHomepageSeoFeatureGroups,
  getShortcutLinksForSource
} from "../src/lib/directory-ux";

const expectedCleanSeoLinks = [
  "/services/takeaway",
  "/services/delivery",
  "/dietary/vegetarian",
  "/dietary/vegan",
  "/dietary/halal",
  "/types/casual-dining",
  "/types/fine-dining"
];

function homepageFeatureGroupsExposeCleanSeoUrls() {
  const links = getHomepageSeoFeatureGroups().flatMap((group) => group.links);
  const hrefs = new Set(links.map((link) => link.href));

  expectedCleanSeoLinks.forEach((href) => {
    assert.ok(hrefs.has(href), `homepage SEO feature groups should include ${href}`);
  });
  assert.ok(links.every((link) => !link.href.startsWith("/?")), "homepage feature links should use clean URLs");
  assert.ok(
    links.every((link) => typeof link.count === "number" && link.count > 0),
    "homepage SEO feature links should show listing counts"
  );
}

function sidebarIncludesCleanSeoFeatureUrls() {
  const blocks = getDirectorySidebarBlocks();
  const hrefs = new Set(blocks.flatMap((block) => block.links.map((link) => link.href)));

  ["/services/takeaway", "/dietary/vegetarian", "/types/casual-dining"].forEach((href) => {
    assert.ok(hrefs.has(href), `sidebar should include ${href}`);
  });
  blocks
    .flatMap((block) => block.links)
    .filter((link) => expectedCleanSeoLinks.includes(link.href))
    .forEach((link) => {
      assert.ok(typeof link.count === "number" && link.count > 0, `${link.href} should include a listing count`);
    });
}

function footerIncludesCleanSeoFeatureUrls() {
  const hrefs = new Set(getFooterGroups().flatMap((group) => group.links.map((link) => link.href)));

  ["/services/takeaway", "/dietary/vegetarian", "/types/casual-dining"].forEach((href) => {
    assert.ok(hrefs.has(href), `footer should include ${href}`);
  });
}

function userNeedShortcutsPreferCleanUrls() {
  const links = getShortcutLinksForSource("userNeeds", 10);

  assert.ok(links.some((link) => link.href === "/services/takeaway"));
  assert.ok(links.some((link) => link.href === "/dietary/vegetarian"));
  assert.ok(links.every((link) => !link.href.startsWith("/?service=")));
}

homepageFeatureGroupsExposeCleanSeoUrls();
sidebarIncludesCleanSeoFeatureUrls();
footerIncludesCleanSeoFeatureUrls();
userNeedShortcutsPreferCleanUrls();

console.log("internal linking behavior tests passed");
