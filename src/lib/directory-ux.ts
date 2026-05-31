import { directoryConfig } from "@/config/directory";
import { listings } from "@/data/listings";
import type { Listing } from "@/data/listings";
import { directorySemanticMap } from "@/lib/directory-semantic-map";
import { homepageHeadings } from "@/lib/homepage-headings";
import {
  getBestRatedListings,
  getFeaturedAreas,
  getFeaturedCategoryCards,
  filterListings,
  getListingTypes,
  getLowestPricedListings,
  getServiceOptions,
  slugify
} from "@/lib/directory";
import { getPopularSearches, resolveDirectoryTemplate } from "@/lib/directory-growth";
import { getEnabledHomeSections, getEnabledSidebarBlocks, isDirectoryFeatureEnabled } from "@/lib/directory-features";
import {
  areaCategoryPath,
  categoryPath,
  dietaryPath,
  directoryIndexPath,
  listingDetailPath,
  neighborhoodPath,
  servicePath,
  typePath
} from "@/lib/routes";
import { SEO_POLICY } from "@/lib/seo-policy";

export type DirectoryShortcutSource =
  | "localEats"
  | "budgetFriendly"
  | "highlyRated"
  | "popularSearches"
  | "userNeeds"
  | "openNow"
  | "recentListings"
  | "topAreas"
  | "topCategories"
  | "topNeighborhoods"
  | "transport"
  | "listingTypes"
  | "seoFeatures"
  | "usefulShortcuts";

export type DirectoryHomeSection = {
  id: string;
  title: string;
  copy?: string;
  source: DirectoryShortcutSource;
  display?: "linkGrid" | "listingRow";
  enabled?: boolean;
  limit?: number;
  seeAllHref?: string;
};

export type DirectorySidebarBlock = {
  id: string;
  title: string;
  source: DirectoryShortcutSource;
  enabled?: boolean;
  limit?: number;
};

export type DirectoryShortcutLink = {
  label: string;
  href: string;
  description?: string;
  count?: number;
};

export type HomepageSourceContextPoint = {
  title: string;
  copy: string;
};

export type HomepageSourceContextGuide = {
  title: string;
  intro: string;
  points: HomepageSourceContextPoint[];
};

export type ResolvedDirectoryHomeSection = DirectoryHomeSection & {
  links: DirectoryShortcutLink[];
};

export type DirectoryListingRow = {
  id: string;
  title: string;
  copy?: string;
  listings: Listing[];
  seeAllHref: string;
};

export type ResolvedDirectorySidebarBlock = DirectorySidebarBlock & {
  links: DirectoryShortcutLink[];
};

const configHomeSections = directoryConfig.homeSections satisfies readonly DirectoryHomeSection[];
const configSidebarBlocks = directoryConfig.sidebarBlocks satisfies readonly DirectorySidebarBlock[];
const homepageSidebarDuplicateSources = new Set<DirectoryShortcutSource>(["topAreas", "topCategories", "seoFeatures"]);

export function getDirectoryHomeSections(
  sections: readonly DirectoryHomeSection[] = configHomeSections
): ResolvedDirectoryHomeSection[] {
  return sections
    .filter((section) => getEnabledHomeSections([section]).length > 0)
    .filter((section) => section.enabled !== false && (section.display ?? "linkGrid") === "linkGrid")
    .map((section) => ({
      ...section,
      title: resolveDirectoryTemplate(section.title),
      copy: section.copy ? resolveDirectoryTemplate(section.copy) : undefined,
      links: getShortcutLinksForSource(section.source, section.limit)
    }))
    .filter((section) => section.links.length);
}

export function getDirectoryHomeListingRows(
  sections: readonly DirectoryHomeSection[] = configHomeSections
): DirectoryListingRow[] {
  return sections
    .filter((section) => getEnabledHomeSections([section]).length > 0)
    .filter((section) => section.enabled !== false && section.display === "listingRow")
    .map((section) => ({
      id: section.id,
      title: resolveDirectoryTemplate(section.title),
      copy: section.copy ? resolveDirectoryTemplate(section.copy) : undefined,
      listings: getListingsForRowSource(section.source, section.limit),
      seeAllHref: section.seeAllHref ?? defaultSeeAllHref(section.source)
    }))
    .filter((section) => section.listings.length);
}

