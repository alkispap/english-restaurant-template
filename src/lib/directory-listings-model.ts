import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { homepageHeadings } from "@/lib/homepage-headings";
import { getFilterPanelOptionGroups } from "@/lib/filter-panel-options";
import {
  filterListingSearchRecords,
  getClientSidebarBlocks,
  getDirectorySearchRows,
  getSearchAreaMapPoints,
  getSearchAreas
} from "@/lib/listing-search";
import { isOpenNow } from "@/lib/opening-hours";
import { slugify } from "@/lib/slug";
import {
  normalizeSearchParams,
  type DirectoryListingsSearchParams
} from "@/lib/directory-listings-search-params";
import {
  LISTINGS_PAGE_SIZE,
  mapPointsFromListings,
  paginateListings,
  type ListingsPageLinkValues,
  type ListingsViewMode
} from "@/lib/listings-page";
import type { DirectoryListingsFilters, DirectoryListingsModel } from "@/lib/directory-listings-types";

type SortKey = "featured" | "rating" | "reviews" | "price";

type BuildDirectoryListingsModelInput = {
  searchParams?: DirectoryListingsSearchParams;
  basePath?: string;
  title?: string;
  description?: string;
  headingContext?: string;
};

export function buildDirectoryListingsModel({
  searchParams = {},
  basePath,
  title = `Find ${directoryConfig.listingPluralLabel.toLowerCase()} in ${siteConfig.cityOrRegion}`,
  description = `Search the imported directory dataset and refine by area, ${directoryConfig.categoryLabel.toLowerCase()}, ${directoryConfig.filterLabels.type.toLowerCase()}, features, price, and rating.`,
  headingContext
}: BuildDirectoryListingsModelInput = {}): DirectoryListingsModel {
  const filters = filtersFromSearchParams(searchParams);
  const openOnly = single(searchParams.open) === "1";
  const viewMode = asViewMode(single(searchParams.view));
  const requestedPage = numeric(single(searchParams.page)) ?? 1;
  const filteredResults = filterListingSearchRecords(filters);
  const results = openOnly
    ? filteredResults.filter((listing) => isOpenNow(listing.details?.workingHours))
    : filteredResults;
  const page = paginateListings(results, requestedPage, LISTINGS_PAGE_SIZE);
  const linkValues: ListingsPageLinkValues = {
    ...filters,
    basePath,
    rating: filters.rating ? String(filters.rating) : undefined,
    open: openOnly,
    view: viewMode,
    page: page.currentPage
  };
  const filterPanelValues = {
    ...linkValues
  };
  const chrome = buildDirectoryListingsChrome(filterPanelValues, basePath === "/" ? "homepage" : "default");

  return {
    searchQuery: normalizeSearchParams(searchParams),
    basePath,
    title,
    description,
    filters,
    filterPanelValues,
    linkValues,
    listings: page.items,
    mapPoints: viewMode === "map" ? mapPointsFromListings(results) : [],
    totalCount: results.length,
    currentPage: page.currentPage,
    pageSize: page.pageSize,
    totalPages: page.totalPages,
    viewMode,
    openOnly,
    searchAreas: chrome.searchAreas,
    searchMapPoints: chrome.searchMapPoints,
    filterOptionGroups: chrome.filterOptionGroups,
    sidebarContext: chrome.sidebarContext,
    sidebarBlocks: chrome.sidebarBlocks,
    homepageSeoGroups: [],
    relatedRows: getDirectorySearchRows(page.items),
    sourceContextGuide: null,
    headingContext: headingContext ?? (basePath === "/" ? homepageHeadings.resultsHeadingContext : undefined)
  };
}

export function buildDirectoryListingsChrome(
  values: ListingsPageLinkValues,
  sidebarContext: "default" | "homepage" | "seoLanding"
) {
  return {
    searchAreas: getSearchAreas().map((area) => ({ label: area, value: slugify(area) })),
    searchMapPoints: getSearchAreaMapPoints(),
    filterOptionGroups: getFilterPanelOptionGroups(values),
    sidebarContext,
    sidebarBlocks: getClientSidebarBlocks(sidebarContext)
  };
}

function filtersFromSearchParams(params: DirectoryListingsSearchParams): DirectoryListingsFilters {
  return {
    q: single(params.q),
    area: multi(params.area),
    neighborhood: multi(params.neighborhood),
    category: multi(params.category) ?? multi(params.cuisine),
    type: multi(params.type),
    dietary: multi(params.dietary),
    service: multi(params.service),
    offering: multi(params.offering),
    highlight: multi(params.highlight),
    popularFor: multi(params.popularFor),
    dining: multi(params.dining),
    amenity: multi(params.amenity),
    accessibility: multi(params.accessibility),
    atmosphere: multi(params.atmosphere),
    crowd: multi(params.crowd),
    planning: multi(params.planning),
    payment: multi(params.payment),
    children: multi(params.children),
    parking: multi(params.parking),
    pets: multi(params.pets),
    tube: multi(params.tube),
    bus: multi(params.bus),
    nearby: multi(params.nearby),
    price: multi(params.price),
    rating: numeric(single(params.rating)),
    sort: asSort(single(params.sort))
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function multi(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value || undefined;
}

function numeric(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asSort(value?: string): SortKey | undefined {
  return value === "rating" || value === "reviews" || value === "price" || value === "featured" ? value : undefined;
}

function asViewMode(value?: string): ListingsViewMode {
  return value === "map" ? "map" : "grid";
}
