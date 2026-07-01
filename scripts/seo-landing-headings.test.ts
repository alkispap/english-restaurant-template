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

assert.equal(indian.area("Camden").heroTitle, "Indian Restaurants in Camden, London");
assert.equal(indian.area("Camden").eyebrow, "Camden Restaurant Guide");
assert.equal(indian.area("Camden").guideTitle, "Compare Indian Restaurants in Camden");
assert.equal(indian.area("Camden").related.areaLinksTitle, "More London Areas for Indian Restaurants");
assert.equal(indian.area("Camden").related.areaCategoryLinksTitle, "Popular Indian Restaurant Cuisines in Camden");
assert.equal(indian.area("Camden").related.usefulSearchesTitle, "Useful Indian Restaurant Searches in London");
assert.equal(indian.area("Camden").faq.chooseQuestion, "How do I choose an Indian restaurant in Camden?");
assert.equal(indian.sectionTitles.informationGain, "Indian Restaurant Decision Signals");
assert.equal(indian.sectionTitles.faqs, "Indian Restaurant Questions People Ask");

assert.equal(indian.neighborhood("Soho").eyebrow, "Soho Restaurant Guide");
assert.equal(indian.neighborhood("Soho").heroTitle, "Indian Restaurants in Soho, London");
assert.equal(indian.neighborhood("Soho").resultsHeadingContext, "Indian Restaurants in Soho");
assert.equal(indian.neighborhood("Soho").guideTitle, "Compare Indian Restaurants in Soho");
assert.equal(indian.neighborhood("Soho").related.areaLinksTitle, "Related London Areas for Indian Restaurants");
assert.equal(indian.neighborhood("Soho").related.categoryLinksTitle, "Related Indian Restaurant Cuisine Pages");
assert.equal(indian.neighborhood("Soho").faq.chooseQuestion, "What is the fastest way to compare Indian restaurants in Soho?");

assert.equal(indian.category("Indian").heroTitle, "Indian Restaurants in London");
assert.equal(indian.category("Indian").resultsHeadingContext, "Indian Restaurants in London");
assert.equal(indian.category("Indian").guideTitle, "How to Compare Indian Restaurants in London");
assert.equal(indian.category("Indian").related.areaCategoryLinksTitle, "Popular London Areas for Indian Restaurants");
assert.equal(indian.category("Indian").related.categoryLinksTitle, "Related Indian Restaurant Cuisine Pages");

assert.equal(indian.areaCategory("Camden", "Indian").heroTitle, "Indian Restaurants in Camden, London");
assert.equal(indian.areaCategory("Camden", "Indian").resultsHeadingContext, "Indian Restaurants in Camden");
assert.equal(indian.areaCategory("Camden", "Indian").eyebrow, "Camden Indian Restaurant Guide");
assert.equal(indian.areaCategory("Camden", "Indian").related.areaLinksTitle, "More London Areas for Indian Restaurants");
assert.equal(indian.areaCategory("Camden", "Indian").related.categoryLinksTitle, "More Indian Restaurant Cuisines in Camden");

assert.equal(indian.best("Best rated restaurants in London").eyebrow, "Best Indian Restaurant Search");
assert.equal(indian.best("Best rated restaurants in London").heroTitle, "Best rated Indian restaurants in London");
assert.equal(indian.best("Best rated restaurants in London").resultsHeadingContext, "Indian Restaurants in London");
assert.equal(indian.best("Best rated restaurants in London").guideTitle, "How This Indian Restaurant Shortlist Is Assembled");
assert.equal(indian.best("Best rated restaurants in London").related.areaLinksTitle, "Compare Indian Restaurants in London by Area");
assert.equal(indian.best("Best rated restaurants in London").related.categoryLinksTitle, "Related Indian Restaurant Cuisine Pages");
assert.equal(
  indian.best("Best rated restaurants in London").related.areaCategoryLinksTitle,
  "Useful Indian Restaurant Area and Cuisine Combinations"
);

assert.equal(indian.facet("service", "Takeaway").heroTitle, "Indian Restaurants with Takeaway in London");
assert.equal(indian.facet("service", "Takeaway").resultsHeadingContext, "Indian Restaurants with Takeaway in London");
assert.equal(indian.facet("service", "Takeaway").guideTitle, "When Takeaway Matters for Indian Restaurants");
assert.equal(indian.facet("service", "Takeaway").related.categoryLinksTitle, "Related Indian Restaurant Cuisine Pages");
assert.equal(indian.facet("dietary", "Halal").heroTitle, "Halal Indian Restaurants in London");
assert.equal(indian.facet("dietary", "Halal").resultsHeadingContext, "Halal Indian Restaurants in London");
assert.equal(indian.facet("offering", "Alcohol").heroTitle, "Indian Restaurants with Alcohol in London");
assert.equal(indian.facet("offering", "Alcohol").resultsHeadingContext, "Indian Restaurants with Alcohol in London");
assert.equal(indian.facet("type", "Casual Dining").heroTitle, "Casual Dining Indian Restaurants in London");
assert.equal(indian.facet("type", "Casual Dining").resultsHeadingContext, "Casual Dining Indian Restaurants in London");

const mexican = buildSeoLandingHeadings(
  { niche: "Mexican restaurants in London", cityOrRegion: "London" },
  directory
);
const mexicanText = JSON.stringify([
  mexican.category("Mexican"),
  mexican.areaCategory("Camden", "Mexican"),
  mexican.best("Best-rated Mexican restaurants in London"),
  mexican.facet("service", "Takeaway")
]);

assert.ok(mexicanText.includes("Mexican"), "fake copied config should produce Mexican headings");
assert.ok(!mexicanText.includes("Indian"), "fake copied config should not keep stale Indian wording");

console.log("SEO landing heading helper tests passed");
