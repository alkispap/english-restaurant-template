import { directoryConfig } from "@/config/directory";
import { listings } from "@/data/listings";
import type { Listing } from "@/data/listings";
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
  categoryPath,
  dietaryPath,
  directoryIndexPath,
  listingDetailPath,
  neighborhoodPath,
  servicePath,
  typePath
} from "@/lib/routes";

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
      title: "Local eats",
      copy: "More strong all-round listings to explore.",
      source: "localEats",
      display: "listingRow",
      limit,
      seeAllHref: defaultSeeAllHref("localEats")
    },
    {
      id: "budget-friendly",
      title: "Budget-friendly",
      copy: "Lower-priced options from the directory.",
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
      title: "Browse by service",
      copy: "Jump straight to practical restaurant needs with clean, indexable pages.",
      links: seoServiceLinks()
    },
    {
      title: "Browse by dietary need",
      copy: "Find restaurants with dietary details that matter before choosing a place.",
      links: seoDietaryLinks()
    },
    {
      title: "Browse by dining style",
      copy: "Use restaurant-type pages when the kind of visit matters.",
      links: seoTypeLinks()
    }
  ];

  return groups.filter((group) => group.links.length);
}

function seoFeatureLinks(limit: number): DirectoryShortcutLink[] {
  return dedupeLinks([...seoServiceLinks(), ...seoDietaryLinks(), ...seoTypeLinks()]).slice(0, limit);
}

function seoServiceLinks(): DirectoryShortcutLink[] {
  const wanted = [
    { slug: "takeaway", label: "Takeaway restaurants" },
    { slug: "delivery", label: "Delivery restaurants" },
    { slug: "dine-in", label: "Dine-in restaurants" },
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
  const wanted = [
    { slug: "vegetarian", label: "Vegetarian restaurants" },
    { slug: "vegan", label: "Vegan restaurants" },
    { slug: "halal", label: "Halal restaurants" },
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
  const wanted = [
    { slug: "casual-dining", label: "Casual dining" },
    { slug: "fine-dining", label: "Fine dining" },
    { slug: "cafe", label: "Cafe-style restaurants" },
    { slug: "bar", label: "Bar restaurants" }
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
