import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { getFeaturedCategoryCards } from "@/lib/directory";
import { categoriesIndexHeadings } from "@/lib/categories-index-headings";
import { getPopularSearches } from "@/lib/directory-growth";
import { pageShareMetadata } from "@/lib/share-metadata";

const metadataTitle = "Indian Restaurants in London by Cuisine";
const metadataDescription =
  "Browse Indian restaurant cuisines and styles in London, then compare matching restaurants by area, rating, price, and service options.";

export const metadata: Metadata = {
  title: metadataTitle,
  description: metadataDescription,
  alternates: {
    canonical: "/categories"
  },
  ...pageShareMetadata({ title: metadataTitle, description: metadataDescription, path: "/categories" })
};

export default function CategoriesPage() {
  const categories = getFeaturedCategoryCards(100);
  const searches = getPopularSearches().slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">
          {directoryConfig.categoryPluralLabel}
        </p>
        <h1 className="text-4xl font-bold text-ink">{categoriesIndexHeadings.heroTitle}</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Choose a cuisine or restaurant style to see matching {directoryConfig.listingPluralLabel.toLowerCase()},
          then refine by area, rating, price, opening status, and practical service details.
        </p>
      </section>

      <section aria-labelledby="category-directory-heading">
        <h2 id="category-directory-heading" className="text-2xl font-bold text-ink">
          {categoriesIndexHeadings.directoryTitle}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="focus-ring group flex min-h-32 flex-col justify-between rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
            >
              <span>
                <span className="flex items-start justify-between gap-3">
                  <span className="text-xl font-bold text-ink group-hover:text-accent">{category.label}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted">
                  Compare {category.count.toLocaleString()} matching {directoryConfig.listingPluralLabel.toLowerCase()}.
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {searches.length ? (
        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-2xl font-bold text-ink">{categoriesIndexHeadings.popularSearchesTitle}</h2>
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
