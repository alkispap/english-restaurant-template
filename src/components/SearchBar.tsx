import { getAreas, slugify } from "@/lib/directory";
import { SearchBarClient } from "@/components/SearchBarClient";
import { listings } from "@/data/listings";
import { mapPointsFromListings } from "@/lib/listings-page";

type SearchBarProps = {
  compact?: boolean;
  defaultQuery?: string;
  defaultArea?: string;
  basePath?: string;
};

export function SearchBar({ compact = false, defaultQuery = "", defaultArea = "", basePath }: SearchBarProps) {
  const areas = getAreas();

  return (
    <SearchBarClient
      compact={compact}
      defaultQuery={defaultQuery}
      defaultArea={defaultArea}
      basePath={basePath}
      areas={areas.map((area) => ({ label: area, value: slugify(area) }))}
      mapPoints={mapPointsFromListings(listings)}
    />
  );
}
