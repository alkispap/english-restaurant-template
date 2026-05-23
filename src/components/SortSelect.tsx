"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { buildListingsPageHref, type ListingsPageLinkValues } from "@/lib/listings-page";

type SortSelectProps = {
  values: ListingsPageLinkValues;
};

const sortOptions = [
  { label: "Highest rated", value: "rating" },
  { label: "Most reviewed", value: "reviews" },
  { label: "Lowest price", value: "price" }
] as const;

export function SortSelect({ values }: SortSelectProps) {
  const router = useRouter();
  const selectedSort = values.sort === "reviews" || values.sort === "price" ? values.sort : "rating";

  function changeSort(event: ChangeEvent<HTMLSelectElement>) {
    router.push(buildListingsPageHref(values, { sort: event.target.value, page: 1 }));
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft">
      <span>Sort by</span>
      <select
        value={selectedSort}
        onChange={changeSort}
        className="focus-ring rounded-md border border-line bg-white px-2 py-1 text-sm font-semibold text-ink"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
