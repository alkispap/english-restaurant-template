import { SearchBarClient } from "@/components/SearchBarClient";
import type { SearchAreaOption } from "@/lib/directory-listings-types";
import type { MapPoint } from "@/lib/listings-page";

type SearchBarProps = {
  compact?: boolean;
  defaultQuery?: string;
  defaultArea?: string;
  basePath?: string;
  areas: SearchAreaOption[];
  mapPoints: MapPoint[];
};

export function SearchBar({ compact = false, defaultQuery = "", defaultArea = "", basePath, areas, mapPoints }: SearchBarProps) {
  return (
    <SearchBarClient
      compact={compact}
      defaultQuery={defaultQuery}
      defaultArea={defaultArea}
      basePath={basePath}
      areas={areas}
      mapPoints={mapPoints}
    />
  );
}
