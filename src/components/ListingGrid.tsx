import type { Listing } from "@/data/listings";
import { ListingCard } from "@/components/ListingCard";

type ListingGridProps = {
  listings: Listing[];
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
      {listings.map((listing) => (
        <ListingCard key={listing.slug} listing={listing} compact />
      ))}
    </div>
  );
}
