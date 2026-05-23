import type { Listing } from "@/data/listings";
import { ListingResultsRow } from "@/components/ListingResultsRow";

type ListingResultsListProps = {
  listings: Listing[];
  currentPage: number;
  pageSize: number;
};

export function ListingResultsList({ listings, currentPage, pageSize }: ListingResultsListProps) {
  if (!listings.length) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-muted">
        No listings match these filters yet.
      </div>
    );
  }

  const firstRank = (currentPage - 1) * pageSize + 1;

  return (
    <div className="grid gap-4">
      {listings.map((listing, index) => (
        <ListingResultsRow key={listing.slug} listing={listing} rank={firstRank + index} />
      ))}
    </div>
  );
}
