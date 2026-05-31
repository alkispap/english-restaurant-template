import { directoryConfig } from "@/config/directory";
import { listings } from "@/data/listings";
import { getFeaturedAreas, slugify } from "@/lib/directory";
import { areaCategoryPath, areaPath, neighborhoodPath } from "@/lib/routes";
import type { SearchableDirectoryCard } from "@/lib/searchable-card-filter";

export type AreaGuideModel = {
  areaLabel: string;
  neighborhoods: SearchableDirectoryCard[];
  categories: SearchableDirectoryCard[];
};

export function getAreaDirectoryCards(limit = 100): SearchableDirectoryCard[] {
  return getFeaturedAreas(limit).map((area) => ({
    label: area.label,
    slug: area.slug,
    href: areaPath(area.slug),
    count: area.count,
    description: `Compare ${area.count.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} in ${area.label}.`
  }));
}

export function getAreaGuideModel(areaSlug: string): AreaGuideModel | undefined {
  const areaLabel = listings.find((listing) => listing.area && slugify(listing.area) === areaSlug)?.area;
  if (!areaLabel) return undefined;

  return {
    areaLabel,
    neighborhoods: getNeighborhoodOptionsByArea(areaSlug),
    categories: getCategoryOptionsByArea(areaSlug)
  };
}

export function getNeighborhoodOptionsByArea(areaSlug: string): SearchableDirectoryCard[] {
  return countByLabel(
    listings
      .filter((listing) => listing.area && slugify(listing.area) === areaSlug)
      .map((listing) => listing.neighborhood)
      .filter(isString)
  ).map((neighborhood) => ({
    label: neighborhood.label,
    slug: neighborhood.slug,
    href: neighborhoodPath(neighborhood.slug),
    count: neighborhood.count,
    description: `${neighborhood.count.toLocaleString()} ${listingCountLabel(neighborhood.count)} in ${neighborhood.label}.`
  }));
}

export function getCategoryOptionsByArea(areaSlug: string): SearchableDirectoryCard[] {
  const areaLabel = listings.find((listing) => listing.area && slugify(listing.area) === areaSlug)?.area;
  if (!areaLabel) return [];

  return countByLabel(
    listings
      .filter((listing) => listing.area && slugify(listing.area) === areaSlug)
      .flatMap((listing) => listing.categories)
  ).map((category) => ({
    label: category.label,
    slug: category.slug,
    href: areaCategoryPath(areaSlug, category.slug),
    count: category.count,
    description: `${category.count.toLocaleString()} ${category.label.toLowerCase()} ${listingCountLabel(category.count)} in ${areaLabel}.`
  }));
}

function countByLabel(labels: string[]) {
  const counts = new Map<string, { label: string; slug: string; count: number }>();

  labels.forEach((label) => {
    const slug = slugify(label);
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
      return;
    }

    counts.set(slug, { label: label.trim(), slug, count: 1 });
  });

  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function listingCountLabel(count: number) {
  return count === 1 ? directoryConfig.listingLabel.toLowerCase() : directoryConfig.listingPluralLabel.toLowerCase();
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}
