import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SearchableCardGrid } from "@/components/SearchableCardGrid";
import { getPopularSearches } from "@/lib/directory-growth";
import type { SearchableDirectoryCard } from "@/lib/searchable-card-filter";

type DirectoryIndexPageProps = {
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  directoryTitle: string;
  popularSearchesTitle: string;
  items: SearchableDirectoryCard[];
  searchPlaceholder: string;
  emptyMessage: string;
  alphabetLabel: string;
};

export function DirectoryIndexPage({
  eyebrow,
  heroTitle,
  heroDescription,
  directoryTitle,
  popularSearchesTitle,
  items,
  searchPlaceholder,
  emptyMessage,
  alphabetLabel
}: DirectoryIndexPageProps) {
  const searches = getPopularSearches().slice(0, 6);
  const directoryHeadingId = `${directoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-heading`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{eyebrow}</p>
        <h1 className="text-4xl font-bold text-ink">{heroTitle}</h1>
        <p className="mt-3 max-w-3xl text-muted">{heroDescription}</p>
      </section>

      <section aria-labelledby={directoryHeadingId}>
        <h2 id={directoryHeadingId} className="text-2xl font-bold text-ink">{directoryTitle}</h2>
        <SearchableCardGrid
          items={items}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          alphabetLabel={alphabetLabel}
          className="mt-5"
        />
      </section>

      {searches.length ? (
        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-2xl font-bold text-ink">{popularSearchesTitle}</h2>
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
