import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { isDirectoryFeatureEnabled, getEnabledFooterGroups } from "@/lib/directory-features";
import { listings, type Listing } from "@/data/listings";
import {
  filterListings,
  getFeaturedAreas,
  getFeaturedCategoryCards,
  slugify,
  type ListingFilters,
  type SortKey
} from "@/lib/directory";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  directoryIndexPath,
  dietaryPath,
  neighborhoodPath,
  offeringPath,
  popularSearchPath,
  servicePath,
  typePath
} from "@/lib/routes";

export type PopularSearchPreset = {
  slug: string;
  title: string;
  description: string;
  filters: ListingFilters;
  sort?: SortKey;
};

export type PopularSearch = PopularSearchPreset & {
  href: string;
};

export type DirectoryLink = {
  label: string;
  href: string;
};

export type FooterGroup = {
  title: string;
  links: DirectoryLink[];
};

export type AreaCategoryCombination = {
  areaLabel: string;
  areaSlug: string;
  categoryLabel: string;
  categorySlug: string;
  count: number;
  href: string;
};

type FooterSource = "popularSearches" | "topAreas" | "topCategories";

type ConfigFooterGroup = {
  title: string;
  links?: readonly DirectoryLink[];
  source?: FooterSource;
  limit?: number;
};

const configPopularSearches = directoryConfig.popularSearches satisfies readonly {
  slug: string;
  title: string;
  description: string;
  filters: Record<string, unknown>;
  sort?: string;
}[];

export function resolveDirectoryTemplate(value: string) {
  const tokens: Record<string, string> = {
    siteName: siteConfig.siteName,
    cityOrRegion: siteConfig.cityOrRegion,
    listingLabel: directoryConfig.listingLabel,
    listingPluralLabel: directoryConfig.listingPluralLabel,
    listingPluralLabelLower: directoryConfig.listingPluralLabel.toLowerCase(),
    categoryLabel: directoryConfig.categoryLabel,
    categoryPluralLabel: directoryConfig.categoryPluralLabel
  };

  return value.replace(/\{([a-zA-Z]+)\}/g, (match, token: string) => tokens[token] ?? match);
}

export function getPopularSearches(): PopularSearch[] {
  if (!isDirectoryFeatureEnabled("popularSearchPages")) return [];

  return configPopularSearches.map((preset) => ({
    slug: preset.slug,
    title: resolveDirectoryTemplate(preset.title),
    description: resolveDirectoryTemplate(preset.description),
    filters: preset.filters as ListingFilters,
    sort: asSortKey(preset.sort),
    href: popularSearchPath(preset.slug)
  }));
}

export function getPopularSearchBySlug(slug: string) {
  return getPopularSearches().find((search) => search.slug === slug);
}

export function getPopularSearchResults(slug: string, filters: ListingFilters = {}) {
  const search = getPopularSearchBySlug(slug);
  if (!search) return [];

  return filterListings({
    ...search.filters,
    ...filters,
    sort: filters.sort ?? search.sort
  });
}

export function getAreaCategoryCombinations(): AreaCategoryCombination[] {
  if (!isDirectoryFeatureEnabled("areaCategoryPages")) return [];

  const counts = new Map<string, AreaCategoryCombination>();

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
        count: 1,
        href: areaCategoryPath(areaSlug, categorySlug)
      });
    });
  });

  return Array.from(counts.values()).sort(
    (a, b) =>
      b.count - a.count ||
      a.areaLabel.localeCompare(b.areaLabel) ||
      a.categoryLabel.localeCompare(b.categoryLabel)
  );
}

export function getAreaCategoryCombinationsForArea(areaSlug: string, limit = 8) {
  return getAreaCategoryCombinations()
    .filter((combination) => combination.areaSlug === areaSlug)
    .slice(0, limit);
}

export function getAreaCategoryCombinationsForCategory(categorySlug: string, limit = 8) {
  return getAreaCategoryCombinations()
    .filter((combination) => combination.categorySlug === categorySlug)
    .slice(0, limit);
}

export function getAreaCategoryCombination(areaSlug: string, categorySlug: string) {
  return getAreaCategoryCombinations().find(
    (combination) => combination.areaSlug === areaSlug && combination.categorySlug === categorySlug
  );
}

export function getListingsByAreaAndCategory(areaSlug: string, categorySlug: string) {
  return listings.filter(
    (listing) =>
      Boolean(listing.area) &&
      slugify(listing.area as string) === areaSlug &&
      listing.categories.some((category) => slugify(category) === categorySlug)
  );
}

