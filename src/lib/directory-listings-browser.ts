import {
  buildDirectoryListingsModel,
  prepareDirectoryListingsModel
} from "@/lib/directory-listings-model-core";
import { searchParamsRecordFromUrlSearchParams } from "@/lib/directory-listings-search-params";
import { loadBrowserDirectorySearchRuntime } from "@/lib/directory-search-runtime-browser";
import type { DirectoryListingsFilters, DirectoryListingsModel } from "@/lib/directory-listings-types";

if (typeof window !== "undefined") performance.mark("directory-browser-model-module-evaluated");

type BuildBrowserDirectoryListingsModelInput = {
  searchParams: URLSearchParams;
  basePath?: string;
  title: string;
  description: string;
  headingContext?: string;
  baseFilters?: Partial<DirectoryListingsFilters>;
};

export async function buildBrowserDirectoryListingsModel({
  searchParams,
  basePath,
  title,
  description,
  headingContext,
  baseFilters
}: BuildBrowserDirectoryListingsModelInput): Promise<DirectoryListingsModel> {
  await loadBrowserDirectorySearchRuntime();
  return buildDirectoryListingsModel({
    searchParams: searchParamsRecordFromUrlSearchParams(searchParams),
    basePath,
    title,
    description,
    headingContext,
    baseFilters
  });
}

export async function prepareBrowserDirectoryListingsModel() {
  await loadBrowserDirectorySearchRuntime();
  prepareDirectoryListingsModel();
}
