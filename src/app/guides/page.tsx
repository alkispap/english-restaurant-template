import type { Metadata } from "next";
import Link from "next/link";
import { getPublicGuideArticles, guidePath } from "@/lib/articles";
import { pageShareMetadata } from "@/lib/share-metadata";

export function generateMetadata(): Metadata {
  const articles = getPublicGuideArticles();
  const title = "Indian Food and Restaurant Guides in London";
  const description =
    "Indian food and restaurant guides for understanding dishes, cuisines, takeaway, dietary options, and local restaurant choices in London.";
  const canonical = guidePath();

  return {
    title,
    description,
    alternates: {
      canonical
    },
    robots: articles.length ? undefined : { index: false, follow: true },
    ...pageShareMetadata({ title, description, path: canonical })
  };
}

export default function GuidesPage() {
  const articles = getPublicGuideArticles();

  return (
    <main className="bg-page">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Guides</p>
          <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Indian Food and Restaurant Guides in London</h1>
          <p className="mt-4 max-w-3xl text-base text-muted">
            Practical articles that explain the topic behind the directory and connect readers to useful local pages.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ink">Browse Indian Food and Restaurant Guides</h2>
        {articles.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <article key={article.slug} className="rounded-md border border-line bg-white p-5 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{article.cluster.replace(/-/g, " ")}</p>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  <Link href={guidePath(article.slug)} className="hover:text-primary">
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm text-muted">{article.metaDescription}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-line bg-white p-6 text-sm text-muted">
            No guides are published yet.
          </div>
        )}
      </section>
    </main>
  );
}
