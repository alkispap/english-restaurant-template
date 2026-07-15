"use client";

import { useEffect, useState } from "react";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import { directoryConfig } from "@/config/directory";

type DirectoryListingsInteractiveShellComponent = typeof import("@/components/DirectoryListingsInteractiveShell").DirectoryListingsInteractiveShell;
type DirectoryListingsBrowserModule = typeof import("@/lib/directory-listings-browser");
type DirectoryListingsShellModule = typeof import("@/components/DirectoryListingsInteractiveShell");

type DirectoryListingsQueryEnhancerProps = {
  initialPage: Pick<DirectoryListingsModel, "basePath" | "title" | "description">;
};

let directoryListingsClientModulesPromise: Promise<[DirectoryListingsBrowserModule, DirectoryListingsShellModule]> | null = null;

function loadDirectoryListingsClientModules() {
  directoryListingsClientModulesPromise ??= Promise.all([
    import("@/lib/directory-listings-browser"),
    import("@/components/DirectoryListingsInteractiveShell")
  ]);
  return directoryListingsClientModulesPromise;
}

export function DirectoryListingsQueryEnhancer({ initialPage }: DirectoryListingsQueryEnhancerProps) {
  const [activeModel, setActiveModel] = useState<DirectoryListingsModel | null>(null);
  const [InteractiveShell, setInteractiveShell] = useState<DirectoryListingsInteractiveShellComponent | null>(null);
  const [queryBusy, setQueryBusy] = useState(false);
  const [queryMessage, setQueryMessage] = useState("");
  const [queryError, setQueryError] = useState(false);

  useEffect(() => {
    const serverMain = document.getElementById("directory-listings-server-main");
    if (serverMain) serverMain.hidden = activeModel !== null;

    return () => {
      if (serverMain) serverMain.hidden = false;
    };
  }, [activeModel]);

  useEffect(() => {
    const results = [
      document.getElementById("directory-listings-server-main"),
      document.getElementById("directory-listings-client-main")
    ].filter((element): element is HTMLElement => Boolean(element));

    results.forEach((element) => element.setAttribute("aria-busy", String(queryBusy)));
    return () => results.forEach((element) => element.removeAttribute("aria-busy"));
  }, [activeModel, queryBusy]);

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
        setQueryBusy(false);
        setQueryError(false);
        setQueryMessage("Filters cleared.");
        return;
      }

      setQueryBusy(true);
      setQueryError(false);
      setQueryMessage(`Updating ${directoryConfig.listingPluralLabel.toLowerCase()}.`);
      try {
        const [{ buildBrowserDirectoryListingsModel }, shellModule] = await loadDirectoryListingsClientModules();
        if (cancelled || version !== requestVersion) return;

        const nextModel = buildBrowserDirectoryListingsModel({
          searchParams: currentParams,
          basePath: initialPage.basePath,
          title: initialPage.title,
          description: initialPage.description
        });
        setInteractiveShell(() => shellModule.DirectoryListingsInteractiveShell);
        setActiveModel(nextModel);
        setQueryMessage(`${nextModel.totalCount.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} updated.`);
      } catch {
        if (cancelled || version !== requestVersion) return;
        directoryListingsClientModulesPromise = null;
        setQueryError(true);
        setQueryMessage(`${directoryConfig.listingPluralLabel} could not be updated. Reload the page to try again.`);
      } finally {
        if (!cancelled && version === requestVersion) setQueryBusy(false);
      }
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
  }, [initialPage.basePath, initialPage.description, initialPage.title]);

  return (
    <>
      <p
        role={queryError ? "alert" : "status"}
        aria-live={queryError ? "assertive" : "polite"}
        aria-atomic="true"
        className={queryError ? "mx-auto my-4 max-w-7xl rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" : "sr-only"}
      >
        {queryMessage}
      </p>
      {activeModel && InteractiveShell ? <InteractiveShell initialModel={activeModel} /> : null}
    </>
  );
}
