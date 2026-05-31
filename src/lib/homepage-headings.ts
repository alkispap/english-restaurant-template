import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";

export type HomepageHeadingSiteConfig = {
  niche: string;
  cityOrRegion: string;
};

export type HomepageHeadingDirectoryConfig = {
  listingLabel: string;
  listingPluralLabel: string;
  categoryLabel: string;
  categoryPluralLabel: string;
};

export type HomepageHeadings = {
  heroTitle: string;
  heroDescription: string;
  seoLinksTitle: string;
  seoLinksDescription: string;
  resultsHeadingContext: string;
  sourceContextTitle: string;
  sourceContextQuestionTitles: {
    data: string;
    freshness: string;
    choose: string;
  };
  sidebarTitles: {
    popularSearches: string;
    recentListings: string;
    usefulShortcuts: string;
  };
  listingRowTitles: {
    highlyReviewed: string;
    budgetFriendly: string;
  };
  listingRowCopy: {
    highlyReviewed: string;
    budgetFriendly: string;
  };
  seoFeatureGroupTitles: {
    area: string;
    category: string;
    areaCategory: string;
    service: string;
    dietary: string;
    diningStyle: string;
  };
  seoFeatureGroupCopy: {
    area: string;
    category: string;
    areaCategory: string;
    service: string;
    dietary: string;
    diningStyle: string;
  };
};

export function buildHomepageHeadings(
  site: HomepageHeadingSiteConfig,
  directory: HomepageHeadingDirectoryConfig
): HomepageHeadings {
  const niche = titleCase(site.niche);
  const city = site.cityOrRegion;
  const listingLabel = titleCase(directory.listingLabel);
  const listingLabelLower = directory.listingLabel.toLowerCase();
  const listingPluralLabel = titleCase(directory.listingPluralLabel);
  const listingPluralLabelLower = directory.listingPluralLabel.toLowerCase();
  const categoryLabel = titleCase(directory.categoryLabel);
  const categoryPluralLabel = titleCase(directory.categoryPluralLabel);

  return {
    heroTitle: niche,
    heroDescription: `Compare ${site.niche} with ratings, review counts, areas, ${directory.categoryLabel.toLowerCase()} tags, service options, transport links, and dining details from the current directory.`,
    seoLinksTitle: `Find ${niche} by Area, ${categoryPluralLabel}, and Need`,
    seoLinksDescription: `Use these shortcuts for common ${city} ${listingLabelLower} searches with dedicated pages, filters, summaries, and related listings.`,
    resultsHeadingContext: niche,
    sourceContextTitle: `How This ${listingLabel} Directory Works`,
    sourceContextQuestionTitles: {
      data: "What data does this directory cover?",
      freshness: "How are listing details kept fresh?",
      choose: `How should visitors choose a ${listingLabelLower}?`
    },
    sidebarTitles: {
      popularSearches: `Best ${listingLabel} Searches`,
      recentListings: `Recently Added ${listingPluralLabel}`,
      usefulShortcuts: `Useful ${listingLabel} Filters`
    },
    listingRowTitles: {
      highlyReviewed: `Highly Reviewed ${niche}`,
      budgetFriendly: `Budget-Friendly ${niche}`
    },
    listingRowCopy: {
      highlyReviewed: `${niche} with strong review volume from the current directory.`,
      budgetFriendly: `Lower-priced ${niche} options from the current directory.`
    },
    seoFeatureGroupTitles: {
      area: `${niche} by ${city} Area`,
      category: `${categoryLabel} Types in ${city}`,
      areaCategory: `Strong ${listingLabel} Area Pages`,
      service: `${niche} by Service`,
      dietary: `${niche} by Dietary Need`,
      diningStyle: `${niche} by Dining Style`
    },
    seoFeatureGroupCopy: {
      area: `Start from strong ${city} area hubs with enough ${listingPluralLabelLower} coverage.`,
      category: `Browse clean ${categoryLabel.toLowerCase()} pages before narrowing by neighbourhood or service.`,
      areaCategory: `Use focused local ${listingLabelLower} pages where the result set is strong enough.`,
      service: `Jump straight to practical ${listingLabelLower} needs with clean, indexable pages.`,
      dietary: `Find ${listingPluralLabelLower} with dietary details that matter before choosing a place.`,
      diningStyle: `Use ${listingLabelLower}-type pages when the kind of visit matters.`
    }
  };
}

export const homepageHeadings = buildHomepageHeadings(siteConfig, directoryConfig);

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
