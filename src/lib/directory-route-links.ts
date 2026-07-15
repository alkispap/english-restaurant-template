import type { FacetKey } from "@/lib/directory";
import { getEnabledSitemapRouteKinds } from "@/lib/directory-features";
import { getListingFilterCount } from "@/lib/listing-filter-counts";
import {
  categoryPath,
  dietaryPath,
  directorySearchPath,
  offeringPath,
  servicePath,
  typePath
} from "@/lib/routes";
import { SEO_POLICY, isApprovedHighIntentFacet } from "@/lib/seo-policy";
import { slugify } from "@/lib/slug";

export type DirectoryRouteFilterKey = "category" | FacetKey;

export function directoryRouteLink(
  filter: DirectoryRouteFilterKey,
  value: string,
  options: { area?: string } = {}
) {
  const valueSlug = slugify(value);

  if (hasGeneratedDirectoryRoute(filter, valueSlug)) {
    return dedicatedRoutePath(filter, valueSlug);
  }

  const params = new URLSearchParams();
  if (options.area) params.set("area", slugify(options.area));
  params.set(filter, valueSlug);
  return directorySearchPath(`?${params.toString()}`);
}

export function hasGeneratedDirectoryRoute(filter: DirectoryRouteFilterKey, valueSlug: string) {
  if (filter === "category") {
    return getListingFilterCount("category", valueSlug) >= SEO_POLICY.routeThresholds.category;
  }

  const enabledRoutes = getEnabledSitemapRouteKinds();
  const routeEnabled =
    (filter === "type" && enabledRoutes.types) ||
    (filter === "dietary" && enabledRoutes.dietary) ||
    (filter === "service" && enabledRoutes.services) ||
    (filter === "offering" && enabledRoutes.offerings);

  return (
    routeEnabled &&
    isApprovedHighIntentFacet(filter, valueSlug) &&
    getListingFilterCount(filter, valueSlug) >= SEO_POLICY.routeThresholds.facet
  );
}

function dedicatedRoutePath(filter: DirectoryRouteFilterKey, valueSlug: string) {
  if (filter === "category") return categoryPath(valueSlug);
  if (filter === "type") return typePath(valueSlug);
  if (filter === "dietary") return dietaryPath(valueSlug);
  if (filter === "service") return servicePath(valueSlug);
  return offeringPath(valueSlug);
}
