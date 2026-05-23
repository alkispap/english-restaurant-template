"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { openStatus } from "@/lib/opening-hours";
import type { OpeningHours } from "@/data/listings";

type OpenStatusBadgeProps = {
  workingHours?: OpeningHours[];
  /** compact keeps the small pill style while preserving useful timing text. */
  compact?: boolean;
};

export function OpenStatusBadge({ workingHours, compact = false }: OpenStatusBadgeProps) {
  const [status, setStatus] = useState<{ isOpen: boolean; label: string } | null>(null);

  useEffect(() => {
    if (!workingHours?.length) return;

    setStatus(openStatus(workingHours));

    // Refresh every 60 seconds so the badge stays current
    const interval = setInterval(() => {
      setStatus(openStatus(workingHours));
    }, 60_000);

    return () => clearInterval(interval);
  }, [workingHours]);

  // Don't render during SSR or if no hours data
  if (!status || !workingHours?.length) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        status.isOpen
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      <Clock className={compact ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4 shrink-0"} aria-hidden />
      <span>{status.label}</span>
    </span>
  );
}
