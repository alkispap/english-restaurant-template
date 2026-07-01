import assert from "node:assert/strict";
import {
  getAreaCategorySeoPage,
  getAreaSeoPage,
  getCategorySeoPage,
  getFacetSeoPage
} from "../src/lib/seo-pages";

const sampledPages = [
  getAreaSeoPage("harrow", {}),
  getAreaSeoPage("barnet", {}),
  getAreaSeoPage("redbridge", {}),
  getCategorySeoPage("indian", {}),
  getCategorySeoPage("pakistani", {}),
  getFacetSeoPage("service", "takeaway", {}),
  getFacetSeoPage("dietary", "halal", {}),
  getFacetSeoPage("type", "casual-dining", {}),
  getAreaCategorySeoPage("harrow", "indian", {}),
  getAreaCategorySeoPage("redbridge", "indian", {})
].filter((page): page is NonNullable<typeof page> => Boolean(page));

function guideCopyUsesPageSpecificSignals() {
  for (const page of sampledPages) {
    assert.ok(
      /\d/.test(page.guide.body),
      `${page.hero.title} guide copy should include a page-specific data point`
    );
    assert.ok(
      !/This page narrows the directory to one area and one cuisine or category\./i.test(page.guide.body),
      `${page.hero.title} should not use generic area-category guide copy`
    );
    assert.ok(
      !/This feature-led list focuses on .+ where .+ is available\./i.test(page.guide.body),
      `${page.hero.title} should not use generic facet guide copy`
    );
  }
}

function sameFamilyGuideCopyIsNotNearDuplicate() {
  const pairs = [
    ["Harrow area", getAreaSeoPage("harrow", {}), "Barnet area", getAreaSeoPage("barnet", {})],
    ["Takeaway service", getFacetSeoPage("service", "takeaway", {}), "Halal dietary", getFacetSeoPage("dietary", "halal", {})],
    ["Harrow Indian", getAreaCategorySeoPage("harrow", "indian", {}), "Redbridge Indian", getAreaCategorySeoPage("redbridge", "indian", {})],
    ["Indian category", getCategorySeoPage("indian", {}), "Pakistani category", getCategorySeoPage("pakistani", {})]
  ] as const;

  for (const [aLabel, aPage, bLabel, bPage] of pairs) {
    assert.ok(aPage, `expected ${aLabel}`);
    assert.ok(bPage, `expected ${bLabel}`);
    const similarity = jaccard(tokens(aPage.guide.body), tokens(bPage.guide.body));

    assert.ok(
      similarity < 0.72,
      `${aLabel} and ${bLabel} guide copy is too similar: ${similarity.toFixed(2)}`
    );
  }
}

function tokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>) {
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

guideCopyUsesPageSpecificSignals();
sameFamilyGuideCopyIsNotNearDuplicate();

console.log("content uniqueness tests passed");