export function getFooterGroups(): FooterGroup[] {
  const configuredGroups =
    "footerGroups" in directoryConfig
      ? (directoryConfig.footerGroups as readonly ConfigFooterGroup[])
      : "footerGroups" in siteConfig
        ? (siteConfig.footerGroups as readonly ConfigFooterGroup[])
        : [];
  const groups = getEnabledFooterGroups(configuredGroups);

  return groups
    .map((group) => {
      const fixedLinks = (group.links ?? []).map((link) => ({
        label: resolveDirectoryTemplate(link.label),
        href: link.href
      }));

      const generatedLinks = group.source ? sourceLinks(group.source, group.limit) : [];

      return {
        title: resolveDirectoryTemplate(group.title),
        links: dedupeLinks([...fixedLinks, ...generatedLinks])
      };
    })
    .filter((group) => group.links.length);
}

export function getRatingFilterOptions() {
  const ratings = listings
    .map((listing) => listing.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));
  if (!ratings.length) return [];

  const maxRating = Math.min(5, Math.ceil(Math.max(...ratings)));
  const minRating = Math.max(1, Math.floor(Math.min(...ratings)));

  return Array.from({ length: maxRating - minRating + 1 }, (_, index) => {
    const rating = maxRating - index;
    return { label: `${rating}+`, value: String(rating) };
  });
}

export function getListingExploreLinks(listing: Listing): DirectoryLink[] {
  const links: DirectoryLink[] = [];
  const listingPlural = directoryConfig.listingPluralLabel.toLowerCase();
  const area = listing.area;
  const areaSlug = area ? slugify(area) : "";

  if (area && areaSlug) {
    links.push({
      label: `More ${listingPlural} in ${area}`,
      href: areaPath(areaSlug)
    });
  }

  if (listing.neighborhood) {
    links.push({
      label: `More ${listingPlural} in ${listing.neighborhood}`,
      href: neighborhoodPath(slugify(listing.neighborhood))
    });
  }

  listing.categories.forEach((category) => {
    const categorySlug = slugify(category);
    links.push({
      label: `${category} ${listingPlural}`,
      href: categoryPath(categorySlug)
    });

    if (isDirectoryFeatureEnabled("areaCategoryPages") && areaSlug && getAreaCategoryCombination(areaSlug, categorySlug)) {
      links.push({
        label: `${category} ${listingPlural} in ${area}`,
        href: areaCategoryPath(areaSlug, categorySlug)
      });
    }
  });

  listing.listingTypes.slice(0, 4).forEach((type) => {
    if (!isDirectoryFeatureEnabled("listingTypePages")) return;
    links.push({
      label: `${type} ${listingPlural}`,
      href: typePath(slugify(type))
    });
  });

  listing.dietaryOptions.slice(0, 3).forEach((dietary) => {
    if (!isDirectoryFeatureEnabled("dietaryPages")) return;
    links.push({
      label: `${dietary} ${listingPlural}`,
      href: dietaryPath(slugify(dietary))
    });
  });

  (listing.details?.serviceOptions ?? []).slice(0, 4).forEach((service) => {
    if (!isDirectoryFeatureEnabled("servicePages")) return;
    links.push({
      label: `${service} ${listingPlural}`,
      href: servicePath(slugify(service))
    });
  });

  (listing.details?.offerings ?? []).slice(0, 6).forEach((offering) => {
    if (!isDirectoryFeatureEnabled("offeringPages")) return;
    links.push({
      label: `${offering} ${listingPlural}`,
      href: offeringPath(slugify(offering))
    });
  });

  if (listing.priceLevel) {
    links.push({
      label: `${listing.priceLevel} ${listingPlural}`,
      href: directoryIndexPath(`?price=${encodeURIComponent(listing.priceLevel)}`)
    });
  }

  return dedupeLinks(links).slice(0, 24);
}

function sourceLinks(source: FooterSource, limit = 6): DirectoryLink[] {
  if (source === "popularSearches") {
    return getPopularSearches()
      .slice(0, limit)
      .map(({ title, href }) => ({ label: title, href }));
  }

  if (source === "topAreas") {
    return getFeaturedAreas(limit).map((area) => ({
      label: area.label,
      href: areaPath(area.slug)
    }));
  }

  return getFeaturedCategoryCards(limit).map((category) => ({
    label: category.label,
    href: categoryPath(category.slug)
  }));
}

function dedupeLinks(links: DirectoryLink[]) {
  const seen = new Set<string>();
  const result: DirectoryLink[] = [];

  links.forEach((link) => {
    if (!link.href || seen.has(link.href)) return;
    seen.add(link.href);
    result.push(link);
  });

  return result;
}

function asSortKey(value?: string): SortKey | undefined {
  return value === "featured" || value === "rating" || value === "reviews" || value === "price"
    ? value
    : undefined;
}
