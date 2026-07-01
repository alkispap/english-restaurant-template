import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";

export type DirectoryIndexHeadings = {
  title: string;
  description: string;
  resultsHeadingContext: string;
  sidebarTitles: {
    popularSearches: string;
    recentListings: string;
    usefulShortcuts: string;
    topAreas: string;
    categoryHubs: string;
  };
};

export function buildDirectoryIndexHeadings(
  site: Pick<typeof siteConfig, "niche" | "cityOrRegion">,
  directory: Pick<typeof directoryConfig, "listingLabel" | "listingPluralLabel" | "categoryLabel">
): DirectoryIndexHeadings {
  const niche = titleCase(site.niche);
  const city = site.cityOrRegion;
  const sidebarNiche = removeCitySuffix(niche, city);
  const sidebarSingularNiche = singularRestaurantPhrase(sidebarNiche);
  const categoryLabel = titleCase(directory.categoryLabel);

  return {
    title: `Find ${niche}`,
    description: `Search ${site.niche} by area, ${directory.categoryLabel.toLowerCase()}, rating, service options, dietary needs, transport links, and dining style.`,
    resultsHeadingContext: niche,
    sidebarTitles: {
      popularSearches: `Popular ${sidebarSingularNiche} Searches`,
      recentListings: `Recently Added ${sidebarNiche}`,
      usefulShortcuts: `Filter ${sidebarNiche} by Need`,
      topAreas: `Top ${city} Areas for ${sidebarNiche}`,
      categoryHubs: `${sidebarSingularNiche} ${categoryLabel} Hubs`
    }
  };
}

export const directoryIndexHeadings = buildDirectoryIndexHeadings(siteConfig, directoryConfig);

function titleCase(value: string) {
  const smallWords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to"]);
  return value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function singularRestaurantPhrase(value: string) {
  return value.replace(/\bRestaurants\b/i, "Restaurant");
}

function removeCitySuffix(value: string, city: string) {
  return value.replace(new RegExp(`\\s+in\\s+${escapeRegExp(city)}$`, "i"), "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
