import { ListingRowSection } from "@/components/ListingRowSection";
import type { DirectoryListingRowSummary } from "@/lib/listings-page";

type DirectoryListingRowsProps = {
  rows: DirectoryListingRowSummary[];
  className?: string;
};

export function DirectoryListingRows({ rows, className = "" }: DirectoryListingRowsProps) {
  if (!rows.length) return null;

  return (
    <div className={className}>
      {rows.map((row) => (
        <ListingRowSection key={row.id} row={row} />
      ))}
    </div>
  );
}
