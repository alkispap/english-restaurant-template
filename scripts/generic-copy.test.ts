import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import {
  directoryTemplatePresets,
  mergePresetWithSettings
} from "../src/config/directory-presets";
import {
  getEnabledSitemapRouteKinds,
  isDirectoryFeatureEnabled
} from "../src/lib/directory-features";

function genericPresetUsesNeutralPublicLabels() {
  const generic = directoryTemplatePresets.genericLocalBusiness;
  const publicCopy = [
    generic.filterLabels.type,
    generic.filterLabels.advanced,
    generic.filterLabels.dining,
    generic.actionLabels.reserve,
    generic.actionLabels.menu,
    generic.detailLabels.servicesTitle,
    generic.detailLabels.dining
  ].join(" ");

  assert.doesNotMatch(publicCopy, /restaurant|dining option|reserve a table|menu/i);
  assert.match(publicCopy, /business|filter|service|book/i);
}

function featureGatesCanDisableGeneratedRoutes() {
  const disabled = mergePresetWithSettings("genericLocalBusiness", {
    features: {
      popularSearchPages: false,
      areaCategoryPages: false,
      listingTypePages: false,
      dietaryPages: false,
      servicePages: false,
      offeringPages: false
    }
  });
  const enabledKinds = getEnabledSitemapRouteKinds(disabled.features);

  assert.equal(isDirectoryFeatureEnabled("popularSearchPages", disabled.features), false);
  assert.equal(enabledKinds.popularSearches, false);
  assert.equal(enabledKinds.areaCategories, false);
  assert.equal(enabledKinds.types, false);
  assert.equal(enabledKinds.dietary, false);
  assert.equal(enabledKinds.services, false);
  assert.equal(enabledKinds.offerings, false);
}

function currentSitemapKeepsEnabledGeneratedRoutes() {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.some((url) => url.includes("/best/")), "current restaurant preset should keep popular search URLs");
  assert.ok(urls.some((url) => url.includes("/areas/") && url.includes("/categories/")), "current restaurant preset should keep combination URLs");
  assert.ok(urls.some((url) => url.includes("/types/")), "current restaurant preset should keep listing type URLs");
}

genericPresetUsesNeutralPublicLabels();
featureGatesCanDisableGeneratedRoutes();
currentSitemapKeepsEnabledGeneratedRoutes();

console.log("generic copy tests passed");
