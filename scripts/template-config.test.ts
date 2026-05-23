import assert from "node:assert/strict";
import { directoryConfig } from "../src/config/directory";
import {
  directoryTemplatePresets,
  getDirectoryTemplatePreset,
  mergePresetWithSettings
} from "../src/config/directory-presets";
import { getEnabledFooterGroups, isDirectoryFeatureEnabled } from "../src/lib/directory-features";

function presetsExposeReusableDefaults() {
  assert.ok(directoryTemplatePresets.genericLocalBusiness, "expected a generic local business preset");
  assert.ok(directoryTemplatePresets.restaurant, "expected a restaurant preset");
  assert.ok(directoryTemplatePresets.cafe, "expected a cafe preset");

  const generic = getDirectoryTemplatePreset("genericLocalBusiness");
  const restaurant = getDirectoryTemplatePreset("restaurant");

  assert.equal(generic.listingLabel, "Business");
  assert.equal(generic.filterLabels.type, "Business type");
  assert.equal(generic.actionLabels.reserve, "Book online");
  assert.equal(restaurant.listingLabel, "Restaurant");
  assert.equal(restaurant.filterLabels.type, "Restaurant type");
  assert.equal(restaurant.actionLabels.reserve, "Reserve a table");
}

function currentConfigUsesRestaurantPresetBehavior() {
  assert.equal(directoryConfig.templatePreset, "restaurant");
  assert.equal(directoryConfig.listingLabel, "Restaurant");
  assert.equal(directoryConfig.filterLabels.type, "Restaurant type");
  assert.equal(directoryConfig.filterLabels.advanced, "More restaurant filters");
  assert.equal(directoryConfig.actionLabels.reserve, "Reserve a table");
  assert.equal(isDirectoryFeatureEnabled("popularSearchPages"), true);
  assert.equal(isDirectoryFeatureEnabled("areaCategoryPages"), true);
}

function presetsCanBeMergedWithSettings() {
  const merged = mergePresetWithSettings("genericLocalBusiness", {
    listingLabel: "Clinic",
    listingPluralLabel: "Clinics",
    categoryLabel: "Specialty",
    categoryPluralLabel: "Specialties",
    features: { shortlist: false, transport: false }
  });

  assert.equal(merged.listingLabel, "Clinic");
  assert.equal(merged.listingPluralLabel, "Clinics");
  assert.equal(merged.categoryLabel, "Specialty");
  assert.equal(merged.categoryPluralLabel, "Specialties");
  assert.equal(merged.features.shortlist, false);
  assert.equal(merged.features.transport, false);
  assert.equal(merged.features.popularSearchPages, true);
  assert.equal(merged.filterLabels.type, "Business type");
}

function footerGroupsAreFeatureAware() {
  const groups = getEnabledFooterGroups([
    { title: "Popular", source: "popularSearches", limit: 3 },
    { title: "Areas", source: "topAreas", limit: 3 },
    { title: "Browse", links: [{ label: "All", href: "/" }] }
  ], {
    popularSearchPages: false,
    areaCategoryPages: true,
    shortlist: true,
    homepageSections: true,
    sidebarBlocks: true,
    transport: true,
    listingTypePages: true,
    dietaryPages: true,
    servicePages: true,
    offeringPages: true,
    serviceDetails: true,
    guestInfoDetails: true,
    trustBadges: true
  });

  assert.deepEqual(groups.map((group) => group.title), ["Areas", "Browse"]);
}

presetsExposeReusableDefaults();
currentConfigUsesRestaurantPresetBehavior();
presetsCanBeMergedWithSettings();
footerGroupsAreFeatureAware();

console.log("template config tests passed");
