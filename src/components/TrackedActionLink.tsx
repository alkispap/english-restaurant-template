"use client";

import type { ReactNode } from "react";
import {
  trackDirectoryEvent,
  type DirectoryEventAction,
  type DirectoryPageType
} from "@/lib/directory-analytics";
import { cleanListingUrl } from "@/lib/listing-links";

type TrackedActionLinkProps = {
  href?: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
  pageType: DirectoryPageType;
  action: DirectoryEventAction;
  route?: string;
  listingSlug?: string;
};

export function TrackedActionLink({
  href,
  label,
  icon,
  primary = false,
  pageType,
  action,
  route,
  listingSlug
}: TrackedActionLinkProps) {
  const safeHref = cleanListingUrl(href);
  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target={safeHref.startsWith("http") ? "_blank" : undefined}
      rel={safeHref.startsWith("http") ? "noreferrer" : undefined}
      onClick={() =>
        trackDirectoryEvent({
          pageType,
          action,
          route,
          listingSlug,
          label,
          targetUrl: safeHref
        })
      }
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${
        primary ? "bg-primary text-white" : "border border-line text-ink"
      }`}
    >
      {label} {icon}
    </a>
  );
}
