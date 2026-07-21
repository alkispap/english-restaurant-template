import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { directoryIndexPath } from "@/lib/routes";

export function ListingUnderReview({ name, slug }: { name: string; slug: string }) {
  return (
    <main className="bg-paper px-4 py-16 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-8 text-center shadow-soft sm:p-12">
        <AlertTriangle className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <h1 className="mt-5 text-3xl font-bold text-ink">{name} is under editorial review</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
          This listing has been temporarily withheld while its identity or current information is checked. We are not making a closure claim, and operational details are not shown until the review is resolved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={directoryIndexPath()} className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">
            Browse {directoryConfig.listingPluralLabel.toLowerCase()}
          </Link>
          <Link href={`/suggest-update?restaurant=${encodeURIComponent(name)}&listing=${encodeURIComponent(slug)}`} className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink">
            Suggest an update
          </Link>
        </div>
      </section>
    </main>
  );
}
