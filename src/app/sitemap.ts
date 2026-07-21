import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { publishedListings as listings } from "@/data/listing-publication";
import { articleSitemapRoutes } from "@/lib/articles";
import { canonicalPageUrl } from "@/lib/canonical-page-url";
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
import { getIndexedListingFilterCount, getListingFilterCount } from "@/lib/listing-filter-counts";
import { SEO_POLICY, isApprovedHighIntentFacet, isListingIndexable } from "@/lib/seo-policy";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  directorySearchPath,
  dietaryPath,
  listingDetailPath,
  neighborhoodPath,
  offeringPath,
  popularSearchPath,
  servicePath,
  typePath
} from "@/lib/routes";

const directoryLastModified = SEO_POLICY.directoryLastModified;

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const enabledRoutes = getEnabledSitemapRouteKinds();
  const routes = ["", directorySearchPath(), "/areas", "/categories"].map((route) => ({
    url: canonicalPageUrl(baseUrl, route),
    lastModified: directoryLastModified
  }));

  const listingRoutes = listings.filter(isListingIndexable).map((listing) => ({
    url: canonicalPageUrl(baseUrl, listingDetailPath(listing.slug)),
    lastModified: directoryLastModified
  }));

  const areaRoutes = getAreas().filter((area) => getListingFilterCount("area", slugify(area)) >= SEO_POLICY.routeThresholds.area).map((area) => ({
    url: canonicalPageUrl(baseUrl, areaPath(slugify(area))),
    lastModified: directoryLastModified
  }));

  const categoryRoutes = getCategories().filter((category) => getListingFilterCount("category", slugify(category)) >= SEO_POLICY.routeThresholds.category).map((category) => ({
    url: canonicalPageUrl(baseUrl, categoryPath(slugify(category))),
    lastModified: directoryLastModified
  }));

  const neighborhoodRoutes = getNeighborhoods().filter((neighborhood) => getListingFilterCount("neighborhood", slugify(neighborhood)) >= SEO_POLICY.routeThresholds.neighborhood).map((neighborhood) => ({
    url: canonicalPageUrl(baseUrl, neighborhoodPath(slugify(neighborhood))),
    lastModified: directoryLastModified
  }));

  const facetRoutes = [
    ...(enabledRoutes.types ? facetSitemapRoutes("type", baseUrl) : []),
    ...(enabledRoutes.dietary ? facetSitemapRoutes("dietary", baseUrl) : []),
    ...(enabledRoutes.services ? facetSitemapRoutes("service", baseUrl) : []),
    ...(enabledRoutes.offerings ? facetSitemapRoutes("offering", baseUrl) : [])
  ];

  const popularSearchRoutes = enabledRoutes.popularSearches ? getPopularSearches().filter((search) => routeFilterCount(search.filters) >= SEO_POLICY.routeThresholds.best).map((search) => ({
    url: canonicalPageUrl(baseUrl, popularSearchPath(search.slug)),
    lastModified: directoryLastModified
  })) : [];

  const areaCategoryRoutes = enabledRoutes.areaCategories ? getAreaCategoryCombinations().filter((combination) => combination.count >= SEO_POLICY.routeThresholds.areaCategory).map((combination) => ({
    url: canonicalPageUrl(baseUrl, areaCategoryPath(combination.areaSlug, combination.categorySlug)),
    lastModified: directoryLastModified
  })) : [];
  const guideRoutes = articleSitemapRoutes(baseUrl);

  const allRoutes = [
    ...routes,
    ...listingRoutes,
    ...areaRoutes,
    ...categoryRoutes,
    ...neighborhoodRoutes,
    ...facetRoutes,
    ...popularSearchRoutes,
    ...areaCategoryRoutes,
    ...guideRoutes
  ];

  return Array.from(new Map(allRoutes.map((route) => [route.url, route])).values());
}

function facetSitemapRoutes(facet: FacetKey, baseUrl: string) {
  return getFacetLabels(facet)
    .filter((label) => isHighIntentFacet(facet, slugify(label)))
    .filter((label) => getListingFilterCount(facet, slugify(label)) >= SEO_POLICY.routeThresholds.facet)
    .map((label) => ({
      url: canonicalPageUrl(baseUrl, facetPath(facet, slugify(label))),
      lastModified: directoryLastModified
    }));
}

function routeFilterCount(filters: Parameters<typeof getIndexedListingFilterCount>[0]) {
  const indexedCount = getIndexedListingFilterCount(filters);
  if (indexedCount !== undefined) return indexedCount;
  if (Object.keys(filters).length === 0) return listings.length;
  return filterListings(filters).length;
}

function isHighIntentFacet(facet: FacetKey, slug: string) {
  return isApprovedHighIntentFacet(facet, slug);
}

function facetPath(facet: FacetKey, slug: string) {
  if (facet === "type") return typePath(slug);
  if (facet === "dietary") return dietaryPath(slug);
  if (facet === "service") return servicePath(slug);
  return offeringPath(slug);
}

