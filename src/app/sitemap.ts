import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listings } from "@/data/listings";
import {
  filterListings,
  getAreas,
  getCategories,
  getFacetLabels,
  getNeighborhoods,
  slugify,
  type FacetKey
} from "@/lib/directory";
import { getAreaCategoryCombinations, getPopularSearches } from "@/lib/directory-growth";
import { getEnabledSitemapRouteKinds } from "@/lib/directory-features";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  dietaryPath,
  listingDetailPath,
  neighborhoodPath,
  offeringPath,
  popularSearchPath,
  servicePath,
  typePath
} from "@/lib/routes";

const directoryLastModified = new Date("2026-05-18T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const enabledRoutes = getEnabledSitemapRouteKinds();
  const routes = ["", "/areas", "/categories"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: directoryLastModified
  }));

  const listingRoutes = listings.map((listing) => ({
    url: `${baseUrl}${listingDetailPath(listing.slug)}`,
    lastModified: directoryLastModified
  }));

  const areaRoutes = getAreas().filter((area) => filterListings({ area: slugify(area) }).length >= 5).map((area) => ({
    url: `${baseUrl}${areaPath(slugify(area))}`,
    lastModified: directoryLastModified
  }));

  const categoryRoutes = getCategories().filter((category) => filterListings({ category: slugify(category) }).length >= 10).map((category) => ({
    url: `${baseUrl}${categoryPath(slugify(category))}`,
    lastModified: directoryLastModified
  }));

  const neighborhoodRoutes = getNeighborhoods().filter((neighborhood) => filterListings({ neighborhood: slugify(neighborhood) }).length >= 5).map((neighborhood) => ({
    url: `${baseUrl}${neighborhoodPath(slugify(neighborhood))}`,
    lastModified: directoryLastModified
  }));

  const facetRoutes = [
    ...(enabledRoutes.types ? facetSitemapRoutes("type", baseUrl) : []),
    ...(enabledRoutes.dietary ? facetSitemapRoutes("dietary", baseUrl) : []),
    ...(enabledRoutes.services ? facetSitemapRoutes("service", baseUrl) : []),
    ...(enabledRoutes.offerings ? facetSitemapRoutes("offering", baseUrl) : [])
  ];

  const popularSearchRoutes = enabledRoutes.popularSearches ? getPopularSearches().filter((search) => filterListings(search.filters).length >= 5).map((search) => ({
    url: `${baseUrl}${popularSearchPath(search.slug)}`,
    lastModified: directoryLastModified
  })) : [];

  const areaCategoryRoutes = enabledRoutes.areaCategories ? getAreaCategoryCombinations().filter((combination) => combination.count >= 5).map((combination) => ({
    url: `${baseUrl}${areaCategoryPath(combination.areaSlug, combination.categorySlug)}`,
    lastModified: directoryLastModified
  })) : [];

  const allRoutes = [
    ...routes,
    ...listingRoutes,
    ...areaRoutes,
    ...categoryRoutes,
    ...neighborhoodRoutes,
    ...facetRoutes,
    ...popularSearchRoutes,
    ...areaCategoryRoutes
  ];

  return Array.from(new Map(allRoutes.map((route) => [route.url, route])).values());
}

function facetSitemapRoutes(facet: FacetKey, baseUrl: string) {
  return getFacetLabels(facet)
    .filter((label) => isHighIntentFacet(facet, slugify(label)))
    .filter((label) => filterListings({ [facet]: slugify(label) }).length >= 10)
    .map((label) => ({
      url: `${baseUrl}${facetPath(facet, slugify(label))}`,
      lastModified: directoryLastModified
    }));
}

function isHighIntentFacet(facet: FacetKey, slug: string) {
  const highIntentFacetSlugs: Record<FacetKey, readonly string[]> = {
    dietary: ["halal", "vegan", "vegetarian", "gluten-free"],
    service: ["takeaway", "delivery", "dine-in", "outdoor-seating"],
    type: ["fine-dining", "casual-dining", "cafe", "bar"],
    offering: ["halal-food", "vegan-options", "vegetarian-options", "organic-dishes", "small-plates"]
  };

  return highIntentFacetSlugs[facet].includes(slug);
}

function facetPath(facet: FacetKey, slug: string) {
  if (facet === "type") return typePath(slug);
  if (facet === "dietary") return dietaryPath(slug);
  if (facet === "service") return servicePath(slug);
  return offeringPath(slug);
}

