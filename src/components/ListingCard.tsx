"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { DirectoryImage } from "@/components/DirectoryImage";
import { RatingPill } from "@/components/RatingPill";
import { GoogleIcon } from "@/components/GoogleIcon";
import { SaveListingButton } from "@/components/SaveListingButton";
import { directoryConfig } from "@/config/directory";
import type { Listing } from "@/data/listings";
import { openStatus } from "@/lib/opening-hours";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { slugify } from "@/lib/slug";
import { directoryIndexPath, listingDetailPath } from "@/lib/routes";
import { buildListingImageAlt } from "@/lib/listing-image-alt";

type ListingCardProps = {
  listing: Listing;
  compact?: boolean;
};

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const imageCount = listing.images.length;
  const hasCarousel = imageCount > 1;
  const currentImageIndex = imageCount ? imageIndex % imageCount : 0;
  const image = listing.images[currentImageIndex];
  const location = [listing.neighborhood, listing.area, listing.postcode].filter(Boolean).join(", ");
  const tags = [...listing.categories, ...listing.listingTypes, ...listing.dietaryOptions].slice(0, 4);
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
    <div className="h-full p-0.5">
      <div className="h-full transition">
        <article className={`group flex h-full flex-col rounded-lg border-2 ${statusBorderClass} overflow-hidden bg-white shadow-soft transition hover:shadow-xl`}>
      <div className={`relative overflow-hidden bg-orange-50 ${compact ? "aspect-[16/11]" : "aspect-[4/3]"}`}>
        <Link href={listingDetailPath(listing.slug)} className="block h-full">
          <DirectoryImage
            key={image ?? "fallback"}
            src={image}
            alt={buildListingImageAlt(listing, { variant: "card", index: currentImageIndex })}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            fallbackLabel={listing.imageFallbackLabel}
          />
        </Link>
        {listing.rating ? (
          <div className="absolute left-3 top-3">
            <RatingPill rating={listing.rating} />
          </div>
        ) : null}
        {listing.priceLevel ? (
          <div className="absolute right-14 top-3 rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold text-ink">
            {listing.priceLevel}
          </div>
        ) : null}
        {isDirectoryFeatureEnabled("shortlist") ? (
          <SaveListingButton slug={listing.slug} compact className="absolute right-3 top-3 h-9 w-9 bg-white/95 p-0 shadow-soft" />
        ) : null}
        {hasCarousel ? (
          <>
            <button
              type="button"
              className="focus-ring absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-soft ring-1 ring-black/5 transition hover:bg-white"
              aria-label={`Show previous image for ${listing.name}`}
              onClick={goToPreviousImage}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="focus-ring absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-soft ring-1 ring-black/5 transition hover:bg-white"
              aria-label={`Show next image for ${listing.name}`}
              onClick={goToNextImage}
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-bold text-white">
              {currentImageIndex + 1} / {imageCount}
            </div>
          </>
        ) : null}
      </div>
      <div className={compact ? "flex flex-1 flex-col space-y-2 p-4" : "flex flex-1 flex-col space-y-4 p-5"}>
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={listingDetailPath(listing.slug)} className={`${compact ? "line-clamp-2 text-base" : "text-lg"} font-bold text-ink hover:text-primary`}>
              {listing.name}
            </Link>
            {isDirectoryFeatureEnabled("trustBadges") && listing.details?.googleVerified ? (
              <div className="flex shrink-0 items-center gap-1 mt-1" title={directoryConfig.detailLabels.trustBadge}>
                <GoogleIcon className="h-4 w-4" />
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Verified" />
              </div>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <OpenStatusBadge workingHours={listing.details?.workingHours} compact />
          </div>
          {!compact && listing.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{listing.description}</p>
          ) : null}
        </div>
        {!compact && tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={listing.categories.includes(tag) ? `/categories/${slugify(tag)}` : directoryIndexPath(`?q=${encodeURIComponent(tag)}`)}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-accent"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="mt-auto grid gap-2 text-sm text-muted">
          {!compact && location ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              {location}
            </span>
          ) : null}
          {compact && listing.categories.length ? (
            <span className="line-clamp-1">
              {[listing.categories[0], listing.priceLevel].filter(Boolean).join(" · ")}
            </span>
          ) : null}
          {listing.reviewCount ? (
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" aria-hidden />
              {listing.reviewCount.toLocaleString()} Google reviews
            </span>
          ) : null}
        </div>
      </div>
        </article>
      </div>
    </div>
  );
}
