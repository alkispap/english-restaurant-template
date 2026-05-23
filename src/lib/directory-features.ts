import { directoryConfig } from "@/config/directory";
import type {
  DirectoryFeatureFlags,
  DirectoryFooterGroupConfig,
  DirectoryHomeSectionConfig,
  DirectorySidebarBlockConfig
} from "@/config/directory-presets";

export function isDirectoryFeatureEnabled(
  feature: keyof DirectoryFeatureFlags,
  features: DirectoryFeatureFlags = directoryConfig.features
) {
  return features[feature] !== false;
}

export function getEnabledHomeSections<T extends DirectoryHomeSectionConfig>(
  sections: readonly T[],
  features: DirectoryFeatureFlags = directoryConfig.features
) {
  if (!isDirectoryFeatureEnabled("homepageSections", features)) return [];

  return sections.filter((section) => sourceIsEnabled(section.source, features));
}

export function getEnabledSidebarBlocks<T extends DirectorySidebarBlockConfig>(
  blocks: readonly T[],
  features: DirectoryFeatureFlags = directoryConfig.features
) {
  if (!isDirectoryFeatureEnabled("sidebarBlocks", features)) return [];

  return blocks.filter((block) => sourceIsEnabled(block.source, features));
}

export function getEnabledFooterGroups<T extends DirectoryFooterGroupConfig>(
  groups: readonly T[],
  features: DirectoryFeatureFlags = directoryConfig.features
) {
  return groups.filter((group) => {
    if (group.source === "popularSearches") return isDirectoryFeatureEnabled("popularSearchPages", features);
    return true;
  });
}

export function getEnabledSitemapRouteKinds(features: DirectoryFeatureFlags = directoryConfig.features) {
  return {
    types: isDirectoryFeatureEnabled("listingTypePages", features),
    dietary: isDirectoryFeatureEnabled("dietaryPages", features),
    services: isDirectoryFeatureEnabled("servicePages", features),
    offerings: isDirectoryFeatureEnabled("offeringPages", features),
    popularSearches: isDirectoryFeatureEnabled("popularSearchPages", features),
    areaCategories: isDirectoryFeatureEnabled("areaCategoryPages", features)
  };
}

function sourceIsEnabled(source: DirectoryHomeSectionConfig["source"], features: DirectoryFeatureFlags) {
  if (source === "popularSearches") return isDirectoryFeatureEnabled("popularSearchPages", features);
  if (source === "transport") return isDirectoryFeatureEnabled("transport", features);
  if (source === "listingTypes") return isDirectoryFeatureEnabled("listingTypePages", features);
  if (source === "seoFeatures") return true;
  return true;
}
