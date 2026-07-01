"use client";

import { useEffect, useState } from "react";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type DirectoryListingsInteractiveShellComponent = typeof import("@/components/DirectoryListingsInteractiveShell").DirectoryListingsInteractiveShell;
type DirectoryListingsBrowserModule = typeof import("@/lib/directory-listings-browser");
type DirectoryListingsShellModule = typeof import("@/components/DirectoryListingsInteractiveShell");

type DirectoryListingsQueryEnhancerProps = {
  initialModel: DirectoryListingsModel;
};

let directoryListingsClientModulesPromise: Promise<[DirectoryListingsBrowserModule, DirectoryListingsShellModule]> | null = null;

function loadDirectoryListingsClientModules() {
  directoryListingsClientModulesPromise ??= Promise.all([
    import("@/lib/directory-listings-browser"),
    import("@/components/DirectoryListingsInteractiveShell")
  ]);
  return directoryListingsClientModulesPromise;
}

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
    let pendingUpdateTimer: number | null = null;
    let lastHandledUrl: string | null = null;
    let requestVersion = 0;

    async function updateFromCurrentUrl() {
      const currentUrl = window.location.href;
      if (currentUrl === lastHandledUrl) return;

      lastHandledUrl = currentUrl;
      const version = ++requestVersion;
      const currentParams = new URLSearchParams(window.location.search);
      const nextQuery = normalizeSearchParams(searchParamsRecordFromUrlSearchParams(currentParams));
      if (!nextQuery) {
        setActiveModel(null);
        return;
      }

      const [{ buildBrowserDirectoryListingsModel }, shellModule] = await loadDirectoryListingsClientModules();
      if (cancelled || version !== requestVersion) return;

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

    function scheduleUpdateFromCurrentUrl() {
      if (pendingUpdateTimer !== null) {
        window.clearTimeout(pendingUpdateTimer);
      }

      pendingUpdateTimer = window.setTimeout(() => {
        pendingUpdateTimer = null;
        void updateFromCurrentUrl();
      }, 0);
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

    void updateFromCurrentUrl();
    window.addEventListener("popstate", scheduleUpdateFromCurrentUrl);
    window.addEventListener("directory-url-change", scheduleUpdateFromCurrentUrl);

    return () => {
      cancelled = true;
      if (pendingUpdateTimer !== null) {
        window.clearTimeout(pendingUpdateTimer);
      }
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", scheduleUpdateFromCurrentUrl);
      window.removeEventListener("directory-url-change", scheduleUpdateFromCurrentUrl);
    };
  }, [initialModel.basePath, initialModel.description, initialModel.title]);

  if (!activeModel || !InteractiveShell) return null;

  return <InteractiveShell initialModel={activeModel} />;
}
