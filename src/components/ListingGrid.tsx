import Link from "next/link";
import { DirectoryImage } from "@/components/DirectoryImage";
import { RatingPill } from "@/components/RatingPill";
import { listingDetailPath } from "@/lib/routes";
import { buildListingImageAlt } from "@/lib/listing-image-alt";

export type RelatedListingCard = {
  slug: string;
  name: string;
  image?: string;
  imageFallbackLabel?: string;
  category?: string;
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
};

type ListingGridProps = {
  listings: RelatedListingCard[];
};

export function ListingGrid({ listings }: ListingGridProps) {
  if (!listings.length) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-muted">
        No listings match these filters yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,260px))] justify-center gap-4">
      {listings.map((listing) => {
        const categoryLine = [listing.category, listing.priceLevel].filter(Boolean).join(" - ");

        return (
          <article key={listing.slug} className="overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:shadow-xl">
            <Link href={listingDetailPath(listing.slug)} className="block">
              <div className="relative aspect-[16/11] overflow-hidden bg-orange-50">
                <DirectoryImage
                  src={listing.image}
                  alt={buildListingImageAlt({ name: listing.name, categories: listing.category ? [listing.category] : undefined }, { variant: "card", index: 0 })}
                  fill
                  sizes="260px"
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  fallbackLabel={listing.imageFallbackLabel}
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-bold text-ink">{listing.name}</h3>
                  {listing.rating ? <RatingPill rating={listing.rating} /> : null}
                </div>
                {categoryLine ? (
                  <p className="line-clamp-1 text-sm text-muted">
                    {categoryLine}
                  </p>
                ) : null}
                {listing.reviewCount ? (
                  <p className="text-sm text-muted">{listing.reviewCount.toLocaleString()} Google reviews</p>
                ) : null}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
