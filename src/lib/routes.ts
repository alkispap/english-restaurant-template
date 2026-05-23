import { siteConfig } from "@/config/site";

export function listingsPath(path = "") {
  return `/${siteConfig.listingBasePath}${path}`;
}

export function directoryIndexPath(path = "") {
  return `/${path.replace(/^\//, "")}`;
}

export function listingDetailPath(slug: string) {
  return listingsPath(`/${slug}`);
}

export function popularSearchPath(slug: string) {
  return `/best/${slug}`;
}

export function areaPath(areaSlug: string) {
  return `/areas/${areaSlug}`;
}

export function categoryPath(categorySlug: string) {
  return `/categories/${categorySlug}`;
}

export function neighborhoodPath(neighborhoodSlug: string) {
  return `/neighborhoods/${neighborhoodSlug}`;
}

export function dietaryPath(dietarySlug: string) {
  return `/dietary/${dietarySlug}`;
}

export function servicePath(serviceSlug: string) {
  return `/services/${serviceSlug}`;
}

export function typePath(typeSlug: string) {
  return `/types/${typeSlug}`;
}

export function offeringPath(offeringSlug: string) {
  return `/offerings/${offeringSlug}`;
}

export function areaCategoryPath(areaSlug: string, categorySlug: string) {
  return `${areaPath(areaSlug)}/categories/${categorySlug}`;
}
