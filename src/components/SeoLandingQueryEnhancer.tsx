"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  captureDirectoryQuerySnapshot
} from "@/lib/directory-listings-search-params";
import type { SeoLandingResultsShell } from "@/components/SeoLandingResultsShell";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import { getSeoLandingHiddenFilterGroups } from "@/lib/seo-landing-filter-context";
import { directoryConfig } from "@/config/directory";
import { prefetchDirectorySearchData } from "@/lib/directory-search-data-request";

type SeoLandingResultsShellComponent = typeof SeoLandingResultsShell;
type SeoLandingBrowserModule = typeof import("@/lib/seo-landing-listings-browser");
type SeoLandingResultsShellModule = typeof import("@/components/SeoLandingResultsShell");

type SeoLandingQueryEnhancerProps = {
  initialPage: {
    kind: string;
    metadata: {
      canonical: string;
    };
    hero: {
      title: string;
      description: string;
    };
    resultsHeadingContext?: string;
    definingContext?: {
      key: "neighborhood" | "type" | "dietary" | "service" | "offering";
    };
  };
};

let seoLandingClientModulesPromise: Promise<[SeoLandingBrowserModule, SeoLandingResultsShellModule]> | null = null;

if (typeof window !== "undefined") {
  const { normalizedQuery } = captureDirectoryQuerySnapshot(window.location);
  if (normalizedQuery) {
    void prefetchDirectorySearchData().catch(() => undefined);
    void import("@/lib/directory-search-runtime-browser")
      .then((runtime) => runtime.loadBrowserDirectorySearchRuntime())
      .catch(() => undefined);
  }
}

function loadSeoLandingClientModules() {
  seoLandingClientModulesPromise ??= Promise.all([
    import("@/lib/seo-landing-listings-browser"),
    import("@/components/SeoLandingResultsShell")
  ]);
  return seoLandingClientModulesPromise;
}

export function SeoLandingQueryEnhancer({ initialPage }: SeoLandingQueryEnhancerProps) {
  const [activeModel, setActiveModel] = useState<DirectoryListingsModel | null>(null);
  const [ActiveResultsShell, setActiveResultsShell] = useState<SeoLandingResultsShellComponent | null>(null);
  const [clientResultsRoot, setClientResultsRoot] = useState<HTMLElement | null>(null);
  const [queryBusy, setQueryBusy] = useState(false);
  const [queryMessage, setQueryMessage] = useState("");
  const [queryError, setQueryError] = useState(false);
  const hiddenGroups = getSeoLandingHiddenFilterGroups(initialPage);

  useEffect(() => {
    let intentTimer: number | null = null;

    function handleDirectoryIntent(event: Event) {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-directory-query-intent="true"]')) {
        if (intentTimer !== null) return;
        intentTimer = window.setTimeout(() => {
          intentTimer = null;
          void prefetchDirectorySearchData().catch(() => undefined);
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
    const serverResults = document.getElementById("seo-landing-server-results");
    if (serverResults) {
      serverResults.hidden = activeModel !== null;
      serverResults.style.display = activeModel !== null ? "none" : "";
    }

    return () => {
      if (serverResults) {
        serverResults.hidden = false;
        serverResults.style.display = "";
      }
    };
  }, [activeModel]);

  useEffect(() => {
    const results = [
      document.getElementById("seo-landing-server-results"),
      document.getElementById("seo-landing-client-results")
    ].filter((element): element is HTMLElement => Boolean(element));

    results.forEach((element) => element.setAttribute("aria-busy", String(queryBusy)));
    return () => results.forEach((element) => element.removeAttribute("aria-busy"));
  }, [activeModel, queryBusy]);

  useEffect(() => {
    setClientResultsRoot(document.getElementById("seo-landing-client-results-root"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pendingUpdateTimer: number | null = null;
    let lastHandledUrl: string | null = null;
    let requestVersion = 0;

    async function updateFromCurrentUrl() {
      const {
        href: currentUrl,
        pathname,
        searchParams: currentParams,
        normalizedQuery: nextQuery
      } = captureDirectoryQuerySnapshot(window.location);
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
        const [{ buildBrowserSeoLandingListingsModel }, shellModule] = await loadSeoLandingClientModules();
        if (cancelled || version !== requestVersion) return;

        const nextModel = await buildBrowserSeoLandingListingsModel({
          pathname,
          searchParams: currentParams,
          basePath: initialPage.metadata.canonical,
          title: initialPage.hero.title,
          description: initialPage.hero.description,
          headingContext: initialPage.resultsHeadingContext
        }) ?? null;
        if (cancelled || version !== requestVersion) return;
        setActiveResultsShell(() => shellModule.SeoLandingResultsShell);
        setActiveModel(nextModel);
        setQueryMessage(
          nextModel
            ? `${nextModel.totalCount.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} updated.`
            : "Filters cleared."
        );
      } catch {
        if (cancelled || version !== requestVersion) return;
        seoLandingClientModulesPromise = null;
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
      window.dispatchEvent(new Event("seo-landing-url-change"));
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("seo-landing-url-change"));
      return result;
    };

    void updateFromCurrentUrl();
    window.addEventListener("popstate", scheduleUpdateFromCurrentUrl);
    window.addEventListener("seo-landing-url-change", scheduleUpdateFromCurrentUrl);

    return () => {
      cancelled = true;
      if (pendingUpdateTimer !== null) {
        window.clearTimeout(pendingUpdateTimer);
      }
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", scheduleUpdateFromCurrentUrl);
      window.removeEventListener("seo-landing-url-change", scheduleUpdateFromCurrentUrl);
    };
  }, [initialPage.hero.description, initialPage.hero.title, initialPage.metadata.canonical, initialPage.resultsHeadingContext]);

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
      {activeModel && ActiveResultsShell && clientResultsRoot
        ? createPortal(
            <ActiveResultsShell
              model={activeModel}
              hiddenGroups={[...hiddenGroups]}
              definingContextKey={initialPage.definingContext?.key}
            />,
            clientResultsRoot
          )
        : null}
    </>
  );
}
