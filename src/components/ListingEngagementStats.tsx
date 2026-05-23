"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";

type ListingEngagementStatsProps = {
  slug: string;
};

type EngagementStats = {
  watchingNow: number;
  totalViews: number;
};

export function ListingEngagementStats({ slug }: ListingEngagementStatsProps) {
  const [stats, setStats] = useState(() => getInitialStats(slug));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStats((current) => ({
        ...current,
        watchingNow: nextWatchingCount(slug, current.watchingNow)
      }));
    }, 9000);

    return () => window.clearInterval(interval);
  }, [slug]);

  return (
    <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted" aria-label="Listing activity">
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-semibold shadow-soft">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-bold text-ink">{stats.watchingNow}</span>
        watching now
      </span>
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-semibold shadow-soft">
        <Eye className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-bold text-ink">{stats.totalViews.toLocaleString()}</span>
        total views
      </span>
    </div>
  );
}

function getInitialStats(slug: string): EngagementStats {
  const seed = hashSlug(slug);

  return {
    watchingNow: 8 + (seed % 18),
    totalViews: 1800 + (seed % 7200)
  };
}

function nextWatchingCount(slug: string, current: number) {
  const seed = hashSlug(`${slug}-${current}`);
  const movement = (seed % 5) - 2;
  const next = current + movement;

  return Math.min(29, Math.max(6, next));
}

function hashSlug(value: string) {
  return Array.from(value).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 100000;
  }, 17);
}
