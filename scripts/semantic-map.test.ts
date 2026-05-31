import { directorySemanticMap, getPageBrief } from "../src/lib/directory-semantic-map";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// --- Task 1A: Core Identity & Copy Safety ---

// Central entity must be a non-empty string drawn from siteConfig
assert(typeof directorySemanticMap.centralEntity === "string" && directorySemanticMap.centralEntity.length > 0, "centralEntity should be a non-empty string");

// Source context must identify the site as a comparison directory
assert(directorySemanticMap.sourceContext === "local business comparison directory", "sourceContext should identify the site as a local business comparison directory");

// Location must be a non-empty string drawn from siteConfig
assert(typeof directorySemanticMap.location === "string" && directorySemanticMap.location.length > 0, "location should be a non-empty string");

// Required identity phrases must include the niche and the city+niche combination
assert(Array.isArray(directorySemanticMap.requiredIdentityPhrases), "requiredIdentityPhrases should be an array");
assert(directorySemanticMap.requiredIdentityPhrases.length >= 2, "requiredIdentityPhrases should have at least 2 entries");
assert(
  directorySemanticMap.requiredIdentityPhrases.some((phrase) => phrase.toLowerCase().includes("london")),
  "requiredIdentityPhrases should include a phrase containing the city"
);
assert(
  directorySemanticMap.requiredIdentityPhrases.some((phrase) => phrase.toLowerCase().includes("indian")),
  "requiredIdentityPhrases should include a phrase containing the niche"
);

// Copy safety: blockedStaleTerms must exist and include niche-specific terms
assert(Array.isArray(directorySemanticMap.copySafety.blockedStaleTerms), "copySafety.blockedStaleTerms should be an array");
assert(directorySemanticMap.copySafety.blockedStaleTerms.length > 0, "copySafety.blockedStaleTerms should not be empty");
assert(
  directorySemanticMap.copySafety.blockedStaleTerms.includes("indian"),
  "copySafety.blockedStaleTerms should include 'indian' to warn when copying this template to a non-Indian niche"
);

// Copy safety: requiredIdentityFields must list all critical config keys
assert(Array.isArray(directorySemanticMap.copySafety.requiredIdentityFields), "copySafety.requiredIdentityFields should be an array");
assert(
  directorySemanticMap.copySafety.requiredIdentityFields.includes("siteName"),
  "copySafety.requiredIdentityFields should include siteName"
);
assert(
  directorySemanticMap.copySafety.requiredIdentityFields.includes("niche"),
  "copySafety.requiredIdentityFields should include niche"
);
assert(
  directorySemanticMap.copySafety.requiredIdentityFields.includes("cityOrRegion"),
  "copySafety.requiredIdentityFields should include cityOrRegion"
);

console.log("semantic-map Task 1A: all core identity and copy safety checks passed ✓");

// --- Task 1B: Page Briefs ---

// pageBriefs array must exist and cover all core page types
assert(Array.isArray(directorySemanticMap.pageBriefs), "pageBriefs should be an array");
assert(directorySemanticMap.pageBriefs.length >= 5, "pageBriefs should cover at least 5 page types");

// Every brief must have required fields
for (const brief of directorySemanticMap.pageBriefs) {
  assert(brief.pageType.length > 0, `brief pageType should not be empty`);
  assert(brief.primaryEntity.length > 0, `brief for '${brief.pageType}' should have a primaryEntity`);
  assert(brief.macroContext.length > 0, `brief for '${brief.pageType}' should have a macroContext`);
  assert(brief.networkRole === "core" || brief.networkRole === "supporting", `brief for '${brief.pageType}' networkRole should be 'core' or 'supporting'`);
  assert(brief.searchIntent.length > 0, `brief for '${brief.pageType}' should have a searchIntent`);
  assert(Array.isArray(brief.requiredEavGroups) && brief.requiredEavGroups.length > 0, `brief for '${brief.pageType}' should have at least one requiredEavGroup`);
  assert(Array.isArray(brief.allowedLinkTargets) && brief.allowedLinkTargets.length > 0, `brief for '${brief.pageType}' should have at least one allowedLinkTarget`);
  assert(
    ["canonical_target", "quality_gated", "supporting_noindex_when_weak"].includes(brief.indexationRole),
    `brief for '${brief.pageType}' indexationRole should be a valid value`
  );
}

// Specific spot checks for key page types

// Homepage: must be a canonical target that links to hubs
const homepageBrief = getPageBrief("homepage");
assert(homepageBrief.macroContext === "citywide directory comparison", "homepage macroContext should be 'citywide directory comparison'");
assert(homepageBrief.networkRole === "core", "homepage should be a core page");
assert(homepageBrief.indexationRole === "canonical_target", "homepage should always be a canonical index target");
assert(homepageBrief.allowedLinkTargets.includes("area_hub"), "homepage should be allowed to link to area hubs");
assert(homepageBrief.allowedLinkTargets.includes("category_hub"), "homepage should be allowed to link to category hubs");
assert(homepageBrief.requiredEavGroups.includes("identity"), "homepage should require the identity EAV group");

// Listing detail: must be quality-gated, have contact actions and location
const listingBrief = getPageBrief("listing_detail");
assert(listingBrief.primaryEntity === "local business listing", "listing_detail primaryEntity should be 'local business listing'");
assert(listingBrief.macroContext === "single business evaluation", "listing_detail macroContext should be 'single business evaluation'");
assert(listingBrief.networkRole === "core", "listing_detail should be a core page");
assert(listingBrief.indexationRole === "quality_gated", "listing_detail should be quality-gated (not all listings qualify for indexing)");
assert(listingBrief.requiredEavGroups.includes("location"), "listing_detail should require location EAV");
assert(listingBrief.requiredEavGroups.includes("contactActions"), "listing_detail should require contactActions EAV");
assert(listingBrief.allowedLinkTargets.includes("area_hub"), "listing_detail should be allowed to link back to area hubs");

// Area hub: must link down to listings and area+category combos
const areaHubBrief = getPageBrief("area_hub");
assert(areaHubBrief.macroContext === "local area comparison", "area_hub macroContext should be 'local area comparison'");
assert(areaHubBrief.allowedLinkTargets.includes("listing_detail"), "area_hub should link down to listing detail pages");
assert(areaHubBrief.allowedLinkTargets.includes("area_category_hub"), "area_hub should link to area+category combo pages");
assert(areaHubBrief.indexationRole === "supporting_noindex_when_weak", "area_hub should be noindexed when it has too few listings");

// Category hub: must link to area+category combos and listings
const categoryHubBrief = getPageBrief("category_hub");
assert(categoryHubBrief.macroContext === "category comparison across the city", "category_hub macroContext should be 'category comparison across the city'");
assert(categoryHubBrief.allowedLinkTargets.includes("area_category_hub"), "category_hub should link to area+category combos");
assert(categoryHubBrief.allowedLinkTargets.includes("listing_detail"), "category_hub should link to listing detail pages");

// getPageBrief must throw for unknown page types
let threwForUnknown = false;
try {
  // @ts-expect-error — intentionally testing unknown type
  getPageBrief("unknown_page_type");
} catch {
  threwForUnknown = true;
}
assert(threwForUnknown, "getPageBrief should throw for unknown page types");

console.log("semantic-map Task 1B: all page brief checks passed ✓");
