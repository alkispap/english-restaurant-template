import { MapPin, Search } from "lucide-react";
import { LocateAreaButton } from "@/components/LocateAreaButton";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { directorySearchPath } from "@/lib/routes";
import type { AreaCentroid } from "@/lib/geo-area";
import type { SearchAreaOption } from "@/lib/directory-listings-types";

type SearchBarProps = {
  compact?: boolean;
  defaultQuery?: string;
  defaultArea?: string;
  basePath?: string;
  areas: SearchAreaOption[];
  areaCentroids: AreaCentroid[];
  hideAreaChoice?: boolean;
};

export function SearchBar({
  compact = false,
  defaultQuery = "",
  defaultArea = "",
  basePath = directorySearchPath(),
  areas,
  areaCentroids,
  hideAreaChoice = false
}: SearchBarProps) {
  const gridClass = hideAreaChoice
    ? "md:grid-cols-[1fr_auto]"
    : compact
      ? "md:grid-cols-[1fr_180px_auto]"
      : "md:grid-cols-[1fr_220px_auto]";

  return (
    <div className="rounded-lg bg-white p-3 shadow-soft">
      <form
        action={basePath}
        method="get"
        className={`grid gap-3 ${gridClass}`}
      >
        <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
          <Search className="h-5 w-5 text-primary" aria-hidden />
          <span className="sr-only">Search keywords</span>
          <input
            name="q"
            defaultValue={defaultQuery}
            placeholder={`${directoryConfig.listingLabel}, category, keyword...`}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        {hideAreaChoice ? null : (
          <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            <span className="sr-only">Choose area</span>
            <select name="area" defaultValue={defaultArea} className="w-full bg-transparent text-sm text-ink outline-none">
              <option value="">All {siteConfig.cityOrRegion}</option>
              {areas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="focus-ring rounded-md bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
          Search
        </button>
      </form>
      {hideAreaChoice ? null : <LocateAreaButton areaCentroids={areaCentroids} basePath={basePath} />}
    </div>
  );
}
