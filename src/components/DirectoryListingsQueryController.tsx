"use client";

import { useEffect } from "react";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type DirectoryListingsQueryControllerProps = {
  initialModel: DirectoryListingsModel;
  currentQuery: string;
  onModelChange: (model: DirectoryListingsModel) => void;
};

export function DirectoryListingsQueryController({
  initialModel,
  currentQuery,
  onModelChange
}: DirectoryListingsQueryControllerProps) {
  useEffect(() => {
    let cancelled = false;

    function updateFromCurrentUrl() {
      const currentParams = new URLSearchParams(window.location.search);
      const nextQuery = normalizeSearchParams(searchParamsRecordFromUrlSearchParams(currentParams));
      if (!nextQuery) {
        onModelChange(initialModel);
        return;
      }
      if (nextQuery === currentQuery) return;

      import("@/lib/directory-listings-browser").then(({ buildBrowserDirectoryListingsModel }) => {
        if (cancelled) return;
        onModelChange(
          buildBrowserDirectoryListingsModel({
            searchParams: currentParams,
            basePath: initialModel.basePath,
            title: initialModel.title,
            description: initialModel.description
          })
        );
      });
    }

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("directory-url-change"));
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("directory-url-change"));
      return result;
    };

    updateFromCurrentUrl();
    window.addEventListener("popstate", updateFromCurrentUrl);
    window.addEventListener("directory-url-change", updateFromCurrentUrl);
    return () => {
      cancelled = true;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", updateFromCurrentUrl);
      window.removeEventListener("directory-url-change", updateFromCurrentUrl);
    };
  }, [currentQuery, initialModel, onModelChange]);

  return null;
}
