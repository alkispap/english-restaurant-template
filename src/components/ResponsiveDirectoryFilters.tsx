"use client";

import { useEffect, useState } from "react";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { FilterPanel, SelectedFilterChips, getSelectedFilters } from "@/components/FilterPanel";
import type { FilterPanelOptionGroup } from "@/lib/filter-panel-options";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type ResponsiveDirectoryFiltersProps = {
  model: Pick<DirectoryListingsModel, "filterPanelValues" | "filterOptionGroups" | "sidebarContext" | "sidebarBlocks">;
  action?: string;
  hiddenGroups?: FilterPanelOptionGroup["name"][];
};

export function ResponsiveDirectoryFilters({ model, action, hiddenGroups = [] }: ResponsiveDirectoryFiltersProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const selectedFilters = getSelectedFilters(model.filterPanelValues, model.filterOptionGroups, hiddenGroups);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateMode = () => setIsDesktop(mediaQuery.matches);

    updateMode();
    mediaQuery.addEventListener("change", updateMode);
    return () => mediaQuery.removeEventListener("change", updateMode);
  }, []);

  if (isDesktop === null) {
    return (
      <aside
        aria-label="Directory filters"
        className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
      />
    );
  }

  if (isDesktop) {
    return (
      <aside
        aria-label="Directory filters"
        className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
      >
        <FilterPanel
          action={action}
          values={model.filterPanelValues}
          optionGroups={model.filterOptionGroups}
          hiddenGroups={hiddenGroups}
        />
        <DirectorySidebar context={model.sidebarContext} blocks={model.sidebarBlocks} />
      </aside>
    );
  }

  function handleMobileFiltersToggle(event: React.ToggleEvent<HTMLDetailsElement>) {
    setMobileFiltersOpen(event.currentTarget.open);
  }

  return (
    <aside aria-label="Directory filters" className="lg:hidden">
      <details className="rounded-lg border border-line bg-white p-4 shadow-soft" onToggle={handleMobileFiltersToggle}>
        <summary className="cursor-pointer text-sm font-bold text-ink">Filters</summary>
        <div className="mt-5">
          <FilterPanel
            action={action}
            values={model.filterPanelValues}
            optionGroups={model.filterOptionGroups}
            hiddenGroups={hiddenGroups}
          />
        </div>
      </details>
      {!mobileFiltersOpen ? (
        <SelectedFilterChips
          values={model.filterPanelValues}
          filters={selectedFilters}
          className="mt-3 rounded-lg border border-line bg-white p-4 shadow-soft"
        />
      ) : null}
    </aside>
  );
}
