import { siteConfig } from "@/config/site";

type AreasIndexHeadingConfig = Pick<typeof siteConfig, "cityOrRegion" | "niche">;

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

export function buildAreasIndexHeadings(config: AreasIndexHeadingConfig = siteConfig) {
  const localPluralNiche = toTitleCase(stripCityQualifier(config.niche, config.cityOrRegion));
  const localSingularNiche = toSingularRestaurantPhrase(localPluralNiche);

  return {
    heroTitle: `${toTitleCase(config.niche)} by Area`,
    directoryTitle: `Browse ${localPluralNiche} by ${config.cityOrRegion} Area`,
    popularSearchesTitle: `Popular ${localSingularNiche} Searches in ${config.cityOrRegion}`
  };
}

export const areasIndexHeadings = buildAreasIndexHeadings();
