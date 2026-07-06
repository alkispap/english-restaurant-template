"use client";

import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { directorySearchPath } from "@/lib/routes";
import { buildSearchHref } from "@/lib/search-url";

type HeaderSearchProps = {
  className?: string;
  onSearch?: () => void;
};

export function HeaderSearch({ className = "", onSearch }: HeaderSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSearch?.();
    window.location.assign(
      buildSearchHref({
        q: String(formData.get("q") ?? "")
      }, directorySearchPath())
    );
  }

  return (
    <form
      action={directorySearchPath()}
      method="get"
      onSubmit={handleSubmit}
      role="search"
      aria-label={`Search ${directoryConfig.listingPluralLabel.toLowerCase()}`}
      className={`flex h-11 min-w-0 items-center rounded-full border border-line bg-white px-4 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-orange-100 ${className}`}
    >
      <Search className="h-5 w-5 shrink-0 text-ink" aria-hidden />
      <input
        name="q"
        type="search"
        placeholder={`${directoryConfig.listingLabel}, category, keyword...`}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}
