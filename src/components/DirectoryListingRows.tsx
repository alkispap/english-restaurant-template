import { ListingRowSection } from "@/components/ListingRowSection";
import type { DirectoryListingRow } from "@/lib/directory-ux";

type DirectoryListingRowsProps = {
  rows: DirectoryListingRow[];
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
