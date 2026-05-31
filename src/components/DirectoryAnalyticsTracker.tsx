"use client";

import { useEffect } from "react";
import {
  trackDirectoryEvent,
  type DirectoryPageType
} from "@/lib/directory-analytics";

type DirectoryAnalyticsTrackerProps = {
  pageType: DirectoryPageType;
  route: string;
  listingSlug?: string;
};

export function DirectoryAnalyticsTracker({ pageType, route, listingSlug }: DirectoryAnalyticsTrackerProps) {
  useEffect(() => {
    trackDirectoryEvent({
      pageType,
      action: pageType === "listing_detail" ? "listing_view" : "page_view",
      route,
      listingSlug
    });
  }, [listingSlug, pageType, route]);

  return null;
}
