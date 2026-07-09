"use client";

import { ListingsResults } from "@/components/ListingsResults";
import { ResponsiveDirectoryFilters } from "@/components/ResponsiveDirectoryFilters";
import type { FilterPanelOptionGroup } from "@/lib/filter-panel-options";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type SeoLandingResultsShellProps = {
  model: DirectoryListingsModel;
  hiddenGroups?: FilterPanelOptionGroup["name"][];
};

export function SeoLandingResultsShell({ model, hiddenGroups = [] }: SeoLandingResultsShellProps) {
  const filterModel = {
    filterPanelValues: model.filterPanelValues,
    filterOptionGroups: model.filterOptionGroups,
    sidebarContext: model.sidebarContext,
    sidebarBlocks: model.sidebarBlocks
  };

  return (
    <div id="seo-landing-client-results" className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
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
          linkValues={model.linkValues}
          headingContext={model.headingContext}
        />
      </div>
    </div>
  );
}
