import { Fragment } from "react";
import { AdsterraAd } from "@/components/AdsterraAd";
import { ListingResultsRow } from "@/components/ListingResultsRow";
import type { ListingResultSummary } from "@/lib/listings-page";

type ListingResultsListProps = {
  listings: ListingResultSummary[];
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
        <Fragment key={listing.slug}>
          <ListingResultsRow listing={listing} rank={firstRank + index} />
          {index === 2 || index === 7 ? (
            <div className="py-2">
              <AdsterraAd placement="300x250" />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
