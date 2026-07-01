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
import { SEO_POLICY, isApprovedHighIntentFacet } from "@/lib/seo-policy";
import { shouldGenerateFullStaticParams } from "@/lib/static-build";
import { getIndexedListingFilterCount, getListingFilterCount } from "@/lib/listing-filter-counts";

export function getStaticAreaParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return getAreas()
    .filter((area) => getListingFilterCount("area", slugify(area)) >= SEO_POLICY.routeThresholds.area)
    .map((area) => ({ area: slugify(area) }));
}

export function getStaticNeighborhoodParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return getNeighborhoods()
    .filter((neighborhood) => getListingFilterCount("neighborhood", slugify(neighborhood)) >= SEO_POLICY.routeThresholds.neighborhood)
    .map((neighborhood) => ({ neighborhood: slugify(neighborhood) }));
}

export function getStaticCategoryParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return getCategories()
    .filter((category) => getListingFilterCount("category", slugify(category)) >= SEO_POLICY.routeThresholds.category)
    .map((category) => ({ category: slugify(category) }));
}

export function getStaticAreaCategoryParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  const enabledRoutes = getEnabledSitemapRouteKinds();
  if (!enabledRoutes.areaCategories) return [];

  return getAreaCategoryCombinations()
    .filter((combination) => combination.count >= SEO_POLICY.routeThresholds.areaCategory)
    .map((combination) => ({ area: combination.areaSlug, category: combination.categorySlug }));
}

export function getStaticPopularSearchParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  const enabledRoutes = getEnabledSitemapRouteKinds();
  if (!enabledRoutes.popularSearches) return [];

  return getPopularSearches()
    .filter((search) => (getIndexedListingFilterCount(search.filters) ?? filterListings(search.filters).length) >= SEO_POLICY.routeThresholds.best)
    .map((search) => ({ slug: search.slug }));
}

export function getStaticFacetParams<TParam extends string>(facet: FacetKey, paramName: TParam): Array<Record<TParam, string>> {
  if (!shouldGenerateFullStaticParams()) return [];

  const enabledRoutes = getEnabledSitemapRouteKinds();
  const isEnabled =
    (facet === "type" && enabledRoutes.types) ||
    (facet === "dietary" && enabledRoutes.dietary) ||
    (facet === "service" && enabledRoutes.services) ||
    (facet === "offering" && enabledRoutes.offerings);

  if (!isEnabled) return [];

  return getFacetLabels(facet)
    .map(slugify)
    .filter((slug) => isApprovedHighIntentFacet(facet, slug))
    .filter((slug) => getListingFilterCount(facet, slug) >= SEO_POLICY.routeThresholds.facet)
    .map((slug) => ({ [paramName]: slug }) as Record<TParam, string>);
}
