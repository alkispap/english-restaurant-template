"use client";

import { ListingsResults } from "@/components/ListingsResults";
import { ResponsiveDirectoryFilters } from "@/components/ResponsiveDirectoryFilters";
import type { FilterPanelOptionGroup } from "@/lib/filter-panel-options";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import {
  getSeoLandingPresentationValues,
  type SeoLandingRouteContextKey
} from "@/lib/seo-landing-filter-context";

type SeoLandingResultsShellProps = {
  model: DirectoryListingsModel;
  hiddenGroups?: FilterPanelOptionGroup["name"][];
  definingContextKey?: SeoLandingRouteContextKey;
};

export function SeoLandingResultsShell({ model, hiddenGroups = [], definingContextKey }: SeoLandingResultsShellProps) {
  const keepExplicitSort = new URLSearchParams(model.searchQuery).has("sort");
  const presentationValues = definingContextKey
    ? getSeoLandingPresentationValues(model.linkValues, definingContextKey, keepExplicitSort)
    : model.linkValues;
  const filterModel = {
    filterPanelValues: presentationValues,
    filterOptionGroups: model.filterOptionGroups,
    sidebarContext: model.sidebarContext,
    sidebarBlocks: model.sidebarBlocks
  };

  return (
    <div id="seo-landing-client-results" className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ResponsiveDirectoryFilters model={filterModel} action={model.basePath} hiddenGroups={hiddenGroups} />
      <div className="min-w-0">
        <ListingsResults
          listings={model.listings}
          mapPoints={model.mapPoints}
          totalCount={model.totalCount}
          currentPage={model.currentPage}
          pageSize={model.pageSize}
          totalPages={model.totalPages}
          viewMode={model.viewMode}
          openOnly={model.openOnly}
          linkValues={presentationValues}
          headingContext={model.headingContext}
        />
      </div>
    </div>
  );
}
