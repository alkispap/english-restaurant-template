import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { getFeaturedAreas } from "@/lib/directory";
import { getPopularSearches } from "@/lib/directory-growth";

export const metadata: Metadata = {
  title: `Restaurant areas in ${siteConfig.cityOrRegion}`,
  description: `Browse ${directoryConfig.listingPluralLabel.toLowerCase()} by London area, then narrow by cuisine, rating, price, service options, and opening status.`,
  alternates: {
    canonical: "/areas"
  }
};

export default function AreasPage() {
  const areas = getFeaturedAreas(100);
  const searches = getPopularSearches().slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">Area directory</p>
        <h1 className="text-4xl font-bold text-ink">Browse restaurants by area in {siteConfig.cityOrRegion}</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Start with a London area, then compare matching {directoryConfig.listingPluralLabel.toLowerCase()} by
          rating, cuisine, price, service options, and opening details.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Link
            key={area.slug}
            href={`/areas/${area.slug}`}
            className="focus-ring group flex min-h-32 flex-col justify-between rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
          >
            <span>
              <span className="flex items-start justify-between gap-3">
                <span className="text-xl font-bold text-ink group-hover:text-accent">{area.label}</span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted">
                Compare {area.count.toLocaleString()} {directoryConfig.listingPluralLabel.toLowerCase()} in {area.label}.
              </span>
            </span>
          </Link>
        ))}
      </section>

      {searches.length ? (
        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-2xl font-bold text-ink">Popular restaurant searches</h2>
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
