import { FilterPanel } from "@/components/FilterPanel";
import { ListingsResults } from "@/components/ListingsResults";
import { SearchBar } from "@/components/SearchBar";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { DirectoryListingRows } from "@/components/DirectoryListingRows";
import { HomepageSeoLinks } from "@/components/HomepageSeoLinks";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { homepageHeadings } from "@/lib/homepage-headings";
import { filterListings, SortKey } from "@/lib/directory";
import { isOpenNow } from "@/lib/opening-hours";
import {
  LISTINGS_PAGE_SIZE,
  mapPointsFromListings,
  paginateListings,
  type ListingsPageLinkValues,
  type ListingsViewMode
} from "@/lib/listings-page";
import { getDirectoryListingsPageRows, getHomepageSourceContextGuide } from "@/lib/directory-ux";

export type DirectoryListingsSearchParams = Record<string, string | string[] | undefined>;

type DirectoryListingsPageProps = {
  searchParams: DirectoryListingsSearchParams;
  basePath?: string;
  title?: string;
  description?: string;
};

export function DirectoryListingsPage({
  searchParams,
  basePath,
  title = `Find ${directoryConfig.listingPluralLabel.toLowerCase()} in ${siteConfig.cityOrRegion}`,
  description = `Search the imported directory dataset and refine by area, ${directoryConfig.categoryLabel.toLowerCase()}, ${directoryConfig.filterLabels.type.toLowerCase()}, features, price, and rating.`
}: DirectoryListingsPageProps) {
  const filters = {
    q: single(searchParams.q),
    area: multi(searchParams.area),
    neighborhood: multi(searchParams.neighborhood),
    category: multi(searchParams.category) ?? multi(searchParams.cuisine),
    type: multi(searchParams.type),
    dietary: multi(searchParams.dietary),
    service: multi(searchParams.service),
    offering: multi(searchParams.offering),
    highlight: multi(searchParams.highlight),
    popularFor: multi(searchParams.popularFor),
    dining: multi(searchParams.dining),
    amenity: multi(searchParams.amenity),
    accessibility: multi(searchParams.accessibility),
    atmosphere: multi(searchParams.atmosphere),
    crowd: multi(searchParams.crowd),
    planning: multi(searchParams.planning),
    payment: multi(searchParams.payment),
    children: multi(searchParams.children),
    parking: multi(searchParams.parking),
    pets: multi(searchParams.pets),
    tube: multi(searchParams.tube),
    bus: multi(searchParams.bus),
    nearby: multi(searchParams.nearby),
    price: multi(searchParams.price),
    rating: numeric(single(searchParams.rating)),
    sort: asSort(single(searchParams.sort))
  };
  const openOnly = single(searchParams.open) === "1";
  const viewMode = asViewMode(single(searchParams.view));
  const requestedPage = numeric(single(searchParams.page)) ?? 1;
  const filteredResults = filterListings(filters);
  const results = openOnly
    ? filteredResults.filter((listing) => isOpenNow(listing.details?.workingHours))
    : filteredResults;
  const page = paginateListings(results, requestedPage, LISTINGS_PAGE_SIZE);
  const linkValues: ListingsPageLinkValues = {
    ...filters,
    basePath,
    rating: filters.rating ? String(filters.rating) : undefined,
    open: openOnly,
    view: viewMode,
    page: page.currentPage
  };
  const filterPanelValues = {
    ...filters,
    basePath,
    rating: filters.rating ? String(filters.rating) : undefined,
    open: openOnly,
    view: viewMode
  };
  const relatedRows = getDirectoryListingsPageRows(page.items);
  const sourceContextGuide = basePath === "/" ? getHomepageSourceContextGuide() : null;
  const sidebarContext = basePath === "/" ? "homepage" : "default";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-lg border border-line bg-white p-5 shadow-soft">
        <h1 className="text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6">
          <SearchBar compact defaultQuery={filters.q} defaultArea={first(filters.area)} basePath={basePath} />
        </div>
      </div>
      {basePath === "/" ? <HomepageSeoLinks /> : null}
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <details className="rounded-lg border border-line bg-white p-4 shadow-soft lg:hidden">
            <summary className="cursor-pointer text-sm font-bold text-ink">Filters</summary>
            <div className="mt-5">
              <FilterPanel values={filterPanelValues} />
            </div>
          </details>
          <div className="hidden lg:block">
            <FilterPanel values={filterPanelValues} />
            <DirectorySidebar context={sidebarContext} />
          </div>
        </aside>
        <div className="min-w-0">
          <ListingsResults
            listings={page.items}
            mapPoints={viewMode === "map" ? mapPointsFromListings(results) : []}
            totalCount={results.length}
            currentPage={page.currentPage}
            pageSize={page.pageSize}
            totalPages={page.totalPages}
            viewMode={viewMode}
            openOnly={openOnly}
            linkValues={linkValues}
            headingContext={basePath === "/" ? homepageHeadings.resultsHeadingContext : undefined}
          />
          {sourceContextGuide ? (
            <section className="mt-10 rounded-lg border border-line bg-slate-50 p-5">
              <h2 className="text-lg font-bold text-ink">{sourceContextGuide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{sourceContextGuide.intro}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {sourceContextGuide.points.map((point) => (
                  <div key={point.title} className="text-sm leading-6 text-muted">
                    <h3 className="font-bold text-ink">{point.title}</h3>
                    <p className="mt-1">{point.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <DirectoryListingRows rows={relatedRows} className="mt-12" />
        </div>
      </div>
    </main>
  );
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function multi(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value || undefined;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numeric(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asSort(value?: string): SortKey | undefined {
  return value === "rating" || value === "reviews" || value === "price" || value === "featured" ? value : undefined;
}

function asViewMode(value?: string): ListingsViewMode {
  return value === "map" ? "map" : "grid";
}
