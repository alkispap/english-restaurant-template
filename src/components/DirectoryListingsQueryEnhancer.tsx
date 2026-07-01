"use client";

import { useEffect, useState } from "react";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type DirectoryListingsInteractiveShellComponent = typeof import("@/components/DirectoryListingsInteractiveShell").DirectoryListingsInteractiveShell;

type DirectoryListingsQueryEnhancerProps = {
  initialModel: DirectoryListingsModel;
};

export function DirectoryListingsQueryEnhancer({ initialModel }: DirectoryListingsQueryEnhancerProps) {
  const [activeModel, setActiveModel] = useState<DirectoryListingsModel | null>(null);
  const [InteractiveShell, setInteractiveShell] = useState<DirectoryListingsInteractiveShellComponent | null>(null);

  useEffect(() => {
    const serverMain = document.getElementById("directory-listings-server-main");
    if (serverMain) serverMain.hidden = activeModel !== null;

    return () => {
      if (serverMain) serverMain.hidden = false;
    };
  }, [activeModel]);

  useEffect(() => {
    let cancelled = false;

    async function updateFromCurrentUrl() {
      const currentParams = new URLSearchParams(window.location.search);
      const nextQuery = normalizeSearchParams(searchParamsRecordFromUrlSearchParams(currentParams));
      if (!nextQuery) {
        setActiveModel(null);
        return;
      }

      const [{ buildBrowserDirectoryListingsModel }, shellModule] = await Promise.all([
        import("@/lib/directory-listings-browser"),
        import("@/components/DirectoryListingsInteractiveShell")
      ]);
      if (cancelled) return;

      setInteractiveShell(() => shellModule.DirectoryListingsInteractiveShell);
      setActiveModel(
        buildBrowserDirectoryListingsModel({
          searchParams: currentParams,
          basePath: initialModel.basePath,
          title: initialModel.title,
          description: initialModel.description
        })
      );
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
  }, [initialModel.basePath, initialModel.description, initialModel.title]);

  if (!activeModel || !InteractiveShell) return null;

  return <InteractiveShell initialModel={activeModel} />;
}
