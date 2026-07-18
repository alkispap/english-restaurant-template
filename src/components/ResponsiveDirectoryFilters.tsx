"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { AdsterraAd } from "@/components/AdsterraAd";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { FilterPanel, SelectedFilterChips, getSelectedFilters } from "@/components/FilterPanel";
import type { FilterPanelOptionGroup } from "@/lib/filter-panel-options";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import { useModalDialog } from "@/lib/use-modal-dialog";

type ResponsiveDirectoryFiltersProps = {
  model: Pick<DirectoryListingsModel, "filterPanelValues" | "filterOptionGroups" | "sidebarContext" | "sidebarBlocks">;
  action?: string;
  hiddenGroups?: FilterPanelOptionGroup["name"][];
};

export function ResponsiveDirectoryFilters({ model, action, hiddenGroups = [] }: ResponsiveDirectoryFiltersProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const selectedFilters = getSelectedFilters(model.filterPanelValues, model.filterOptionGroups, hiddenGroups);

  useModalDialog({
    open: mobileFiltersOpen,
    onClose: () => setMobileFiltersOpen(false),
    dialogRef: mobileDialogRef,
    overlayRef: mobileDialogRef,
    triggerRef: mobileTriggerRef,
    initialFocusRef: mobileCloseRef
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateMode = () => {
      setIsDesktop(mediaQuery.matches);
      if (mediaQuery.matches) setMobileFiltersOpen(false);
    };

    updateMode();
    mediaQuery.addEventListener("change", updateMode);
    return () => mediaQuery.removeEventListener("change", updateMode);
  }, []);

  if (isDesktop === null) {
    return (
      <aside
        aria-label="Directory filters"
        data-directory-query-intent="true"
        className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
      />
    );
  }

  if (isDesktop) {
    return (
      <aside
        aria-label="Directory filters"
        data-directory-query-intent="true"
        className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-2"
      >
        <FilterPanel
          action={action}
          values={model.filterPanelValues}
          optionGroups={model.filterOptionGroups}
          hiddenGroups={hiddenGroups}
        />
        <DirectorySidebar context={model.sidebarContext} blocks={model.sidebarBlocks} />
        <div className="mt-5">
          <AdsterraAd placement="160x600" />
        </div>
      </aside>
    );
  }

  const activeCountLabel = `${selectedFilters.length.toLocaleString()} active`;

  return (
    <aside aria-label="Directory filters" className="min-w-0 max-w-full lg:hidden" data-directory-query-intent="true">
      <button
        ref={mobileTriggerRef}
        type="button"
        aria-controls="mobile-filter-screen"
        aria-expanded={mobileFiltersOpen}
        onClick={() => setMobileFiltersOpen(true)}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-white p-4 text-left shadow-soft"
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
        </span>
        {selectedFilters.length ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-muted">{activeCountLabel}</span>
        ) : null}
      </button>

      {!mobileFiltersOpen ? (
        <>
          <SelectedFilterChips
            values={model.filterPanelValues}
            filters={selectedFilters}
            className="mt-3 rounded-lg border border-line bg-white p-4 shadow-soft"
          />
          <div className="mt-4 flex min-w-0 w-full max-w-full justify-center">
            <AdsterraAd placement="320x50" />
          </div>
        </>
      ) : null}

      {mobileFiltersOpen ? createPortal(
        <div
          ref={mobileDialogRef}
          id="mobile-filter-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="mobile-filter-title" className="text-base font-bold text-ink">
              Filters
            </h2>
            <button
              ref={mobileCloseRef}
              type="button"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <FilterPanel
              action={action}
              values={model.filterPanelValues}
              optionGroups={model.filterOptionGroups}
              hiddenGroups={hiddenGroups}
              className="space-y-5"
            />
          </div>

          <div className="sticky bottom-0 shrink-0 border-t border-line bg-white p-4 shadow-[0_-12px_24px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="focus-ring w-full rounded-md bg-emerald-950 px-4 py-3 text-sm font-bold text-white"
            >
              Show results
            </button>
          </div>
        </div>,
        document.body
      ) : null}
    </aside>
  );
}