export function getDirectoryListingsPageRows(currentListings: Listing[], limit = 6): DirectoryListingRow[] {
  const currentSlugs = new Set(currentListings.map((listing) => listing.slug));
  const rowConfigs: DirectoryHomeSection[] = [
    {
      id: "local-eats",
      title: homepageHeadings.listingRowTitles.highlyReviewed,
      copy: homepageHeadings.listingRowCopy.highlyReviewed,
      source: "localEats",
      display: "listingRow",
      limit,
      seeAllHref: defaultSeeAllHref("localEats")
    },
    {
      id: "budget-friendly",
      title: homepageHeadings.listingRowTitles.budgetFriendly,
      copy: homepageHeadings.listingRowCopy.budgetFriendly,
      source: "budgetFriendly",
      display: "listingRow",
      limit,
      seeAllHref: directoryIndexPath("?sort=price")
    }
  ];

  return rowConfigs
    .map((section) => {
      const sourceListings = getListingsForRowSource(section.source, Math.max(limit * 2, 12));
      const withoutCurrent = sourceListings.filter((listing) => !currentSlugs.has(listing.slug));
      const listingsForRow = (withoutCurrent.length ? withoutCurrent : sourceListings).slice(0, limit);

      return {
        id: section.id,
        title: section.title,
        copy: section.copy,
        listings: listingsForRow,
        seeAllHref: section.seeAllHref ?? defaultSeeAllHref(section.source)
      };
    })
    .filter((section) => section.listings.length);
}

export function getDirectorySidebarBlocks(
  blocks: readonly DirectorySidebarBlock[] = configSidebarBlocks
): ResolvedDirectorySidebarBlock[] {
  return blocks
    .filter((block) => getEnabledSidebarBlocks([block]).length > 0)
    .filter((block) => block.enabled !== false)
    .map((block) => ({
      ...block,
      title: resolveDirectoryTemplate(block.title),
      links: getShortcutLinksForSource(block.source, block.limit)
    }))
    .filter((block) => block.links.length);
}

export function getHomepageSidebarBlocks(
  blocks: readonly DirectorySidebarBlock[] = configSidebarBlocks
): ResolvedDirectorySidebarBlock[] {
  return getDirectorySidebarBlocks(blocks)
    .filter((block) => !homepageSidebarDuplicateSources.has(block.source))
    .map((block) => ({
      ...block,
      title: getHomepageSidebarTitle(block)
    }));
}

function getHomepageSidebarTitle(block: ResolvedDirectorySidebarBlock): string {
  if (block.source === "popularSearches") return homepageHeadings.sidebarTitles.popularSearches;
  if (block.source === "recentListings") return homepageHeadings.sidebarTitles.recentListings;
  if (block.source === "usefulShortcuts") return homepageHeadings.sidebarTitles.usefulShortcuts;
  if (block.source === "topAreas") return `Top ${directorySemanticMap.location} areas`;
  if (block.source === "topCategories") return `Top ${directoryConfig.categoryLabel.toLowerCase()} hubs`;
  if (block.source === "seoFeatures") return `${directoryConfig.listingLabel} needs`;

  return block.title;
}

export function getShortcutLinksForSource(source: DirectoryShortcutSource, limit = 6): DirectoryShortcutLink[] {
  if (source === "popularSearches") {
    if (!isDirectoryFeatureEnabled("popularSearchPages")) return [];
    return getPopularSearches()
      .slice(0, limit)
      .map((search) => ({
        label: search.title,
        href: search.href,
        description: search.description
      }));
  }

  if (source === "recentListings") return getRecentlyAddedShortcutLinks(limit);
  if (source === "topAreas") return getFeaturedAreas(limit).map(cardToAreaLink);
  if (source === "topCategories") return getFeaturedCategoryCards(limit).map(cardToCategoryLink);
  if (source === "topNeighborhoods") return topNeighborhoodLinks(limit);
  if (source === "transport") return isDirectoryFeatureEnabled("transport") ? transportLinks(limit) : [];
  if (source === "listingTypes") return isDirectoryFeatureEnabled("listingTypePages") ? listingTypeLinks(limit) : [];
  if (source === "seoFeatures") return seoFeatureLinks(limit);
  if (source === "userNeeds") return userNeedLinks(limit);

  return usefulShortcutLinks(limit);
}

function getListingsForRowSource(source: DirectoryShortcutSource, limit = 6): Listing[] {
  if (source === "budgetFriendly") return getLowestPricedListings(limit);
  if (source === "highlyRated") return getBestRatedListings(limit);
  if (source === "recentListings") return listings.slice(0, limit);

  return getLocalEatsListings(limit);
}

