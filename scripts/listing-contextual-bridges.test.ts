import { getListingExploreLinks } from "../src/lib/directory-growth";
import { listings } from "../src/data/listings";

async function runTests() {
  console.log("\nRunning listing-contextual-bridges.test.ts");
  let passed = true;

  const saravanaa = listings.find((listing) => listing.slug === "saravanaa-bhavan");
  if (!saravanaa) throw new Error("Fixture not found");

  const groups = getListingExploreLinks(saravanaa);

  if (!Array.isArray(groups) || !groups.every((group) => group.title && group.description && Array.isArray(group.links))) {
    console.error("Expected getListingExploreLinks to return described ContextualBridgeGroup objects");
    passed = false;
  }

  const localAreaGroup = groups.find((group) => group.title === "Indian Restaurants Near Redbridge");
  const cuisineGroup = groups.find((group) => group.title === "Similar Indian Cuisine in London");
  const featuresGroup = groups.find((group) => group.title === "Indian Restaurants by Features and Dietary Needs");

  if (!localAreaGroup || !cuisineGroup || !featuresGroup) {
    console.error("Expected keyword-focused restaurant detail bridge groups to exist");
    passed = false;
  } else {
    const hasAreaLink = localAreaGroup.links.some((link) => link.href.includes("/areas/"));
    const hasCategoryLink = cuisineGroup.links.some((link) => link.href.includes("/categories/"));

    if (!hasAreaLink || !hasCategoryLink) {
      console.error("Groups do not contain the expected relevant contextual links");
      passed = false;
    }

    if (!/Indian restaurants in [A-Z]/.test(localAreaGroup.description)) {
      console.error("Local area group description should mention Indian restaurants and a local area");
      passed = false;
    }

    if (!cuisineGroup.description.includes("Indian restaurants in London")) {
      console.error("Similar cuisine group description should mention the directory niche");
      passed = false;
    }

    if (!featuresGroup.description.includes("Indian restaurants in London")) {
      console.error("Features group description should mention the directory niche");
      passed = false;
    }

    if (/compare/i.test(cuisineGroup.description)) {
      console.error("Similar cuisine group description should avoid vague compare wording");
      passed = false;
    }

    if (
      /local hubs|category hubs|feature-led searches|cuisine signals/i.test(
        [localAreaGroup.description, cuisineGroup.description, featuresGroup.description].join(" ")
      )
    ) {
      console.error("Contextual bridge descriptions should avoid generic internal SEO wording");
      passed = false;
    }
  }

  const allHrefs = groups.flatMap((group) => group.links.map((link) => link.href));
  const invalidOldAreaCategory = allHrefs.find((href) => /^\/areas\/[^/]+\/[^/]+$/.test(href));
  if (invalidOldAreaCategory) {
    console.error(`Found old area/category route shape: ${invalidOldAreaCategory}`);
    passed = false;
  }

  const areaCategoryHref = allHrefs.find((href) => href.includes("/areas/") && href.includes("/categories/"));
  if (!areaCategoryHref) {
    console.error("Expected at least one current area/category route shape");
    passed = false;
  }

  if (passed) {
    console.log("contextual bridges logic tests passed");
  } else {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
