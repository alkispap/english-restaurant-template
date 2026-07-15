import { directoryConfig } from "@/config/directory";
import { buildBrowserDirectoryListingsModel } from "@/lib/directory-listings-browser";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import type { DirectoryListingsFilters } from "@/lib/directory-listings-types";

type BuildBrowserSeoLandingListingsModelInput = {
  pathname: string;
  searchParams: URLSearchParams;
  basePath: string;
  title: string;
  description: string;
  headingContext?: string;
};

export function buildBrowserSeoLandingListingsModel({
  pathname,
  searchParams,
  basePath,
  title,
  description,
  headingContext
}: BuildBrowserSeoLandingListingsModelInput): DirectoryListingsModel | undefined {
  const baseFilters = baseFiltersFromSeoPath(pathname);
  if (!baseFilters) return undefined;

  return buildBrowserDirectoryListingsModel({
    searchParams,
    basePath,
    title,
    description,
    headingContext,
    baseFilters
  });
}

function baseFiltersFromSeoPath(pathname: string): Partial<DirectoryListingsFilters> | undefined {
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  if (segments[0] === "areas" && segments[1] && segments[2] === "categories" && segments[3]) {
    return { area: segments[1], category: segments[3], sort: "rating" };
  }

  if (segments[0] === "areas" && segments[1] && segments.length === 2) {
    return { area: segments[1], sort: directoryConfig.defaultSort };
  }

  if (segments[0] === "categories" && segments[1] && segments.length === 2) {
    return { category: segments[1], sort: "rating" };
  }

  if (segments[0] === "neighborhoods" && segments[1] && segments.length === 2) {
    return { neighborhood: segments[1], sort: directoryConfig.defaultSort };
  }

  if (segments[0] === "best" && segments[1] && segments.length === 2) {
    const search = directoryConfig.popularSearches.find((item) => item.slug === segments[1]);
    if (!search) return undefined;

    return {
      ...search.filters,
      sort: search.sort ?? directoryConfig.defaultSort
    } as Partial<DirectoryListingsFilters>;
  }

  if (segments[0] === "services" && segments[1] && segments.length === 2) {
    return { service: segments[1], sort: "rating" };
  }

  if (segments[0] === "dietary" && segments[1] && segments.length === 2) {
    return { dietary: segments[1], sort: "rating" };
  }

  if (segments[0] === "offerings" && segments[1] && segments.length === 2) {
    return { offering: segments[1], sort: "rating" };
  }

  if (segments[0] === "types" && segments[1] && segments.length === 2) {
    return { type: segments[1], sort: "rating" };
  }

  return undefined;
}
