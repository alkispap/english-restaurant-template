import {
  buildDirectoryListingsModel
} from "@/lib/directory-listings-model";
import { searchParamsRecordFromUrlSearchParams } from "@/lib/directory-listings-search-params";
import type { DirectoryListingsFilters, DirectoryListingsModel } from "@/lib/directory-listings-types";

type BuildBrowserDirectoryListingsModelInput = {
  searchParams: URLSearchParams;
  basePath?: string;
  title: string;
  description: string;
  headingContext?: string;
  baseFilters?: Partial<DirectoryListingsFilters>;
};

export function buildBrowserDirectoryListingsModel({
  searchParams,
  basePath,
  title,
  description,
  headingContext,
  baseFilters
}: BuildBrowserDirectoryListingsModelInput): DirectoryListingsModel {
  return buildDirectoryListingsModel({
    searchParams: searchParamsRecordFromUrlSearchParams(searchParams),
    basePath,
    title,
    description,
    headingContext,
    baseFilters
  });
}
