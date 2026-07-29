"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  captureDirectoryQuerySnapshot,
  syncDirectoryQueryRobotsMeta
} from "@/lib/directory-listings-search-params";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import { directoryConfig } from "@/config/directory";
import { prefetchDirectorySearchData } from "@/lib/directory-search-data-request";

type DirectoryListingsInteractiveShellComponent = typeof import("@/components/DirectoryListingsInteractiveShell").DirectoryListingsInteractiveShell;
type DirectoryListingsBrowserModule = typeof import("@/lib/directory-listings-browser");
type DirectoryListingsShellModule = typeof import("@/components/DirectoryListingsInteractiveShell");

type DirectoryListingsQueryEnhancerProps = {
  initialPage: Pick<DirectoryListingsModel, "basePath" | "title" | "description">;
};

type PreparedInitialDirectoryQuery = {
  href: string;
  promise: Promise<{
    model: DirectoryListingsModel;
    shellModule: DirectoryListingsShellModule;
  }>;
};

let directoryListingsClientModulesPromise: Promise<[DirectoryListingsBrowserModule, DirectoryListingsShellModule]> | null = null;
let preparedDirectoryListingsClientModulesPromise: Promise<[DirectoryListingsBrowserModule, DirectoryListingsShellModule]> | null = null;
let preparedInitialDirectoryQuery: PreparedInitialDirectoryQuery | null = null;

function markDirectoryStartup(name: string) {
  if (typeof window !== "undefined") performance.mark(name);
}

function markDirectoryStartupOnce(name: string) {
  if (typeof window !== "undefined" && performance.getEntriesByName(name, "mark").length === 0) {
    performance.mark(name);
  }
}

markDirectoryStartup("directory-query-enhancer-module-evaluated");

if (typeof window !== "undefined") {
  const snapshot = captureDirectoryQuerySnapshot(window.location);
  syncDirectoryQueryRobotsMeta(snapshot.searchParams);
  const { normalizedQuery } = snapshot;
  if (normalizedQuery) {
    markDirectoryStartup("directory-query-startup-detected");
    void prefetchDirectorySearchData().catch(() => undefined);
    markDirectoryStartup("directory-runtime-import-started");
    void import("@/lib/directory-search-runtime-browser")
      .then((runtime) => {
        markDirectoryStartup("directory-runtime-import-resolved");
        return runtime.loadBrowserDirectorySearchRuntime();
      })
      .catch(() => undefined);
    void prepareDirectoryListingsClientModules().catch(resetDirectoryListingsClientModules);
  }
}

function loadDirectoryListingsClientModules() {
  if (!directoryListingsClientModulesPromise) {
    markDirectoryStartup("directory-client-imports-started");
    directoryListingsClientModulesPromise = Promise.all([
      import("@/lib/directory-listings-browser").then((module) => {
        markDirectoryStartup("directory-browser-module-resolved");
        return module;
      }),
      import("@/components/DirectoryListingsInteractiveShell").then((module) => {
        markDirectoryStartup("directory-shell-module-resolved");
        return module;
      })
    ]);
  }
  return directoryListingsClientModulesPromise;
}

function prepareDirectoryListingsClientModules() {
  preparedDirectoryListingsClientModulesPromise ??= loadDirectoryListingsClientModules().then(async (modules) => {
    await modules[0].prepareBrowserDirectoryListingsModel();
    return modules;
  });
  return preparedDirectoryListingsClientModulesPromise;
}

function resetDirectoryListingsClientModules() {
  directoryListingsClientModulesPromise = null;
  preparedDirectoryListingsClientModulesPromise = null;
}

function preloadDirectoryListingsClientModules() {
  void prefetchDirectorySearchData().catch(() => undefined);
  void prepareDirectoryListingsClientModules().catch(resetDirectoryListingsClientModules);
}

function prepareInitialDirectoryQuery(
  initialPage: DirectoryListingsQueryEnhancerProps["initialPage"]
): PreparedInitialDirectoryQuery | null {
  if (typeof window === "undefined") return null;
  const snapshot = captureDirectoryQuerySnapshot(window.location);
  if (!snapshot.normalizedQuery) return null;
  const { href, searchParams } = snapshot;
  if (preparedInitialDirectoryQuery?.href === href) return preparedInitialDirectoryQuery;

  const preparation: PreparedInitialDirectoryQuery = {
    href,
    promise: prepareDirectoryListingsClientModules().then(async ([browserModule, shellModule]) => {
      const modelStarted = performance.now();
      const model = await browserModule.buildBrowserDirectoryListingsModel({
        searchParams,
        basePath: initialPage.basePath,
        title: initialPage.title,
        description: initialPage.description
      });
      performance.measure("directory-model-build", { start: modelStarted, end: performance.now() });
      performance.mark("directory-initial-model-prepared");
      return { model, shellModule };
    })
  };
  preparation.promise.catch(() => {
    if (preparedInitialDirectoryQuery === preparation) preparedInitialDirectoryQuery = null;
  });
  preparedInitialDirectoryQuery = preparation;
  return preparation;
}

