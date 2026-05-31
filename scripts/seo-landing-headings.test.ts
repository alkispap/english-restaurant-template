import assert from "node:assert/strict";
import {
  buildSeoLandingHeadings,
  type SeoLandingHeadingDirectoryConfig,
  type SeoLandingHeadingSiteConfig
} from "../src/lib/seo-landing-headings";

const site: SeoLandingHeadingSiteConfig = {
  niche: "Indian restaurants in London",
  cityOrRegion: "London"
};

const directory: SeoLandingHeadingDirectoryConfig = {
  listingLabel: "Restaurant",
  listingPluralLabel: "Restaurants",
  categoryLabel: "Cuisine",
  categoryPluralLabel: "Cuisines"
};

const indian = buildSeoLandingHeadings(site, directory);

assert.equal(indian.area("Camden").heroTitle, "Restaurants in Camden");
assert.equal(indian.area("Camden").eyebrow, "Camden Restaurant Guide");
assert.equal(indian.area("Camden").guideTitle, "Compare Restaurants in Camden");
assert.equal(indian.area("Camden").related.areaLinksTitle, "More London Restaurant Areas");
assert.equal(indian.area("Camden").related.usefulSearchesTitle, "Useful Restaurant Searches in London");
assert.equal(indian.area("Camden").faq.chooseQuestion, "How do I choose a restaurant in Camden?");

assert.equal(indian.neighborhood("Soho").eyebrow, "Soho Restaurant Guide");
assert.equal(indian.neighborhood("Soho").related.areaLinksTitle, "Related London Restaurant Areas");

assert.equal(indian.category("Indian").heroTitle, "Indian Restaurants in London");
assert.equal(indian.category("Indian").guideTitle, "How to Compare Indian Restaurants");
assert.equal(indian.category("Indian").related.areaCategoryLinksTitle, "Popular Areas for Indian Restaurants");
assert.equal(indian.category("Indian").related.categoryLinksTitle, "Related Cuisine Pages");

assert.equal(indian.areaCategory("Camden", "Indian").heroTitle, "Indian Restaurants in Camden");
assert.equal(indian.areaCategory("Camden", "Indian").eyebrow, "Camden Indian Restaurant Guide");
assert.equal(indian.areaCategory("Camden", "Indian").related.areaLinksTitle, "More Indian Areas");
assert.equal(indian.areaCategory("Camden", "Indian").related.categoryLinksTitle, "More Cuisines in Camden");

assert.equal(indian.best("Best-rated Indian restaurants in London").eyebrow, "Best Restaurant Search");
assert.equal(indian.best("Best-rated Indian restaurants in London").guideTitle, "How This Restaurant Shortlist Is Assembled");
assert.equal(indian.best("Best-rated Indian restaurants in London").related.areaLinksTitle, "Compare Indian Restaurants in London by Area");

assert.equal(indian.facet("Takeaway").heroTitle, "Takeaway Restaurants in London");
assert.equal(indian.facet("Takeaway").guideTitle, "When Takeaway Matters");
assert.equal(indian.facet("Takeaway").related.categoryLinksTitle, "Related Cuisine Pages");

const mexican = buildSeoLandingHeadings(
  { niche: "Mexican restaurants in London", cityOrRegion: "London" },
  directory
);
const mexicanText = JSON.stringify([
  mexican.category("Mexican"),
  mexican.areaCategory("Camden", "Mexican"),
  mexican.best("Best-rated Mexican restaurants in London"),
  mexican.facet("Takeaway")
]);

assert.ok(mexicanText.includes("Mexican"), "fake copied config should produce Mexican headings");
assert.ok(!mexicanText.includes("Indian"), "fake copied config should not keep stale Indian wording");

console.log("SEO landing heading helper tests passed");
