"use client";

import { useEffect, useState } from "react";
import {
  normalizeSearchParams,
  searchParamsRecordFromUrlSearchParams
} from "@/lib/directory-listings-search-params";
import type { SeoPageModel } from "@/lib/seo-pages";

type SeoLandingContentComponent = typeof import("@/components/SeoLandingPageContent").SeoLandingPageContent;
type SeoLandingBrowserModule = typeof import("@/lib/seo-landing-browser");
type SeoLandingContentModule = typeof import("@/components/SeoLandingPageContent");

type SeoLandingQueryEnhancerProps = {
  initialPage: SeoPageModel;
};

let seoLandingClientModulesPromise: Promise<[SeoLandingBrowserModule, SeoLandingContentModule]> | null = null;

function loadSeoLandingClientModules() {
  seoLandingClientModulesPromise ??= Promise.all([
    import("@/lib/seo-landing-browser"),
    import("@/components/SeoLandingPageContent")
  ]);
  return seoLandingClientModulesPromise;
}

export function SeoLandingQueryEnhancer({ initialPage }: SeoLandingQueryEnhancerProps) {
  const [activePage, setActivePage] = useState<SeoPageModel | null>(null);
  const [ActiveContent, setActiveContent] = useState<SeoLandingContentComponent | null>(null);

  useEffect(() => {
    const serverMain = document.getElementById("seo-landing-server-main");
    if (serverMain) serverMain.hidden = activePage !== null;

    return () => {
      if (serverMain) serverMain.hidden = false;
    };
  }, [activePage]);

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
        setActivePage(null);
        return;
      }

      const [{ buildBrowserSeoLandingPage }, contentModule] = await loadSeoLandingClientModules();
      if (cancelled || version !== requestVersion) return;

      setActiveContent(() => contentModule.SeoLandingPageContent);
      setActivePage(
        buildBrowserSeoLandingPage({
          pathname: window.location.pathname,
          searchParams: currentParams
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
  }, [initialPage.metadata.canonical]);

  if (!activePage || !ActiveContent) return null;

  return <ActiveContent page={activePage} viewId="seo-landing-client-main" />;
}
