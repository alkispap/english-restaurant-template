"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ListingNavTab } from "@/lib/listing-detail-nav";
import { areaPath, directoryIndexPath } from "@/lib/routes";
import { slugify } from "@/lib/slug";
import { siteConfig } from "@/config/site";
import { SaveListingButton } from "@/components/SaveListingButton";
import { ShareButton } from "@/components/ShareButton";

export type MobileChromeListing = {
  slug: string;
  name: string;
  area?: string;
  categories: string[];
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
};

type ListingDetailMobileChromeProps = {
  listing: MobileChromeListing;
  tabs: ListingNavTab[];
  shareUrl: string;
  route: string;
};

const compactShareClassName = "h-10 w-10 rounded-full p-0 [&_span]:sr-only";

export function ListingDetailMobileChrome({ listing, tabs, shareUrl, route }: ListingDetailMobileChromeProps) {
  const [showStickyAreaBar, setShowStickyAreaBar] = useState(false);
  const areaHref = listing.area ? areaPath(slugify(listing.area)) : directoryIndexPath();
  const areaLabel = listing.area ?? siteConfig.cityOrRegion;
  const categories = [
    ...listing.categories.slice(0, 2),
    listing.priceLevel
  ].filter(Boolean);

  useEffect(() => {
    function handleScroll() {
      setShowStickyAreaBar(window.scrollY > 140);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="md:hidden">
      <div
        className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-white shadow-sm transition-transform duration-200 ${
          showStickyAreaBar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <AreaBackLink href={areaHref} label={areaLabel} compact />
          <div className="flex shrink-0 items-center gap-2">
            <SaveListingButton
              slug={listing.slug}
              compact
              className="h-10 w-10 rounded-full p-0"
              pageType="listing_detail"
              route={route}
            />
            <ShareButton
              title={listing.name}
              text={`Check out ${listing.name} on ${siteConfig.siteName}!`}
              url={shareUrl}
              className={compactShareClassName}
              pageType="listing_detail"
              route={route}
              listingSlug={listing.slug}
            />
          </div>
        </div>
      </div>

      <section className="border-b border-line bg-white px-4 pb-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <AreaBackLink href={areaHref} label={areaLabel} />
          <div className="flex shrink-0 items-center gap-2">
            <SaveListingButton
              slug={listing.slug}
              compact
              className="h-10 w-10 rounded-full p-0"
              pageType="listing_detail"
              route={route}
            />
            <ShareButton
              title={listing.name}
              text={`Check out ${listing.name} on ${siteConfig.siteName}!`}
              url={shareUrl}
              className={compactShareClassName}
              pageType="listing_detail"
              route={route}
              listingSlug={listing.slug}
            />
          </div>
        </div>

        <p className="mt-5 text-[2rem] font-extrabold leading-tight text-ink">{listing.name}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink">
          {listing.rating ? <span>{listing.rating.toFixed(1)}</span> : null}
          {listing.rating ? <RatingDots rating={listing.rating} /> : null}
          {listing.reviewCount ? (
            <a href="#reviews" className="font-medium underline underline-offset-2">
              ({listing.reviewCount.toLocaleString()} reviews)
            </a>
          ) : null}
        </div>
        {categories.length ? (
          <p className="mt-3 text-base leading-7 text-muted">{categories.join(" · ")}</p>
        ) : null}
      </section>

      <nav className="sticky top-0 z-30 flex gap-8 overflow-x-auto border-b border-line bg-white px-4 shadow-sm scrollbar-hide">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="inline-flex h-14 shrink-0 items-center border-b-2 border-transparent text-base font-bold text-ink first:border-secondary"
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function AreaBackLink({ href, label, compact = false }: { href: string; label: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-w-0 items-center gap-1 font-medium text-ink ${
        compact ? "text-sm" : "text-base"
      }`}
    >
      <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
      <span className="truncate">See all restaurants in {label}</span>
    </Link>
  );
}

function RatingDots({ rating }: { rating: number }) {
  const filled = Math.round(rating);

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <span
          key={dot}
          className={`h-4 w-4 rounded-full ${dot <= filled ? "bg-secondary" : "bg-slate-200"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}
