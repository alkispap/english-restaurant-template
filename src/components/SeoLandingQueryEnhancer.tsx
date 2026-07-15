"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { SeoLandingResultsShell } from "@/components/SeoLandingResultsShell";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";
import { getSeoLandingHiddenFilterGroups } from "@/lib/seo-landing-filter-context";

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
  const hiddenGroups = getSeoLandingHiddenFilterGroups(initialPage);

  useEffect(() => {
    const serverResults = document.getElementById("seo-landing-server-results");
    if (serverResults) serverResults.hidden = activeModel !== null;

    return () => {
      if (serverResults) serverResults.hidden = false;
    };
  }, [activeModel]);

  useEffect(() => {
    setClientResultsRoot(document.getElementById("seo-landing-client-results-root"));
  }, []);

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

      const [{ buildBrowserSeoLandingListingsModel }, shellModule] = await loadSeoLandingClientModules();
      if (cancelled || version !== requestVersion) return;

      setActiveResultsShell(() => shellModule.SeoLandingResultsShell);
      setActiveModel(
        buildBrowserSeoLandingListingsModel({
          pathname: window.location.pathname,
          searchParams: currentParams,
          basePath: initialPage.metadata.canonical,
          title: initialPage.hero.title,
          description: initialPage.hero.description,
          headingContext: initialPage.resultsHeadingContext
        }) ?? null
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

  if (!activeModel || !ActiveResultsShell || !clientResultsRoot) return null;

  return createPortal(
    <ActiveResultsShell
      model={activeModel}
      hiddenGroups={[...hiddenGroups]}
      definingContextKey={initialPage.definingContext?.key}
    />,
    clientResultsRoot
  );
}
