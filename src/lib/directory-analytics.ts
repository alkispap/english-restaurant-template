export const DIRECTORY_PAGE_TYPES = [
  "homepage",
  "listing_detail",
  "area_hub",
  "category_hub",
  "area_category_hub",
  "neighborhood_hub",
  "best_hub",
  "facet_hub",
  "compare"
] as const;

export const DIRECTORY_EVENT_ACTIONS = [
  "page_view",
  "listing_view",
  "website_click",
  "phone_click",
  "maps_click",
  "reviews_click",
  "reserve_click",
  "order_click",
  "appointment_click",
  "menu_click",
  "email_click",
  "save_listing",
  "remove_saved_listing",
  "share_open",
  "share_native",
  "share_social",
  "share_copy",
  "compare_open",
  "compare_listing_click",
  "compare_action_click"
] as const;

export type DirectoryPageType = (typeof DIRECTORY_PAGE_TYPES)[number];
export type DirectoryEventAction = (typeof DIRECTORY_EVENT_ACTIONS)[number];

export type DirectoryAnalyticsEvent = {
  pageType: DirectoryPageType;
  action: DirectoryEventAction;
  route?: string;
  listingSlug?: string;
  label?: string;
  targetUrl?: string;
};

declare global {
  interface Window {
    directoryAnalytics?: {
      track?: (event: DirectoryAnalyticsEvent) => void;
    };
  }
}

export function normalizeDirectoryAnalyticsEvent(event: DirectoryAnalyticsEvent): DirectoryAnalyticsEvent {
  return Object.fromEntries(
    Object.entries(event).filter(([, value]) => value !== undefined && value !== "")
  ) as DirectoryAnalyticsEvent;
}

export function trackDirectoryEvent(event: DirectoryAnalyticsEvent) {
  if (typeof window === "undefined") return;

  const normalized = normalizeDirectoryAnalyticsEvent(event);

  window.directoryAnalytics?.track?.(normalized);
  window.dispatchEvent(new window.CustomEvent("directory-analytics-event", { detail: normalized }));
}

export function inferDirectoryPageTypeFromPath(pathname: string): DirectoryPageType {
  if (pathname === "/") return "homepage";
  if (pathname === "/compare") return "compare";
  if (pathname.startsWith("/listings/")) return "listing_detail";
  if (/^\/areas\/[^/]+\/categories\/[^/]+/.test(pathname)) return "area_category_hub";
  if (pathname.startsWith("/areas/")) return "area_hub";
  if (pathname.startsWith("/categories/")) return "category_hub";
  if (pathname.startsWith("/neighborhoods/")) return "neighborhood_hub";
  if (pathname.startsWith("/best/")) return "best_hub";
  if (
    pathname.startsWith("/services/") ||
    pathname.startsWith("/dietary/") ||
    pathname.startsWith("/types/") ||
    pathname.startsWith("/offerings/")
  ) {
    return "facet_hub";
  }

  return "homepage";
}
