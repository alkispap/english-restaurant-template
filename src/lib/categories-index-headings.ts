import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";

type CategoriesIndexHeadingConfig = Pick<typeof siteConfig, "cityOrRegion" | "niche"> & {
  categoryLabel: string;
};

function toTitleCase(value: string) {
  return value
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bIn\b/g, "in");
}

function stripCityQualifier(niche: string, cityOrRegion: string) {
  return niche.replace(new RegExp(`\\s+in\\s+${cityOrRegion}$`, "i"), "");
}

function toSingularRestaurantPhrase(value: string) {
  return value.replace(/\bRestaurants\b/i, "Restaurant");
}

export function buildCategoriesIndexHeadings(
  config: CategoriesIndexHeadingConfig = {
    cityOrRegion: siteConfig.cityOrRegion,
    niche: siteConfig.niche,
    categoryLabel: directoryConfig.categoryLabel
  }
) {
  const localPluralNiche = toTitleCase(stripCityQualifier(config.niche, config.cityOrRegion));
  const localSingularNiche = toSingularRestaurantPhrase(localPluralNiche);

  return {
    heroTitle: `${toTitleCase(config.niche)} by ${config.categoryLabel}`,
    directoryTitle: `Browse ${localPluralNiche} by ${config.categoryLabel}`,
    popularSearchesTitle: `Popular ${localSingularNiche} Searches in ${config.cityOrRegion}`
  };
}

export const categoriesIndexHeadings = buildCategoriesIndexHeadings();
