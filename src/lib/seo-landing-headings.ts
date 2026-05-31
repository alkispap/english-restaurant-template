import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";

export type SeoLandingHeadingSiteConfig = {
  niche: string;
  cityOrRegion: string;
};

export type SeoLandingHeadingDirectoryConfig = {
  listingLabel: string;
  listingPluralLabel: string;
  categoryLabel: string;
  categoryPluralLabel: string;
};

type LandingRelatedTitles = {
  areaLinksTitle: string;
  categoryLinksTitle: string;
  usefulSearchesTitle: string;
  areaCategoryLinksTitle: string;
};

type LandingPageHeadingSet = {
  eyebrow: string;
  heroTitle: string;
  guideTitle: string;
  guideBody: string;
  related: LandingRelatedTitles;
  faq: {
    chooseQuestion: string;
    filterQuestion: string;
    exploreQuestion: string;
  };
};

export function buildSeoLandingHeadings(
  site: SeoLandingHeadingSiteConfig,
  directory: SeoLandingHeadingDirectoryConfig
) {
  const city = site.cityOrRegion;
  const niche = titleCase(site.niche);
  const listingLabel = titleCase(directory.listingLabel);
  const listingLabelLower = directory.listingLabel.toLowerCase();
  const listingPluralLabel = titleCase(directory.listingPluralLabel);
  const listingPluralLabelLower = directory.listingPluralLabel.toLowerCase();
  const categoryLabel = titleCase(directory.categoryLabel);
  const categoryPluralLabel = titleCase(directory.categoryPluralLabel);
  const categoryLabelLower = directory.categoryLabel.toLowerCase();

  const sharedRelated = {
    areaLinksTitle: `Compare ${niche} by Area`,
    categoryLinksTitle: `Related ${categoryLabel} Pages`,
    usefulSearchesTitle: `Useful ${listingLabel} Searches in ${city}`,
    areaCategoryLinksTitle: `Useful ${categoryLabel} and Area Combinations`
  };

  return {
    area(areaLabel: string): LandingPageHeadingSet {
      return {
        eyebrow: `${areaLabel} ${listingLabel} Guide`,
        heroTitle: `${listingPluralLabel} in ${areaLabel}`,
        guideTitle: `Compare ${listingPluralLabel} in ${areaLabel}`,
        guideBody: `${areaLabel} ${listingPluralLabelLower} can be compared by ${categoryLabelLower}, review strength, budget, and practical details such as takeaway, delivery, and opening hours. The local results connect broad area research with detailed ${listingLabelLower} pages.`,
        related: {
          ...sharedRelated,
          areaLinksTitle: `More ${city} ${listingLabel} Areas`,
          areaCategoryLinksTitle: `Popular ${categoryPluralLabel} in ${areaLabel}`
        },
        faq: {
          chooseQuestion: `How do I choose a ${listingLabelLower} in ${areaLabel}?`,
          filterQuestion: `Can I filter ${areaLabel} ${listingPluralLabelLower} by dietary needs?`,
          exploreQuestion: `Are the ${areaLabel} results linked to ${listingLabelLower} profiles?`
        }
      };
    },
    neighborhood(neighborhoodLabel: string): LandingPageHeadingSet {
      return {
        eyebrow: `${neighborhoodLabel} ${listingLabel} Guide`,
        heroTitle: `${listingPluralLabel} in ${neighborhoodLabel}`,
        guideTitle: `Compare ${listingPluralLabel} in ${neighborhoodLabel}`,
        guideBody: `${neighborhoodLabel} pages are designed for local intent: compare nearby ${listingPluralLabelLower}, scan ratings and review volume, then use filters for dietary needs, takeaway, delivery, price, and opening status.`,
        related: {
          ...sharedRelated,
          areaLinksTitle: `Related ${city} ${listingLabel} Areas`
        },
        faq: {
          chooseQuestion: `What is the fastest way to compare ${listingPluralLabelLower} in ${neighborhoodLabel}?`,
          filterQuestion: `Can I find ${listingPluralLabelLower} open now in ${neighborhoodLabel}?`,
          exploreQuestion: `Can I browse nearby ${listingLabelLower} areas from this page?`
        }
      };
    },
    category(category: string): LandingPageHeadingSet {
      return {
        eyebrow: `${category} ${listingLabel} Guide`,
        heroTitle: `${category} ${listingPluralLabel} in ${city}`,
        guideTitle: `How to Compare ${category} ${listingPluralLabel}`,
        guideBody: `Start with the highest-rated matches, then refine by area, price, opening status, and service options. The area links below help you move from a broad ${categoryLabelLower} search into local pages with matching ${listingPluralLabelLower}.`,
        related: {
          ...sharedRelated,
          areaCategoryLinksTitle: `Popular Areas for ${category} ${listingPluralLabel}`,
          categoryLinksTitle: `Related ${categoryLabel} Pages`
        },
        faq: {
          chooseQuestion: `What makes a ${category.toLowerCase()} ${listingLabelLower} stand out?`,
          filterQuestion: `Can I find ${category.toLowerCase()} ${listingPluralLabelLower} by area?`,
          exploreQuestion: `Can I sort ${category.toLowerCase()} ${listingPluralLabelLower} by rating or reviews?`
        }
      };
    },
    areaCategory(areaLabel: string, category: string): LandingPageHeadingSet {
      return {
        eyebrow: `${areaLabel} ${category} ${listingLabel} Guide`,
        heroTitle: `${category} ${listingPluralLabel} in ${areaLabel}`,
        guideTitle: `Compare ${category} ${listingPluralLabel} in ${areaLabel}`,
        guideBody: `This page narrows the directory to one area and one ${categoryLabelLower} or category. Use it when you already know the part of ${city} you want and need a faster way to compare ${listingLabelLower} quality, review strength, and practical details.`,
        related: {
          ...sharedRelated,
          areaLinksTitle: `More ${category} Areas`,
          categoryLinksTitle: `More ${categoryPluralLabel} in ${areaLabel}`
        },
        faq: {
          chooseQuestion: `How many ${category.toLowerCase()} ${listingPluralLabelLower} are listed in ${areaLabel}?`,
          filterQuestion: `Can I compare ${category.toLowerCase()} ${listingPluralLabelLower} in nearby areas?`,
          exploreQuestion: `Can I filter this ${category.toLowerCase()} ${listingLabelLower} page further?`
        }
      };
    },
    best(searchTitle: string): LandingPageHeadingSet {
      return {
        eyebrow: `Best ${listingLabel} Search`,
        heroTitle: searchTitle,
        guideTitle: `How This ${listingLabel} Shortlist Is Assembled`,
        guideBody: `This shortlist starts with a specific search intent and ranks matching ${listingPluralLabelLower} by available rating, review, price, service, and category details. Filters narrow the list further by area, dietary needs, service options, price, and opening status.`,
        related: {
          ...sharedRelated,
          areaCategoryLinksTitle: `Useful ${categoryLabel} and Area Combinations`
        },
        faq: {
          chooseQuestion: `How are results selected for ${searchTitle}?`,
          filterQuestion: `Can I narrow this ${listingLabelLower} shortlist by area?`,
          exploreQuestion: `Can I switch this ${listingLabelLower} page to map view?`
        }
      };
    },
    facet(facetLabel: string): LandingPageHeadingSet {
      return {
        eyebrow: `${facetLabel} ${listingLabel} Guide`,
        heroTitle: `${facetLabel} ${listingPluralLabel} in ${city}`,
        guideTitle: `When ${facetLabel} Matters`,
        guideBody: `This feature-led list focuses on ${listingPluralLabelLower} where ${facetLabel.toLowerCase()} is available. Results can still be refined by location, ${categoryLabelLower}, price, rating, opening status, and other practical filters.`,
        related: sharedRelated,
        faq: {
          chooseQuestion: `What does ${facetLabel.toLowerCase()} mean on this ${listingLabelLower} directory?`,
          filterQuestion: `Can I combine ${facetLabel.toLowerCase()} with other ${listingLabelLower} filters?`,
          exploreQuestion: `Are all ${facetLabel.toLowerCase()} details verified by the ${listingLabelLower}?`
        }
      };
    },
    sectionTitles: {
      informationGain: `${listingLabel} Decision Signals`,
      faqs: `${listingLabel} Questions People Ask`
    }
  };
}

export const seoLandingHeadings = buildSeoLandingHeadings(siteConfig, directoryConfig);

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
