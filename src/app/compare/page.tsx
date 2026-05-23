import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareSavedListings } from "@/components/CompareSavedListings";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { listings } from "@/data/listings";
import { getAllShortlistListingSummaries } from "@/lib/shortlist";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";

export const metadata: Metadata = {
  title: `Compare saved ${directoryConfig.listingPluralLabel.toLowerCase()}`,
  description: `Compare saved ${directoryConfig.listingPluralLabel.toLowerCase()} from ${siteConfig.siteName}.`
};

export default function ComparePage() {
  if (!isDirectoryFeatureEnabled("shortlist")) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-lg bg-ink p-7 text-white">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-orange-200">Shortlist</p>
        <h1 className="text-4xl font-bold">Compare saved {directoryConfig.listingPluralLabel.toLowerCase()}</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Compare without an account, or sign in to sync saved restaurants and private notes across devices.
        </p>
      </section>
      <CompareSavedListings listings={getAllShortlistListingSummaries(listings)} />
    </main>
  );
}
