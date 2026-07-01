import type { FilterPanelOptionGroup } from "@/lib/filter-panel-options";
import type {
  DirectoryListingRowSummary,
  ListingResultSummary,
  ListingsPageLinkValues,
  MapPoint
} from "@/lib/listings-page";

export type DirectoryListingsFilters = Omit<
  ListingsPageLinkValues,
  "basePath" | "open" | "view" | "page" | "rating"
> & {
  rating?: number;
};

export type SearchAreaOption = {
  label: string;
  value: string;
};

export type DirectoryListingsLinkGroup = {
  id?: string;
  title: string;
  copy?: string;
  links: Array<{
    label: string;
    href: string;
    description?: string;
    count?: number;
  }>;
};

export type DirectoryListingsSourceContextGuide = {
  title: string;
  intro: string;
  points: Array<{
    title: string;
    copy: string;
  }>;
};

export type DirectoryListingsModel = {
  searchQuery: string;
  basePath?: string;
  title: string;
  description: string;
  filters: DirectoryListingsFilters;
  filterPanelValues: ListingsPageLinkValues;
  linkValues: ListingsPageLinkValues;
  listings: ListingResultSummary[];
  mapPoints: MapPoint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  viewMode: "grid" | "map";
  openOnly: boolean;
  searchAreas: SearchAreaOption[];
  searchMapPoints: MapPoint[];
  filterOptionGroups: FilterPanelOptionGroup[];
  sidebarContext: "default" | "homepage" | "seoLanding";
  sidebarBlocks: DirectoryListingsLinkGroup[];
  homepageSeoGroups: DirectoryListingsLinkGroup[];
  relatedRows: DirectoryListingRowSummary[];
  sourceContextGuide: DirectoryListingsSourceContextGuide | null;
  headingContext?: string;
};