function getLocalEatsListings(limit: number) {
  return [...listings]
    .filter((listing) => Number(listing.rating ?? 0) >= 4)
    .sort(
      (a, b) =>
        Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0) ||
        Number(b.rating ?? 0) - Number(a.rating ?? 0)
    )
    .slice(0, limit);
}

function defaultSeeAllHref(source: DirectoryShortcutSource) {
  if (source === "budgetFriendly") return directoryIndexPath("?sort=price");
  if (source === "highlyRated") return directoryIndexPath("?sort=rating");
  if (source === "recentListings") return directoryIndexPath();
  return directoryIndexPath("?sort=reviews");
}

export function getRecentlyAddedShortcutLinks(limit = 6): DirectoryShortcutLink[] {
  return listings.slice(0, limit).map((listing) => listingToShortcut(listing));
}

function userNeedLinks(limit: number): DirectoryShortcutLink[] {
  return dedupeLinks([...seoFeatureLinks(limit), ...usefulShortcutLinks(limit)]).slice(0, limit);
}

export function getHomepageSeoFeatureGroups(): { title: string; copy: string; links: DirectoryShortcutLink[] }[] {
  const groups = [
    {
      title: homepageHeadings.seoFeatureGroupTitles.area,
      copy: homepageHeadings.seoFeatureGroupCopy.area,
      links: getFeaturedAreas(6).map(cardToAreaLink)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.category,
      copy: homepageHeadings.seoFeatureGroupCopy.category,
      links: getFeaturedCategoryCards(6).map(cardToCategoryLink)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.areaCategory,
      copy: homepageHeadings.seoFeatureGroupCopy.areaCategory,
      links: areaCategoryLinks(6)
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.service,
      copy: homepageHeadings.seoFeatureGroupCopy.service,
      links: seoServiceLinks()
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.dietary,
      copy: homepageHeadings.seoFeatureGroupCopy.dietary,
      links: seoDietaryLinks()
    },
    {
      title: homepageHeadings.seoFeatureGroupTitles.diningStyle,
      copy: homepageHeadings.seoFeatureGroupCopy.diningStyle,
      links: seoTypeLinks()
    }
  ];

  return groups.filter((group) => group.links.length);
}

export function getHomepageSourceContextGuide(): HomepageSourceContextGuide {
  const categoryLabelLower = directoryConfig.categoryLabel.toLowerCase();

  return {
    title: homepageHeadings.sourceContextTitle,
    intro: `This ${directorySemanticMap.sourceContext} uses the current directory dataset for ${directorySemanticMap.centralEntity}, so visitors can compare practical signals before choosing where to eat.`,
    points: [
      {
        title: homepageHeadings.sourceContextQuestionTitles.data,
        copy: `Listings are grouped by area, neighbourhood, ${categoryLabelLower}, service options, dining style, transport details, and contact actions where those fields are available.`
      },
      {
        title: homepageHeadings.sourceContextQuestionTitles.freshness,
        copy: "The template keeps imported details usable for visitors and supports updated freshness audits for opening hours, status, images, ratings, review counts, service options, and contact details."
      },
      {
        title: homepageHeadings.sourceContextQuestionTitles.choose,
        copy: `Compare ratings, review counts, prices, location signals, and available services, then open the listing page for contact links, maps, menus, and booking or ordering actions.`
      }
    ]
  };
}

function areaCategoryLinks(limit: number): DirectoryShortcutLink[] {
  const counts = new Map<string, { areaLabel: string; areaSlug: string; categoryLabel: string; categorySlug: string; count: number }>();

  listings.forEach((listing) => {
    if (!listing.area) return;

    listing.categories.forEach((category) => {
      const areaSlug = slugify(listing.area as string);
      const categorySlug = slugify(category);
      const key = `${areaSlug}:${categorySlug}`;
      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
        return;
      }

      counts.set(key, {
        areaLabel: listing.area as string,
        areaSlug,
        categoryLabel: category,
        categorySlug,
        count: 1
      });
    });
  });

  return Array.from(counts.values())
    .filter((item) => item.count >= SEO_POLICY.routeThresholds.areaCategory)
    .sort((a, b) => b.count - a.count || a.areaLabel.localeCompare(b.areaLabel))
    .slice(0, limit)
    .map((item) => ({
      label: `${item.categoryLabel} in ${item.areaLabel}`,
      href: areaCategoryPath(item.areaSlug, item.categorySlug),
      count: item.count
    }));
}

function seoFeatureLinks(limit: number): DirectoryShortcutLink[] {
  return dedupeLinks([...seoServiceLinks(), ...seoDietaryLinks(), ...seoTypeLinks()]).slice(0, limit);
}

