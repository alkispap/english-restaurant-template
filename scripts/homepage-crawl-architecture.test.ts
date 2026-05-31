import assert from "node:assert/strict";
import {
  getHomepageSeoFeatureGroups,
  getHomepageSidebarBlocks,
  getHomepageSourceContextGuide
} from "../src/lib/directory-ux";
import { homepageHeadings } from "../src/lib/homepage-headings";

const groups = getHomepageSeoFeatureGroups();
const groupTitles = new Set(groups.map((group) => group.title));
const links = groups.flatMap((group) => group.links);
const hrefs = links.map((link) => link.href);

assert.ok(groupTitles.has(homepageHeadings.seoFeatureGroupTitles.area), "homepage SEO links should include top area hubs");
assert.ok(
  groupTitles.has(homepageHeadings.seoFeatureGroupTitles.category),
  "homepage SEO links should include top category hubs"
);
assert.ok(
  groupTitles.has(homepageHeadings.seoFeatureGroupTitles.areaCategory),
  "homepage SEO links should include area+category hubs"
);
assert.ok(
  groupTitles.has(homepageHeadings.seoFeatureGroupTitles.service),
  "homepage SEO links should keep high-intent facet hubs"
);
assert.ok(hrefs.some((href) => href.startsWith("/areas/")), "expected at least one clean area URL");
assert.ok(hrefs.some((href) => href.startsWith("/categories/")), "expected at least one clean category URL");
assert.ok(
  hrefs.some((href) => /^\/areas\/[^/]+\/categories\/[^/]+$/.test(href)),
  "expected at least one clean area+category URL"
);
assert.ok(hrefs.some((href) => href === "/services/takeaway"), "expected takeaway service hub");
assert.ok(hrefs.every((href) => !href.startsWith("/?") && !href.includes("?")), "homepage SEO links should be clean URLs");
assert.ok(links.every((link) => typeof link.count === "number" && link.count > 0), "homepage SEO links should show counts");

const homepageSidebarBlocks = getHomepageSidebarBlocks();
const homepageSidebarTitles = homepageSidebarBlocks.map((block) => block.title);
const homepageSidebarSources = homepageSidebarBlocks.map((block) => block.source);

assert.deepEqual(
  homepageSidebarTitles,
  [
    homepageHeadings.sidebarTitles.popularSearches,
    homepageHeadings.sidebarTitles.recentListings,
    homepageHeadings.sidebarTitles.usefulShortcuts
  ],
  "homepage sidebar should use specific headings and avoid duplicating top hub blocks"
);
assert.ok(
  !homepageSidebarSources.some((source) => ["topAreas", "topCategories", "seoFeatures"].includes(source)),
  "homepage sidebar should not repeat the primary SEO hub groups"
);

const repeatedHrefCounts = new Map<string, number>();
links.forEach((link) => repeatedHrefCounts.set(link.href, (repeatedHrefCounts.get(link.href) ?? 0) + 1));
assert.ok(
  Array.from(repeatedHrefCounts.values()).every((count) => count === 1),
  "primary homepage SEO hub links should not repeat destinations inside the top block"
);

const sourceContextGuide = getHomepageSourceContextGuide();
const guideText = [
  sourceContextGuide.title,
  sourceContextGuide.intro,
  ...sourceContextGuide.points.map((point) => `${point.title} ${point.copy}`)
].join(" ");

assert.equal(
  sourceContextGuide.title,
  homepageHeadings.sourceContextTitle,
  "homepage source-context guide should be a compact support strip"
);
assert.ok(
  sourceContextGuide.intro.includes("Indian restaurants in London"),
  "homepage source-context guide should reinforce the central directory entity without making it the section headline"
);
assert.ok(guideText.includes("directory dataset"), "homepage should explain its source type");
assert.ok(guideText.includes("updated"), "homepage should explain freshness or update context");
assert.ok(guideText.includes("ratings") && guideText.includes("review counts"), "homepage should explain review signals");
assert.ok(guideText.includes("Compare"), "homepage should explain how visitors can choose between listings");

console.log("homepage crawl architecture tests passed");
