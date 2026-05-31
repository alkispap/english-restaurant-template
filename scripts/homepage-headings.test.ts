import assert from "node:assert/strict";
import { buildHomepageHeadings } from "../src/lib/homepage-headings";

const mexicanHeadings = buildHomepageHeadings(
  {
    niche: "Mexican restaurants in London",
    cityOrRegion: "London"
  },
  {
    listingLabel: "Restaurant",
    listingPluralLabel: "Restaurants",
    categoryLabel: "Cuisine",
    categoryPluralLabel: "Cuisines"
  }
);

const mexicanText = JSON.stringify(mexicanHeadings);

assert.equal(mexicanHeadings.heroTitle, "Mexican Restaurants in London");
assert.equal(mexicanHeadings.seoLinksTitle, "Find Mexican Restaurants in London by Area, Cuisines, and Need");
assert.equal(mexicanHeadings.resultsHeadingContext, "Mexican Restaurants in London");
assert.equal(mexicanHeadings.sourceContextTitle, "How This Restaurant Directory Works");
assert.equal(mexicanHeadings.sourceContextQuestionTitles.choose, "How should visitors choose a restaurant?");
assert.equal(mexicanHeadings.sidebarTitles.popularSearches, "Best Restaurant Searches");
assert.equal(mexicanHeadings.sidebarTitles.recentListings, "Recently Added Restaurants");
assert.equal(mexicanHeadings.sidebarTitles.usefulShortcuts, "Useful Restaurant Filters");
assert.equal(mexicanHeadings.listingRowTitles.highlyReviewed, "Highly Reviewed Mexican Restaurants in London");
assert.equal(mexicanHeadings.listingRowTitles.budgetFriendly, "Budget-Friendly Mexican Restaurants in London");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.area, "Mexican Restaurants in London by London Area");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.category, "Cuisine Types in London");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.areaCategory, "Strong Restaurant Area Pages");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.service, "Mexican Restaurants in London by Service");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.dietary, "Mexican Restaurants in London by Dietary Need");
assert.equal(mexicanHeadings.seoFeatureGroupTitles.diningStyle, "Mexican Restaurants in London by Dining Style");
assert.ok(!mexicanText.includes("Indian"), "copied homepage headings should not keep stale Indian wording");

console.log("homepage heading helper tests passed");
