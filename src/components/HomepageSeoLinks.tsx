import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomepageSeoFeatureGroups } from "@/lib/directory-ux";

export function HomepageSeoLinks() {
  const groups = getHomepageSeoFeatureGroups();
  if (!groups.length) return null;

  return (
    <section className="mt-12 rounded-lg border border-line bg-white p-6 shadow-soft">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-ink">Browse restaurants by need</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Use these shortcuts for common restaurant searches with dedicated pages, filters, summaries, and related listings.
        </p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title}>
            <h3 className="text-base font-bold text-ink">{group.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{group.copy}</p>
            <div className="mt-4 grid gap-3">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-start justify-between gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-ink hover:bg-orange-50 hover:text-accent"
                >
                  <span>
                    {link.label}
                    {typeof link.count === "number" ? (
                      <span className="ml-1 font-semibold text-muted">({link.count.toLocaleString()})</span>
                    ) : null}
                  </span>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
