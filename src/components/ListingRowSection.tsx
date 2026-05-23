"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import type { DirectoryListingRow } from "@/lib/directory-ux";

type ListingRowSectionProps = {
  row: DirectoryListingRow;
};

export function ListingRowSection({ row }: ListingRowSectionProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const initialScrollLeftRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollControls = useCallback(() => {
    const rowElement = rowRef.current;
    if (!rowElement) return;

    initialScrollLeftRef.current ??= rowElement.scrollLeft;
    const startScrollLeft = initialScrollLeftRef.current;
    const maxScrollLeft = rowElement.scrollWidth - rowElement.clientWidth;
    setCanScrollLeft(rowElement.scrollLeft > startScrollLeft + 4);
    setCanScrollRight(rowElement.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const rowElement = rowRef.current;
    if (!rowElement) return;

    initialScrollLeftRef.current = null;
    updateScrollControls();
    rowElement.addEventListener("scroll", updateScrollControls, { passive: true });
    window.addEventListener("resize", updateScrollControls);

    return () => {
      rowElement.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [row.listings.length, updateScrollControls]);

  function scrollByDirection(direction: -1 | 1) {
    const rowElement = rowRef.current;
    if (!rowElement) return;

    rowElement.scrollBy({
      left: Math.round(rowElement.clientWidth * 0.82) * direction,
      behavior: "smooth"
    });
  }

  if (!row.listings.length) return null;

  return (
    <section className="border-t border-line py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">{row.title}</h2>
          {row.copy ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{row.copy}</p> : null}
        </div>
        <Link href={row.seeAllHref} className="shrink-0 text-sm font-bold text-ink underline underline-offset-4 hover:text-primary">
          See all
        </Link>
      </div>
      <div className="relative">
        <div
          ref={rowRef}
          className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto scroll-smooth px-4 pb-3 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {row.listings.map((listing) => (
            <div key={listing.slug} className="w-[260px] shrink-0 snap-start sm:w-[300px]">
              <ListingCard listing={listing} compact />
            </div>
          ))}
        </div>
        {canScrollLeft ? (
          <button
            type="button"
            className="focus-ring absolute left-1 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ink bg-white text-ink shadow-soft transition hover:border-primary hover:text-primary md:grid"
            aria-label={`Scroll ${row.title} listings left`}
            onClick={() => scrollByDirection(-1)}
          >
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
        {canScrollRight ? (
          <button
            type="button"
            className="focus-ring absolute right-1 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ink bg-white text-ink shadow-soft transition hover:border-primary hover:text-primary md:grid"
            aria-label={`Scroll ${row.title} listings right`}
            onClick={() => scrollByDirection(1)}
          >
            <ArrowRight className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
