"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { useAccount } from "@/components/AccountProvider";
import { trackDirectoryEvent } from "@/lib/directory-analytics";

export function SavedListingsLink() {
  const { savedSlugs } = useAccount();
  const shortlist = directoryConfig.shortlist;

  return (
    <Link
      href={shortlist.comparePath}
      prefetch={false}
      onClick={() =>
        trackDirectoryEvent({
          pageType: "compare",
          action: "compare_open",
          route: shortlist.comparePath
        })
      }
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-bold text-ink hover:border-primary"
    >
      <Heart className="h-4 w-4 text-primary" aria-hidden />
      <span className="hidden sm:inline">{shortlist.label}</span>
      <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">{savedSlugs.length}</span>
    </Link>
  );
}
