"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";

type SaveListingButtonProps = {
  slug: string;
  label?: string;
  compact?: boolean;
  className?: string;
};

export function SaveListingButton({ slug, label = "Save", compact = false, className = "" }: SaveListingButtonProps) {
  const { savedSlugs, toggleSavedSlug, refreshSavedSlugs } = useAccount();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(savedSlugs.includes(slug));
  }, [savedSlugs, slug]);

  useEffect(() => {
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

  async function toggleSaved() {
    const next = await toggleSavedSlug(slug);
    setIsSaved(next.includes(slug));
  }

  return (
    <button
      type="button"
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
        isSaved
          ? "border-accent bg-orange-50 text-accent dark:bg-orange-950/30"
          : "border-line bg-white text-ink hover:border-primary dark:bg-slate-800 dark:text-slate-100"
      } ${className}`}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${slug} from saved listings` : `Save ${slug}`}
      onClick={toggleSaved}
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} aria-hidden />
      {compact ? null : <span>{isSaved ? "Saved" : label}</span>}
    </button>
  );
}