export function DirectoryListingsQueryEnhancer({ initialPage }: DirectoryListingsQueryEnhancerProps) {
  markDirectoryStartupOnce("directory-query-enhancer-first-render");
  const [initialQueryPreparation] = useState(() => prepareInitialDirectoryQuery(initialPage));
  const [activeModel, setActiveModel] = useState<DirectoryListingsModel | null>(null);
  const [InteractiveShell, setInteractiveShell] = useState<DirectoryListingsInteractiveShellComponent | null>(null);
  const [queryBusy, setQueryBusy] = useState(false);
  const [queryMessage, setQueryMessage] = useState("");
  const [queryError, setQueryError] = useState(false);

  useEffect(() => {
    let intentTimer: number | null = null;

    function handleDirectoryIntent(event: Event) {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-directory-query-intent="true"]')) {
        if (intentTimer !== null) return;
        intentTimer = window.setTimeout(() => {
          intentTimer = null;
          preloadDirectoryListingsClientModules();
        }, 75);
      }
    }

    document.addEventListener("pointerover", handleDirectoryIntent, { passive: true, capture: true });
    document.addEventListener("focusin", handleDirectoryIntent, { capture: true });

    return () => {
      if (intentTimer !== null) window.clearTimeout(intentTimer);
      document.removeEventListener("pointerover", handleDirectoryIntent, { capture: true });
      document.removeEventListener("focusin", handleDirectoryIntent, { capture: true });
    };
  }, []);

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

  useLayoutEffect(() => {
    markDirectoryStartupOnce("directory-query-effect-started");
    let cancelled = false;
    let pendingUpdateTimer: number | null = null;
    let lastHandledUrl: string | null = null;
    let requestVersion = 0;

    async function updateFromCurrentUrl() {
      const updateStarted = performance.now();
      performance.mark("directory-update-started");
      const urlChange = performance.getEntriesByName("directory-url-change-received", "mark").at(-1);
      if (urlChange) {
        performance.measure("directory-update-scheduling", { start: urlChange.startTime, end: updateStarted });
      }
      const {
        href: currentUrl,
        searchParams: currentParams,
        normalizedQuery: nextQuery
      } = captureDirectoryQuerySnapshot(window.location);
      syncDirectoryQueryRobotsMeta(currentParams);
      if (currentUrl === lastHandledUrl) return;

      lastHandledUrl = currentUrl;
      const version = ++requestVersion;
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
        const initialPreparation = initialQueryPreparation?.href === currentUrl
          ? await initialQueryPreparation.promise
          : null;
        const modules = initialPreparation ? null : await prepareDirectoryListingsClientModules();
        if (cancelled || version !== requestVersion) return;
        const modulesReady = performance.now();
        performance.measure("directory-client-modules", { start: updateStarted, end: modulesReady });

        let nextModel = initialPreparation?.model;
        const shellModule = initialPreparation?.shellModule ?? modules?.[1];
        if (!nextModel && modules) {
          const modelStarted = performance.now();
          nextModel = await modules[0].buildBrowserDirectoryListingsModel({
            searchParams: currentParams,
            basePath: initialPage.basePath,
            title: initialPage.title,
            description: initialPage.description
          });
          if (cancelled || version !== requestVersion) return;
          performance.measure("directory-model-build", { start: modelStarted, end: performance.now() });
        }
        if (!nextModel || !shellModule) throw new Error("Directory query preparation did not produce a model.");
        performance.mark("directory-model-ready");
        performance.mark("directory-primary-state-scheduled");
        setInteractiveShell(() => shellModule.DirectoryListingsInteractiveShell);
        setActiveModel(nextModel);
        setQueryMessage(`${nextModel.totalCount.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} updated.`);
      } catch {
        if (cancelled || version !== requestVersion) return;
        resetDirectoryListingsClientModules();
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
      performance.mark("directory-url-change-received");
      window.dispatchEvent(new Event("directory-url-change"));
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      performance.mark("directory-url-change-received");
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
      syncDirectoryQueryRobotsMeta(new URLSearchParams());
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", scheduleUpdateFromCurrentUrl);
      window.removeEventListener("directory-url-change", scheduleUpdateFromCurrentUrl);
    };
  }, [initialPage.basePath, initialPage.description, initialPage.title, initialQueryPreparation]);

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
