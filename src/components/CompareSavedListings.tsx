"use client";

import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import {
  getCompareFields,
  DEFAULT_SHORTLIST_LIMIT,
  type ShortlistListingSummary
} from "@/lib/shortlist";
import { trackDirectoryEvent } from "@/lib/directory-analytics";
import { directoryConfig } from "@/config/directory";

export function CompareSavedListings() {
  const { authEnabled, user, savedSlugs, noteBySlug, removeSavedSlug, refreshSavedSlugs, loadNotesForSlugs } = useAccount();
  const [isReady, setIsReady] = useState(false);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [savedListings, setSavedListings] = useState<ShortlistListingSummary[]>([]);
  const missingCount = savedSlugs.length - savedListings.length;

  useEffect(() => {
    void refreshSavedSlugs().finally(() => setIsReady(true));

    function handleChange() {
      void refreshSavedSlugs();
    }

    window.addEventListener("directory-shortlist-change", handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener("directory-shortlist-change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, [refreshSavedSlugs]);

  useEffect(() => {
    if (user && savedSlugs.length) {
      void loadNotesForSlugs(savedSlugs);
    }
  }, [user, savedSlugs, loadNotesForSlugs]);

  useEffect(() => {
    if (!isReady) return;
    if (!savedSlugs.length) {
      setSavedListings([]);
      setIsLoadingSummaries(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingSummaries(true);

    fetch("/api/shortlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ slugs: savedSlugs }),
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load saved listings"))))
      .then((payload: { listings?: ShortlistListingSummary[] }) => {
        setSavedListings(Array.isArray(payload.listings) ? payload.listings : []);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setSavedListings([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSummaries(false);
        }
      });

    return () => controller.abort();
  }, [isReady, savedSlugs]);

  async function removeListing(slug: string) {
    await removeSavedSlug(slug);
    trackDirectoryEvent({
      pageType: "compare",
      action: "remove_saved_listing",
      route: "/compare",
      listingSlug: slug
    });
  }

  if (!isReady || isLoadingSummaries) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-soft">
        <h2 className="text-2xl font-bold text-ink">Loading saved listings</h2>
      </section>
    );
  }

  if (!savedSlugs.length) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center shadow-soft">
        <h2 className="text-2xl font-bold text-ink">No saved listings yet</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Save listings from the directory cards or detail pages, then compare them here.</p>
        {authEnabled && !user ? (
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">Sign in from the header to keep saved listings across devices.</p>
        ) : null}
        <Link href="/" className="mt-6 inline-flex rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">
          Browse {directoryConfig.listingPluralLabel.toLowerCase()}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white shadow-soft">
      <div className="border-b border-line p-5">
        <h2 className="text-2xl font-bold text-ink">Saved listings</h2>
        <p className="mt-2 text-sm text-muted">
          Comparing {savedListings.length.toLocaleString()} of {DEFAULT_SHORTLIST_LIMIT.toLocaleString()} saved listings.
          {missingCount > 0 ? ` ${missingCount.toLocaleString()} saved item could not be found in this directory.` : ""}
        </p>
        {authEnabled && !user ? (
          <p className="mt-2 text-sm font-semibold text-accent">Saved listings stay in this browser. Sign in to sync across devices.</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-line bg-white p-4 text-muted">Field</th>
              {savedListings.map((listing) => (
                <th key={listing.slug} className="min-w-64 border-b border-line p-4 align-top">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={listing.href}
                      onClick={() =>
                        trackDirectoryEvent({
                          pageType: "compare",
                          action: "compare_listing_click",
                          route: "/compare",
                          listingSlug: listing.slug,
                          label: listing.name
                        })
                      }
                      className="font-bold text-ink hover:text-primary"
                    >
                      {listing.name}
                    </Link>
                    <button
                      type="button"
                      className="focus-ring rounded-md border border-line p-1.5 text-muted hover:text-accent"
                      aria-label={`Remove ${listing.name}`}
                      onClick={() => removeListing(listing.slug)}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getCompareFields().map((field) => (
              <tr key={field.id}>
                <th className="sticky left-0 z-10 border-b border-line bg-white p-4 font-bold text-ink">{field.label}</th>
                {savedListings.map((listing) => (
                  <td key={`${listing.slug}-${field.id}`} className="border-b border-line p-4 align-top text-muted">
                    <CompareValue fieldId={field.id} listing={listing} note={noteBySlug[listing.slug]} signedIn={Boolean(user)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompareValue({
  fieldId,
  listing,
  note,
  signedIn
}: {
  fieldId: ReturnType<typeof getCompareFields>[number]["id"];
  listing: ShortlistListingSummary;
  note?: string;
  signedIn: boolean;
}) {
  if (fieldId === "rating") return listing.ratingLabel;
  if (fieldId === "reviews") return listing.reviewLabel;
  if (fieldId === "price") return listing.priceLabel;
  if (fieldId === "area") return listing.areaLabel;
  if (fieldId === "openStatus") return <OpenStatusBadge workingHours={listing.workingHours} compact />;
  if (fieldId === "categories") return listing.categoriesLabel;
  if (fieldId === "dietary") return listing.dietaryLabel;
  if (fieldId === "services") return listing.servicesLabel;
  if (fieldId === "parking") return listing.parkingLabel;
  if (fieldId === "notes") return signedIn ? note || "No private note" : "Sign in to add notes";

  return (
    <div className="flex flex-wrap gap-2">
      <CompareLink href={listing.websiteUrl} label="Website" listingSlug={listing.slug} />
      <CompareLink href={listing.menuUrl} label="Menu" listingSlug={listing.slug} />
      <CompareLink href={listing.bookingUrl} label="Book" listingSlug={listing.slug} />
    </div>
  );
}

function CompareLink({ href, label, listingSlug }: { href?: string; label: string; listingSlug: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        trackDirectoryEvent({
          pageType: "compare",
          action: "compare_action_click",
          route: "/compare",
          listingSlug,
          label,
          targetUrl: href
        })
      }
      className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-bold text-ink hover:border-primary"
    >
      {label}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}
