import {
  buildDirectoryListingsModel
} from "@/lib/directory-listings-model";
import { searchParamsRecordFromUrlSearchParams } from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type BuildBrowserDirectoryListingsModelInput = {
  searchParams: URLSearchParams;
  basePath?: string;
  title: string;
  description: string;
};

export function buildBrowserDirectoryListingsModel({
  searchParams,
  basePath,
  title,
  description
}: BuildBrowserDirectoryListingsModelInput): DirectoryListingsModel {
  return buildDirectoryListingsModel({
    searchParams: searchParamsRecordFromUrlSearchParams(searchParams),
    basePath,
    title,
    description
  });
}
