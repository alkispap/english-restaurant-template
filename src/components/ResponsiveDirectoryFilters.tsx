"use client";

import { useEffect, useState } from "react";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { FilterPanel } from "@/components/FilterPanel";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type ResponsiveDirectoryFiltersProps = {
  model: DirectoryListingsModel;
};

export function ResponsiveDirectoryFilters({ model }: ResponsiveDirectoryFiltersProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

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
        <FilterPanel values={model.filterPanelValues} optionGroups={model.filterOptionGroups} />
        <DirectorySidebar context={model.sidebarContext} blocks={model.sidebarBlocks} />
      </aside>
    );
  }

  return (
    <aside aria-label="Directory filters" className="lg:hidden">
      <details className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <summary className="cursor-pointer text-sm font-bold text-ink">Filters</summary>
        <div className="mt-5">
          <FilterPanel values={model.filterPanelValues} optionGroups={model.filterOptionGroups} />
        </div>
      </details>
    </aside>
  );
}
