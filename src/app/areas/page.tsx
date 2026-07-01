import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SearchableCardGrid } from "@/components/SearchableCardGrid";
import { directoryConfig } from "@/config/directory";
import { getAreaDirectoryCards } from "@/lib/area-guide";
import { areasIndexHeadings } from "@/lib/areas-index-headings";
import { getPopularSearches } from "@/lib/directory-growth";
import { pageShareMetadata } from "@/lib/share-metadata";

const metadataTitle = "Indian Restaurants in London by Area";
const metadataDescription =
  "Browse Indian restaurants in London by area, then narrow by cuisine, rating, price, service options, and opening status.";

export const metadata: Metadata = {
  title: metadataTitle,
  description: metadataDescription,
  alternates: {
    canonical: "/areas"
  },
  ...pageShareMetadata({ title: metadataTitle, description: metadataDescription, path: "/areas" })
};

export default function AreasPage() {
  const areas = getAreaDirectoryCards(100);
  const searches = getPopularSearches().slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">Area directory</p>
        <h1 className="text-4xl font-bold text-ink">{areasIndexHeadings.heroTitle}</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Start with a London area, then compare matching {directoryConfig.listingPluralLabel.toLowerCase()} by
          rating, cuisine, price, service options, and opening details.
        </p>
      </section>

      <section aria-labelledby="area-directory-heading">
        <h2 id="area-directory-heading" className="text-2xl font-bold text-ink">
          {areasIndexHeadings.directoryTitle}
        </h2>
        <SearchableCardGrid
          items={areas}
          searchPlaceholder="Search areas"
          emptyMessage="No areas match this search."
          alphabetLabel="Filter areas by first letter"
          className="mt-5"
        />
      </section>

      {searches.length ? (
        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-2xl font-bold text-ink">{areasIndexHeadings.popularSearchesTitle}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {searches.map((search) => (
              <Link
                key={search.href}
                href={search.href}
                className="inline-flex items-start justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-ink hover:bg-orange-50 hover:text-accent"
              >
                {search.title}
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
