import Link from "next/link";
import { List, Map as MapIcon } from "lucide-react";
import { ListingMap } from "@/components/ListingMap";
import { ListingResultsList } from "@/components/ListingResultsList";
import { OpenNowResultsLink } from "@/components/OpenNowResultsLink";
import { SortSelect } from "@/components/SortSelect";
import { directoryConfig } from "@/config/directory";
import {
  buildListingsPageHref,
  type ListingResultSummary,
  type ListingsPageLinkValues,
  type ListingsViewMode,
  type MapPoint
} from "@/lib/listings-page";

type ListingsResultsProps = {
  listings: ListingResultSummary[];
  mapPoints: MapPoint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  viewMode: ListingsViewMode;
  openOnly: boolean;
  linkValues: ListingsPageLinkValues;
  headingContext?: string;
};

export function ListingsResults({
  listings,
  mapPoints,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  viewMode,
  openOnly,
  linkValues,
  headingContext
}: ListingsResultsProps) {
  const pluralLabel = directoryConfig.listingPluralLabel.toLowerCase();
  const headingText = headingContext
    ? `${totalCount.toLocaleString()} ${headingContext} Found`
    : `${totalCount.toLocaleString()} ${pluralLabel} found`;
  const showingStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            {headingText}
          </h2>
          <p className="text-sm text-muted">
            {viewMode === "map"
              ? `Showing ${mapPoints.length.toLocaleString()} map pins for the current filters.`
              : `Showing ${showingStart.toLocaleString()}-${showingEnd.toLocaleString()} of ${totalCount.toLocaleString()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OpenNowLink values={linkValues} openOnly={openOnly} />
          <SortSelect values={linkValues} />
          <ViewToggle values={linkValues} mode={viewMode} />
        </div>
      </div>

      {viewMode === "map" ? (
        <ListingMap listings={mapPoints} />
      ) : (
        <>
          <ListingResultsList listings={listings} currentPage={currentPage} pageSize={pageSize} />
          <Pagination values={linkValues} currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </section>
  );
}

function OpenNowLink({ values, openOnly }: { values: ListingsPageLinkValues; openOnly: boolean }) {
  return <OpenNowResultsLink href={buildListingsPageHref(values, { open: !openOnly, page: 1 })} active={openOnly} />;
}

function ViewToggle({ values, mode }: { values: ListingsPageLinkValues; mode: ListingsViewMode }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line shadow-soft">
      <Link
        href={buildListingsPageHref(values, { view: "grid", page: 1 })}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition ${
          mode === "grid"
            ? "bg-ink text-white"
            : "bg-white text-muted hover:text-ink"
        }`}
        aria-label="List view"
        aria-current={mode === "grid" ? "page" : undefined}
      >
        <List className="h-4 w-4" aria-hidden />
        List
      </Link>
      <Link
        href={buildListingsPageHref(values, { view: "map", page: 1 })}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition ${
          mode === "map"
            ? "bg-ink text-white"
            : "bg-white text-muted hover:text-ink"
        }`}
        aria-label="Map view"
        aria-current={mode === "map" ? "page" : undefined}
      >
        <MapIcon className="h-4 w-4" aria-hidden />
        Map
      </Link>
    </div>
  );
}

function Pagination({
  values,
  currentPage,
  totalPages
}: {
  values: ListingsPageLinkValues;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Listings pagination">
      <PageLink disabled={currentPage === 1} href={buildListingsPageHref(values, { page: previousPage })}>
        Previous
      </PageLink>
      <span className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft">
        Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
      </span>
      <PageLink disabled={currentPage === totalPages} href={buildListingsPageHref(values, { page: nextPage })}>
        Next
      </PageLink>
    </nav>
  );
}

function PageLink({ disabled, href, children }: { disabled: boolean; href: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-line bg-slate-100 px-6 py-3 text-sm font-bold text-muted">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="focus-ring rounded-lg border border-line bg-white px-6 py-3 text-sm font-bold text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
    >
      {children}
    </Link>
  );
}
