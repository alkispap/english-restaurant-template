"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import {
  filterDirectoryCards,
  type SearchableDirectoryCard
} from "@/lib/searchable-card-filter";

type SearchableCardGridProps = {
  items: SearchableDirectoryCard[];
  searchPlaceholder: string;
  emptyMessage: string;
  alphabetLabel?: string;
  className?: string;
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function SearchableCardGrid({
  items,
  searchPlaceholder,
  emptyMessage,
  alphabetLabel,
  className
}: SearchableCardGridProps) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const visibleItems = useMemo(() => filterDirectoryCards(items, { query, letter }), [items, query, letter]);

  return (
    <div className={className}>
      <div className="grid gap-4">
        <label className="relative block">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="focus-ring h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm font-semibold text-ink placeholder:text-muted"
          />
        </label>

        <div aria-label={alphabetLabel ?? "Filter by first letter"} className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setLetter("")}
            aria-pressed={!letter}
            className={alphabetButtonClass(!letter)}
          >
            All
          </button>
          {alphabet.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLetter(item)}
              aria-pressed={letter === item}
              className={alphabetButtonClass(letter === item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring group flex min-h-32 flex-col justify-between rounded-lg border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary"
            >
              <span>
                <span className="flex items-start justify-between gap-3">
                  <span className="text-xl font-bold text-ink group-hover:text-accent">{item.label}</span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-muted">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function alphabetButtonClass(active: boolean) {
  return [
    "focus-ring h-8 min-w-8 rounded-md px-2 text-xs font-bold transition",
    active
      ? "bg-primary text-white"
      : "border border-line bg-white text-muted hover:border-primary hover:text-accent"
  ].join(" ");
}
