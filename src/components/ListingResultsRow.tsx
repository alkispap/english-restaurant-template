"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Navigation
} from "lucide-react";
import { DirectoryImage } from "@/components/DirectoryImage";
import { GoogleIcon } from "@/components/GoogleIcon";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { RatingPill } from "@/components/RatingPill";
import { SaveListingButton } from "@/components/SaveListingButton";
import { directoryConfig } from "@/config/directory";
import type { Listing } from "@/data/listings";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { openStatus } from "@/lib/opening-hours";
import { categoryPath, listingDetailPath } from "@/lib/routes";
import { slugify } from "@/lib/slug";
import { buildListingImageAlt } from "@/lib/listing-image-alt";

type ListingResultsRowProps = {
  listing: Listing;
  rank: number;
};

export function ListingResultsRow({ listing, rank }: ListingResultsRowProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const imageCount = listing.images.length;
  const hasCarousel = imageCount > 1;
  const currentImageIndex = imageCount ? imageIndex % imageCount : 0;
  const image = listing.images[currentImageIndex];
  const detailHref = listingDetailPath(listing.slug);
  const location = [listing.neighborhood, listing.area].filter(Boolean).join(", ");
  const summaryItems = [
    listing.categories.slice(0, 2).join(", "),
    listing.priceLevel,
    location
  ].filter(Boolean);
  const featureChips = getFeatureChips(listing);
  const websiteHref = listing.contact?.website;
  const directionsHref = getDirectionsHref(listing);
  const workingHours = listing.details?.workingHours;
  const statusBorderClass = isOpen === null ? "border-line" : isOpen ? "border-emerald-500" : "border-red-500";

  useEffect(() => {
    if (!workingHours?.length) {
      setIsOpen(null);
      return;
    }

    setIsOpen(openStatus(workingHours).isOpen);

    const interval = setInterval(() => {
      setIsOpen(openStatus(workingHours).isOpen);
    }, 60_000);

    return () => clearInterval(interval);
  }, [workingHours]);

  function goToPreviousImage(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex((current) => (current - 1 + imageCount) % imageCount);
  }

  function goToNextImage(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setImageIndex((current) => (current + 1) % imageCount);
  }

  return (
    <article className={`overflow-hidden rounded-lg border-2 ${statusBorderClass} bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl`}>
      <div className="grid md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_160px]">
        <div className="relative min-h-[210px] overflow-hidden bg-orange-50 md:min-h-full">
          <Link href={detailHref} className="block h-full min-h-[210px]">
            <DirectoryImage
              key={image ?? "fallback"}
              src={image}
              alt={buildListingImageAlt(listing, { variant: "card", index: currentImageIndex })}
              fill
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 240px, 100vw"
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
              fallbackLabel={listing.imageFallbackLabel}
            />
          </Link>

          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-slate-900 shadow-soft">
            #{rank}
          </div>

          {isDirectoryFeatureEnabled("shortlist") ? (
            <SaveListingButton
              slug={listing.slug}
              compact
              className="listing-image-save absolute right-3 top-3 h-10 w-10 rounded-full bg-white/95 p-0 !text-slate-900 shadow-soft"
            />
          ) : null}

          {hasCarousel ? (
            <>
              <button
                type="button"
                className="focus-ring absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-soft ring-1 ring-black/5 transition hover:bg-white"
                aria-label={`Show previous image for ${listing.name}`}
                onClick={goToPreviousImage}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className="focus-ring absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-soft ring-1 ring-black/5 transition hover:bg-white"
                aria-label={`Show next image for ${listing.name}`}
                onClick={goToNextImage}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-white">
                {currentImageIndex + 1} / {imageCount}
              </div>
            </>
          ) : null}
        </div>

        <div className="min-w-0 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={detailHref} className="text-xl font-bold text-ink transition hover:text-primary">
                {listing.name}
              </Link>
              {isDirectoryFeatureEnabled("trustBadges") && listing.details?.googleVerified ? (
                <span className="ml-2 inline-flex translate-y-0.5 items-center gap-1" title={directoryConfig.detailLabels.trustBadge}>
                  <GoogleIcon className="h-4 w-4" />
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                </span>
              ) : null}
            </div>
            {listing.rating ? (
              <RatingPill rating={listing.rating} reviewCount={listing.reviewCount} href={listing.contact?.googleReviewsUrl} />
            ) : null}
          </div>

          {summaryItems.length ? (
            <p className="mt-2 text-sm font-semibold text-muted">{summaryItems.join(" · ")}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <OpenStatusBadge workingHours={listing.details?.workingHours} compact />
            {listing.categories.slice(0, 3).map((category) => (
              <Link
                key={category}
                href={categoryPath(slugify(category))}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-accent transition hover:bg-orange-100"
              >
                {category}
              </Link>
            ))}
          </div>

          {listing.description ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{listing.description}</p>
          ) : null}

          {featureChips.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {featureChips.map((chip) => (
                <span key={chip} className="rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 xl:hidden">
            <RowActions detailHref={detailHref} websiteHref={websiteHref} directionsHref={directionsHref} />
          </div>
        </div>

        <div className="hidden border-l border-line p-4 xl:flex xl:flex-col xl:justify-between xl:gap-4">
          {listing.fullAddress || listing.address ? (
            <p className="flex gap-2 text-sm leading-5 text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{listing.fullAddress ?? listing.address}</span>
            </p>
          ) : (
            <span />
          )}
          <div className="grid gap-2">
            <RowActions detailHref={detailHref} websiteHref={websiteHref} directionsHref={directionsHref} />
          </div>
        </div>
      </div>
    </article>
  );
}

function RowActions({
  detailHref,
  websiteHref,
  directionsHref
}: {
  detailHref: string;
  websiteHref?: string;
  directionsHref?: string;
}) {
  return (
    <>
      <Link
        href={detailHref}
        className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        View details
      </Link>
      {websiteHref ? (
        <a
          href={websiteHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-primary hover:text-primary"
        >
          Website
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
      {directionsHref ? (
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-primary hover:text-primary"
        >
          Directions
          <Navigation className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </>
  );
}

function getFeatureChips(listing: Listing) {
  const candidates = [
    ...(listing.details?.highlights ?? []),
    ...(listing.details?.diningOptions ?? []),
    ...listing.dietaryOptions,
    ...(listing.details?.serviceOptions ?? [])
  ];

  return Array.from(new Set(candidates.filter(Boolean))).slice(0, 5);
}

function getDirectionsHref(listing: Listing) {
  if (listing.location?.googleMapsUrl) return listing.location.googleMapsUrl;

  const latitude = listing.location?.latitude;
  const longitude = listing.location?.longitude;
  if (latitude && longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  const address = listing.fullAddress ?? listing.address;
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return undefined;
}