function seoServiceLinks(): DirectoryShortcutLink[] {
  const listingPluralLabelLower = directoryConfig.listingPluralLabel.toLowerCase();
  const wanted = [
    { slug: "takeaway", label: `Takeaway ${listingPluralLabelLower}` },
    { slug: "delivery", label: `Delivery ${listingPluralLabelLower}` },
    { slug: "dine-in", label: `Dine-in ${listingPluralLabelLower}` },
    { slug: "outdoor-seating", label: "Outdoor seating" }
  ];
  const available = new Set(getServiceOptions().map(slugify));

  return wanted
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: servicePath(item.slug),
      count: filterListings({ service: item.slug }).length
    }));
}

function seoDietaryLinks(): DirectoryShortcutLink[] {
  const listingPluralLabelLower = directoryConfig.listingPluralLabel.toLowerCase();
  const wanted = [
    { slug: "vegetarian", label: `Vegetarian ${listingPluralLabelLower}` },
    { slug: "vegan", label: `Vegan ${listingPluralLabelLower}` },
    { slug: "halal", label: `Halal ${listingPluralLabelLower}` },
    { slug: "gluten-free", label: "Gluten-free options" }
  ];
  const available = new Set(listings.flatMap((listing) => listing.dietaryOptions).map(slugify));

  return wanted
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: dietaryPath(item.slug),
      count: filterListings({ dietary: item.slug }).length
    }));
}

function seoTypeLinks(): DirectoryShortcutLink[] {
  const listingPluralLabelLower = directoryConfig.listingPluralLabel.toLowerCase();
  const wanted = [
    { slug: "casual-dining", label: "Casual dining" },
    { slug: "fine-dining", label: "Fine dining" },
    { slug: "cafe", label: `Cafe-style ${listingPluralLabelLower}` },
    { slug: "bar", label: `Bar ${listingPluralLabelLower}` }
  ];
  const available = new Set(getListingTypes().map(slugify));

  return wanted
    .filter((item) => available.has(item.slug))
    .map((item) => ({
      label: item.label,
      href: typePath(item.slug),
      count: filterListings({ type: item.slug }).length
    }));
}

function usefulShortcutLinks(limit: number): DirectoryShortcutLink[] {
  return [
    { label: "Open now", href: directoryIndexPath("?open=1") },
    { label: "Best rated", href: directoryIndexPath("?sort=rating") },
    { label: "Most reviewed", href: directoryIndexPath("?sort=reviews") },
    { label: "Lowest price", href: directoryIndexPath("?sort=price") }
  ].slice(0, limit);
}

function transportLinks(limit: number): DirectoryShortcutLink[] {
  const tubeStations = topValues(
    listings.map((listing) => listing.location?.tubeStation).filter(isString)
  ).map((item) => ({
    label: `Near ${item.label}`,
    href: directoryIndexPath(`?tube=${slugify(item.label)}`),
    count: item.count
  }));

  const busStops = topValues(
    listings.map((listing) => listing.location?.busStop).filter(isString)
  ).map((item) => ({
    label: `Near ${item.label}`,
    href: directoryIndexPath(`?bus=${slugify(item.label)}`),
    count: item.count
  }));

  return dedupeLinks([...tubeStations, ...busStops]).slice(0, limit);
}

function listingTypeLinks(limit: number): DirectoryShortcutLink[] {
  return getListingTypes()
    .slice(0, limit)
    .map((type) => ({
      label: type,
      href: typePath(slugify(type))
    }));
}

function topNeighborhoodLinks(limit: number): DirectoryShortcutLink[] {
  return topValues(listings.map((listing) => listing.neighborhood).filter(isString))
    .slice(0, limit)
    .map((item) => ({
      label: item.label,
      href: neighborhoodPath(slugify(item.label)),
      count: item.count
    }));
}

function cardToAreaLink(card: { label: string; slug: string; count: number; description?: string }) {
  return {
    label: card.label,
    href: `/areas/${card.slug}`,
    count: card.count,
    description: card.description
  };
}

function cardToCategoryLink(card: { label: string; slug: string; count: number; description?: string }) {
  return {
    label: card.label,
    href: categoryPath(card.slug),
    count: card.count,
    description: card.description
  };
}

function listingToShortcut(listing: Listing) {
  return {
    label: listing.name,
    href: listingDetailPath(listing.slug),
    description: [listing.neighborhood, listing.area].filter(Boolean).join(", ") || undefined
  };
}

function topValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function dedupeLinks(links: DirectoryShortcutLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}
